/**
 * Automated Unit Tests cho Gói 3 — Báo cáo (FR-10), Thông báo (FR-13/EX-02) & Tái tục (FR-14)
 * Chạy: npm test (trong thư mục backend/)
 */
const { describe, it, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/db');
const reportService = require('../services/admin/report.service');
const maturityJobService = require('../services/admin/maturityJob.service');
const rolloverJobService = require('../services/admin/rolloverJob.service');
const soTietKiemRepo = require('../repositories/soTietKiem.repo');
const laiSuatRepo = require('../repositories/laiSuat.repo');
const heThongRepo = require('../repositories/heThong.repo');
const taiKhoanRepo = require('../repositories/taiKhoan.repo');
const notificationService = require('../services/admin/notification.service');
const { ROLLOVER_MODE, NOTIFY_STATUS } = require('../config/constants');

afterEach(() => {
    mock.restoreAll();
});

describe('Gói 3 — Báo cáo, Nhắc đáo hạn & Tái tục tự động (FR-10, FR-13, FR-14)', () => {
    it('FR-10: từ chối báo cáo nếu ngày kết thúc < ngày bắt đầu (400 INVALID_DATE_RANGE)', async () => {
        await assert.rejects(
            () => reportService.generateReport({ from: '2026-11-10', to: '2026-11-01' }),
            (err) => err.statusCode === 400 && err.errorCode === 'INVALID_DATE_RANGE'
        );
    });

    it('FR-13: quét danh sách sổ sắp đáo hạn và ghi nhận số tin gửi thành công', async () => {
        mock.method(soTietKiemRepo, 'locSoSapDaoHan', async () => [
            {
                so_tiet_kiem_id: 1,
                khach_hang_id: 3,
                ma_so: 'STK001090',
                chu_ky_id: 1,
                so_tien_goc: 50000000,
                lai_suat_ap_dung: 3.5,
                ngay_bat_dau: '2026-08-01',
                ngay_dao_han: '2026-11-01',
                so_dien_thoai: '0987654321'
            }
        ]);
        mock.method(notificationService, 'dispatchNotification', async () => ({
            thongBaoId: 10,
            status: NOTIFY_STATUS.SENT
        }));

        const res = await maturityJobService.runMaturityReminderScan(3);
        assert.equal(res.scannedCount, 1);
        assert.equal(res.sentCount, 1);
        assert.equal(res.failedCount, 0);
    });

    it('FR-14: tái tục cộng dồn gốc + lãi sang chu kỳ mới và bỏ qua sổ KHONG_TAI_TUC', async () => {
        mock.method(db.pool, 'getConnection', async () => ({
            beginTransaction: async () => {},
            commit: async () => {},
            rollback: async () => {},
            release: () => {}
        }));
        mock.method(soTietKiemRepo, 'locSoToiHanHomNay', async () => [
            {
                so_tiet_kiem_id: 1,
                khach_hang_id: 3,
                ma_so: 'STK001090',
                chu_ky_id: 1,
                ky_han_id: 2,
                bieu_lai_suat_id: 2,
                so_thu_tu_chu_ky: 1,
                so_tien_goc: 50000000,
                lai_suat_ap_dung: 3.5,
                ngay_bat_dau: '2026-08-01',
                ngay_dao_han: '2026-11-01',
                chi_thi_dao_han: ROLLOVER_MODE.PRINCIPAL_AND_INTEREST,
                thoi_han: 3,
                don_vi_thoi_han: 'THANG'
            },
            {
                so_tiet_kiem_id: 2,
                khach_hang_id: 2,
                ma_so: 'STK001099',
                chu_ky_id: 9,
                ky_han_id: 2,
                bieu_lai_suat_id: 2,
                so_thu_tu_chu_ky: 1,
                so_tien_goc: 10000000,
                lai_suat_ap_dung: 3.5,
                ngay_bat_dau: '2026-08-01',
                ngay_dao_han: '2026-11-01',
                chi_thi_dao_han: ROLLOVER_MODE.NONE,
                thoi_han: 3,
                don_vi_thoi_han: 'THANG'
            }
        ]);
        mock.method(laiSuatRepo, 'layThongTinKyHanVaLaiSuat', async () => ({
            bieu_lai_suat_id: 2,
            lai_suat_nam: 3.5
        }));
        let capturedNewPrincipal = 0;
        let capturedNextMaturity = '';
        mock.method(soTietKiemRepo, 'dongChuKyCuVaMoChuKyMoi', async (payload) => {
            capturedNewPrincipal = payload.soTienGocMoi;
            capturedNextMaturity = payload.ngayDaoHanMoi;
            return { chuKyMoiId: 11 };
        });
        mock.method(notificationService, 'dispatchNotification', async () => ({
            thongBaoId: 12,
            status: NOTIFY_STATUS.SENT
        }));

        const res = await rolloverJobService.runAutoRollover(1);
        assert.equal(res.dueCount, 2);
        assert.equal(res.rolledOverCount, 1);
        assert.equal(res.skippedCount, 1);

        const expectedInterest = Math.round((50000000 * 3.5 * 92) / (100 * 365));
        assert.equal(capturedNewPrincipal, 50000000 + expectedInterest);
        assert.equal(capturedNextMaturity, '2027-02-01');
    });

    it('FR-10: báo cáo SO_DEN_HAN lọc theo khoảng ngay_dao_han thay vì ngay_mo', async () => {
        const capturedSqls = [];
        mock.method(db.pool, 'execute', async (sql, params) => {
            capturedSqls.push({ sql, params });
            return [[{ tong_thu_gui: 0, tong_chi_goc: 0, tong_chi_lai: 0 }]];
        });

        await heThongRepo.tongHopDuLieuBaoCao({
            loaiBaoCao: 'SO_DEN_HAN',
            trangThai: 'ALL',
            from: '2026-11-01',
            to: '2026-11-30'
        });

        assert.ok(capturedSqls[0].sql.includes('ck.ngay_dao_han BETWEEN ? AND ?'));
        assert.equal(capturedSqls[0].sql.includes('stk.ngay_mo BETWEEN'), false);
    });

    it('FR-11: Admin tạo tài khoản KHACH_HANG tự động khởi tạo TAI_KHOAN_THANH_TOAN mặc định', async () => {
        const executedSqls = [];
        const fakeConn = {
            execute: async (sql) => {
                executedSqls.push(sql);
                if (sql.includes('INSERT INTO')) return [{ insertId: 12 }];
                return [[{ tai_khoan_id: 12, nguoi_dung_id: 12, ten_dang_nhap: 'kh_new' }]];
            }
        };

        await taiKhoanRepo.taoTaiKhoanVaGanVaiTro(
            {
                hoTen: 'Khách Mới',
                email: 'khnew@example.com',
                soDienThoai: '0909998877',
                tenDangNhap: 'kh_new',
                matKhauBam: 'hash',
                vaiTroId: 4,
                tenVaiTro: 'KHACH_HANG'
            },
            fakeConn
        );

        assert.ok(executedSqls.some((s) => s.includes('INSERT INTO TAI_KHOAN_THANH_TOAN')));
    });
});
