/**
 * Automated Unit Tests cho Gói 2 — Core Banking Transactions (FR-03, FR-04, FR-07, EX-03, FR-09)
 * Chạy: npm test (trong thư mục backend/)
 */
const { describe, it, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/db');
const savingsTxService = require('../services/transaction/savingsTx.service');
const settlementService = require('../services/transaction/settlement.service');
const passbookStatusService = require('../services/inquiry/passbookStatus.service');
const laiSuatRepo = require('../repositories/laiSuat.repo');
const taiKhoanRepo = require('../repositories/taiKhoan.repo');
const khachHangRepo = require('../repositories/khachHang.repo');
const soTietKiemRepo = require('../repositories/soTietKiem.repo');
const notificationService = require('../services/admin/notification.service');
const { PASSBOOK_STATUS, ROLES } = require('../config/constants');

afterEach(() => {
    mock.restoreAll();
});

describe('Gói 2 — Mở sổ Online & Tại quầy (FR-03, FR-04)', () => {
    it('FR-03: từ chối nếu số tiền < mức tối thiểu của sản phẩm (400 BELOW_MIN_AMOUNT)', async () => {
        mock.method(laiSuatRepo, 'layThongTinKyHanVaLaiSuat', async () => ({
            ky_han_id: 2,
            ten_san_pham: 'Tiết kiệm Thông thường VND',
            so_tien_toi_thieu: 100000,
            thoi_han: 3,
            don_vi_thoi_han: 'THANG',
            loai_ky_han: 'CO_KY_HAN',
            trang_thai_ky_han: 'HOAT_DONG',
            bieu_lai_suat_id: 2,
            lai_suat_nam: 3.5
        }));

        await assert.rejects(
            () =>
                savingsTxService.openOnline(
                    { taiKhoanId: 4, khachHangId: 1, hoTen: 'Trần Thị Mai' },
                    { kyHanId: 2, soTienGui: 50000 }
                ),
            (err) => err.statusCode === 400 && err.errorCode === 'BELOW_MIN_AMOUNT'
        );
    });

    it('FR-03: từ chối nếu số dư tài khoản thanh toán không đủ (400 INSUFFICIENT_BALANCE)', async () => {
        mock.method(laiSuatRepo, 'layThongTinKyHanVaLaiSuat', async () => ({
            ky_han_id: 2,
            ten_san_pham: 'Tiết kiệm Thông thường VND',
            so_tien_toi_thieu: 100000,
            thoi_han: 3,
            don_vi_thoi_han: 'THANG',
            loai_ky_han: 'CO_KY_HAN',
            trang_thai_ky_han: 'HOAT_DONG',
            bieu_lai_suat_id: 2,
            lai_suat_nam: 3.5
        }));
        mock.method(db.pool, 'getConnection', async () => ({
            beginTransaction: async () => {},
            commit: async () => {},
            rollback: async () => {},
            release: () => {}
        }));
        mock.method(taiKhoanRepo, 'layTaiKhoanThanhToanMacDinhVaKhoa', async () => ({
            tai_khoan_thanh_toan_id: 1,
            so_du: 5000000
        }));

        await assert.rejects(
            () =>
                savingsTxService.openOnline(
                    { taiKhoanId: 4, khachHangId: 1, hoTen: 'Trần Thị Mai' },
                    { kyHanId: 2, soTienGui: 10000000 }
                ),
            (err) => err.statusCode === 400 && err.errorCode === 'INSUFFICIENT_BALANCE'
        );
    });

    it('FR-03: trừ tiền và tạo sổ thành công trong Transaction + kích hoạt EX-02', async () => {
        mock.method(laiSuatRepo, 'layThongTinKyHanVaLaiSuat', async () => ({
            ky_han_id: 2,
            ten_san_pham: 'Tiết kiệm Thông thường VND',
            so_tien_toi_thieu: 100000,
            thoi_han: 3,
            don_vi_thoi_han: 'THANG',
            loai_ky_han: 'CO_KY_HAN',
            trang_thai_ky_han: 'HOAT_DONG',
            bieu_lai_suat_id: 2,
            lai_suat_nam: 3.5
        }));
        mock.method(db.pool, 'getConnection', async () => ({
            beginTransaction: async () => {},
            commit: async () => {},
            rollback: async () => {},
            release: () => {}
        }));
        mock.method(taiKhoanRepo, 'layTaiKhoanThanhToanMacDinhVaKhoa', async () => ({
            tai_khoan_thanh_toan_id: 1,
            so_du: 150000000
        }));
        const debitMock = mock.method(taiKhoanRepo, 'truTienThanhToan', async () => {});
        const createMock = mock.method(soTietKiemRepo, 'taoBanGhiSoMoi', async ({ maSo }) => ({
            soTietKiemId: 10,
            chuKyId: 10,
            giaoDichId: 10,
            maSo
        }));
        const notifyMock = mock.method(notificationService, 'sendOpenPassbookConfirmation', async () => ({
            thongBaoId: 1,
            status: 'DA_GUI'
        }));

        const res = await savingsTxService.openOnline(
            { taiKhoanId: 4, khachHangId: 1, hoTen: 'Trần Thị Mai' },
            { kyHanId: 2, soTienGui: 20000000 }
        );

        assert.equal(debitMock.mock.callCount(), 1);
        assert.equal(createMock.mock.callCount(), 1);
        assert.equal(notifyMock.mock.callCount(), 1);
        assert.equal(res.soDuConLai, 130000000);
    });

    it('FR-04: báo lỗi 404 CUSTOMER_PROFILE_REQUIRED khi chưa có hồ sơ CCCD', async () => {
        mock.method(khachHangRepo, 'layThongTinHoSoTheoCCCD', async () => null);
        await assert.rejects(
            () =>
                savingsTxService.openAtCounter(
                    { taiKhoanId: 2, nhanVienId: 1 },
                    { soCccd: '079999999999', kyHanId: 2, soTienGui: 10000000 }
                ),
            (err) => err.statusCode === 404 && err.errorCode === 'CUSTOMER_PROFILE_REQUIRED'
        );
    });
});

describe('Gói 2 — Tất toán & Trạng thái sổ (FR-07, EX-03, FR-09)', () => {
    it('EX-03: tính lãi không kỳ hạn 0.15%/năm và gắn cảnh báo khi rút trước hạn', () => {
        const metrics = settlementService.computeSettlementMetrics(
            {
                ma_so: 'STK001092',
                trang_thai: PASSBOOK_STATUS.ACTIVE,
                chuKyHienTai: {
                    chu_ky_id: 3,
                    so_tien_goc: 100000000,
                    lai_suat_ap_dung: 5.8,
                    ngay_bat_dau: '2026-11-01',
                    ngay_dao_han: '2027-05-01'
                }
            },
            '2026-12-01',
            { lai_suat_nam: 0.15 }
        );

        assert.equal(metrics.isBeforeMaturity, true);
        assert.equal(metrics.laiSuatApDung, 0.15);
        assert.equal(metrics.soNgayThucGui, 30);
        assert.ok(metrics.canhBao.includes('trước hạn'));
        assert.equal(metrics.tienLai, Math.round((100000000 * 0.15 * 30) / (100 * 365)));
    });

    it('FR-07: từ chối tất toán sổ đang PHONG_TOA và chặn khách hàng tất toán sổ người khác', async () => {
        mock.method(soTietKiemRepo, 'layChiTietSo', async () => ({
            ma_so: 'STK001090',
            khach_hang_id: 3,
            trang_thai: PASSBOOK_STATUS.FROZEN,
            chu_ky_id: 1,
            so_tien_goc: 50000000,
            lai_suat_ap_dung: 3.5,
            ngay_bat_dau: '2026-08-01',
            ngay_dao_han: '2026-11-01'
        }));

        await assert.rejects(
            () =>
                settlementService.previewSettlement('STK001090', {
                    khachHangId: 1,
                    roles: [ROLES.CUSTOMER]
                }),
            (err) => err.statusCode === 403 && err.errorCode === 'FORBIDDEN'
        );

        await assert.rejects(
            () =>
                settlementService.previewSettlement('STK001090', {
                    nhanVienId: 1,
                    roles: [ROLES.TELLER]
                }),
            (err) => err.statusCode === 400 && err.errorCode === 'INVALID_STATUS_TRANSITION'
        );
    });

    it('FR-09: kiểm tra State Machine chuyển trạng thái hợp lệ và cấm sửa sổ đã tất toán', () => {
        assert.doesNotThrow(() =>
            passbookStatusService.assertValidStatusTransition(PASSBOOK_STATUS.ACTIVE, PASSBOOK_STATUS.FROZEN)
        );
        assert.doesNotThrow(() =>
            passbookStatusService.assertValidStatusTransition(PASSBOOK_STATUS.FROZEN, PASSBOOK_STATUS.ACTIVE)
        );
        assert.throws(
            () => passbookStatusService.assertValidStatusTransition(PASSBOOK_STATUS.SETTLED, PASSBOOK_STATUS.ACTIVE),
            (err) => err.statusCode === 400 && err.errorCode === 'INVALID_STATUS_TRANSITION'
        );
    });
});
