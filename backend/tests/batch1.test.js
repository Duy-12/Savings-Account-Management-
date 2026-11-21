/**
 * Automated Unit & Middleware Tests cho Gói 0 + Gói 1 (FR-01, EX-01, FR-06, FR-11, FR-12)
 * Chạy: npm test (trong thư mục backend/)
 */
const { describe, it, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const interestService = require('../services/transaction/interest.service');
const authService = require('../services/account/auth.service');
const rateConfigService = require('../services/admin/rateConfig.service');
const adminAccountService = require('../services/account/adminAccount.service');
const taiKhoanRepo = require('../repositories/taiKhoan.repo');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { ROLES, ACCOUNT_STATUS } = require('../config/constants');

afterEach(() => {
    mock.restoreAll();
});

describe('Gói 1 — Interest Engine (FR-06)', () => {
    it('tính đúng lãi đơn theo ngày thực tế / 365', () => {
        const interest = interestService.calculateSimpleInterest(50000000, 3.5, 92);
        assert.equal(interest, Math.round((50000000 * 3.5 * 92) / (100 * 365)));
    });

    it('trả về 0 khi tiền gốc hoặc số ngày <= 0', () => {
        assert.equal(interestService.calculateSimpleInterest(0, 3.5, 30), 0);
        assert.equal(interestService.calculateSimpleInterest(1000000, 3.5, 0), 0);
    });

    it('tính đúng ngày đáo hạn cho kỳ hạn 3 tháng & không kỳ hạn', () => {
        assert.equal(interestService.calculateMaturityDate('2026-08-01', 3, 'THANG'), '2026-11-01');
        assert.equal(interestService.calculateMaturityDate('2026-10-15', 0, 'THANG'), null);
    });

    it('ném lỗi 400 nếu tiền gốc <= 0 hoặc ngày kết thúc < ngày bắt đầu', async () => {
        await assert.rejects(
            () =>
                interestService.calculateExpectedInterest({
                    soTienGoc: -1000,
                    laiSuatNam: 3.5,
                    ngayBatDau: '2026-01-01',
                    ngayTinhDen: '2026-02-01'
                }),
            (err) => err.statusCode === 400 && err.errorCode === 'VALIDATION_ERROR'
        );

        await assert.rejects(
            () =>
                interestService.calculateExpectedInterest({
                    soTienGoc: 1000000,
                    laiSuatNam: 3.5,
                    ngayBatDau: '2026-05-10',
                    ngayTinhDen: '2026-05-01'
                }),
            (err) => err.statusCode === 400 && err.errorCode === 'VALIDATION_ERROR'
        );
    });
});

describe('Gói 0/1 — Authentication & Lockout (FR-01, EX-01)', () => {
    it('trả về 401 khi sai mật khẩu (< 5 lần) và 423 khi chạm mốc 5 lần', async () => {
        const hash = await bcrypt.hash('Correct@123', 4);
        mock.method(taiKhoanRepo, 'layThongTinTaiKhoan', async () => ({
            tai_khoan_id: 99,
            nguoi_dung_id: 99,
            ten_dang_nhap: 'kh_test',
            mat_khau_bam: hash,
            trang_thai: ACCOUNT_STATUS.ACTIVE,
            so_lan_dang_nhap_sai: 3,
            khoa_den: null,
            ho_ten: 'Test User',
            email: 'test@example.com',
            so_dien_thoai: '0901234567',
            roles: [ROLES.CUSTOMER],
            permissions: []
        }));

        let fails = 3;
        mock.method(taiKhoanRepo, 'tangSoLanNhapSai', async () => {
            fails += 1;
            return fails;
        });
        const lockMock = mock.method(taiKhoanRepo, 'khoaTaiKhoan', async () => {});

        await assert.rejects(
            () => authService.login('kh_test', 'WrongPass'),
            (err) => err.statusCode === 401 && err.errorCode === 'INVALID_CREDENTIALS'
        );
        assert.equal(lockMock.mock.callCount(), 0);

        await assert.rejects(
            () => authService.login('kh_test', 'WrongPass'),
            (err) => err.statusCode === 423 && err.errorCode === 'ACCOUNT_LOCKED'
        );
        assert.equal(lockMock.mock.callCount(), 1);
    });

    it('đăng nhập thành công khi đúng mật khẩu & cấp JWT hợp lệ', async () => {
        const hash = await bcrypt.hash('Correct@123', 4);
        mock.method(taiKhoanRepo, 'layThongTinTaiKhoan', async () => ({
            tai_khoan_id: 2,
            nguoi_dung_id: 2,
            nhan_vien_id: 1,
            ten_dang_nhap: 'teller01',
            mat_khau_bam: hash,
            trang_thai: ACCOUNT_STATUS.ACTIVE,
            so_lan_dang_nhap_sai: 0,
            khoa_den: null,
            ho_ten: 'Nguyễn Văn A',
            email: 'teller01@savingsbank.vn',
            so_dien_thoai: '0901000002',
            roles: [ROLES.TELLER],
            permissions: ['SO_TIET_KIEM_MO']
        }));
        mock.method(taiKhoanRepo, 'resetNhapSaiVaCapNhatDangNhapCuoi', async () => {});

        const result = await authService.login('teller01', 'Correct@123');
        assert.ok(result.token);
        assert.equal(result.user.tenDangNhap, 'teller01');
        assert.deepEqual(result.user.roles, [ROLES.TELLER]);
    });

    it('chặn tài khoản bị Admin khóa thủ công (khoa_den = NULL) cả lúc login lẫn gọi API qua JWT', async () => {
        const hash = await bcrypt.hash('Correct@123', 4);
        const lockedRow = {
            tai_khoan_id: 7,
            nguoi_dung_id: 7,
            ten_dang_nhap: 'locked_user',
            mat_khau_bam: hash,
            trang_thai: ACCOUNT_STATUS.TEMP_LOCKED,
            so_lan_dang_nhap_sai: 0,
            khoa_den: null,
            ho_ten: 'Locked User',
            roles: [ROLES.CUSTOMER],
            permissions: []
        };
        mock.method(taiKhoanRepo, 'layThongTinTaiKhoan', async () => lockedRow);
        mock.method(taiKhoanRepo, 'layThongTinTaiKhoanTheoId', async () => lockedRow);

        await assert.rejects(
            () => authService.login('locked_user', 'Correct@123'),
            (err) => err.statusCode === 423 && err.errorCode === 'ACCOUNT_LOCKED'
        );

        const token = jwt.sign({ taiKhoanId: 7 }, env.jwt.secret);
        await new Promise((resolve) => {
            authenticate(
                { headers: { authorization: `Bearer ${token}` } },
                {},
                (err) => {
                    assert.equal(err.statusCode, 423);
                    assert.equal(err.errorCode, 'ACCOUNT_LOCKED');
                    resolve();
                }
            );
        });
    });

    it('tự động reset chu kỳ đếm sai khi khóa 15 phút đã hết hạn (khoa_den <= now)', async () => {
        const hash = await bcrypt.hash('Correct@123', 4);
        mock.method(taiKhoanRepo, 'layThongTinTaiKhoan', async () => ({
            tai_khoan_id: 8,
            nguoi_dung_id: 8,
            ten_dang_nhap: 'expired_lock',
            mat_khau_bam: hash,
            trang_thai: ACCOUNT_STATUS.TEMP_LOCKED,
            so_lan_dang_nhap_sai: 5,
            khoa_den: new Date(Date.now() - 60000).toISOString(),
            ho_ten: 'Expired Lock',
            roles: [ROLES.CUSTOMER],
            permissions: []
        }));
        const unlockMock = mock.method(taiKhoanRepo, 'moKhoaHetHan', async () => {});
        mock.method(taiKhoanRepo, 'resetNhapSaiVaCapNhatDangNhapCuoi', async () => {});

        const res = await authService.login('expired_lock', 'Correct@123');
        assert.equal(unlockMock.mock.callCount(), 1);
        assert.ok(res.token);
    });
});

describe('Gói 1 — Rate Config, Admin RBAC Guardrails (FR-11, FR-12)', () => {
    it('chặn tạo kỳ hạn có lãi suất <= 0', async () => {
        await assert.rejects(
            () => rateConfigService.createTermAndRate({ thoiHan: 9, laiSuatNam: 0 }),
            (err) => err.statusCode === 400 && err.errorCode === 'VALIDATION_ERROR'
        );
    });

    it('chặn Admin tự khóa chính mình', async () => {
        mock.method(taiKhoanRepo, 'layThongTinTaiKhoanTheoId', async () => ({
            tai_khoan_id: 1,
            trang_thai: ACCOUNT_STATUS.ACTIVE
        }));

        await assert.rejects(
            () =>
                adminAccountService.updateAccountAccess(
                    1,
                    { trangThai: ACCOUNT_STATUS.TEMP_LOCKED },
                    { taiKhoanId: 1 }
                ),
            (err) => err.statusCode === 400
        );
    });

    it('middleware authorizeRoles chặn KHACH_HANG truy cập API Admin (403)', (_, done) => {
        const mw = authorizeRoles(ROLES.ADMIN);
        mw(
            { user: { roles: [ROLES.CUSTOMER] } },
            {},
            (err) => {
                assert.equal(err.statusCode, 403);
                assert.equal(err.errorCode, 'FORBIDDEN');
                done();
            }
        );
    });

    it('chặn KIEM_SOAT_VIEN tạo hoặc chỉnh sửa tài khoản cấp ADMIN (403)', async () => {
        await assert.rejects(
            () =>
                adminAccountService.createAccount(
                    {
                        hoTen: 'Test Admin',
                        email: 'admin2@savingsbank.vn',
                        tenDangNhap: 'admin_new',
                        matKhau: 'Admin@123',
                        vaiTro: ROLES.ADMIN
                    },
                    { taiKhoanId: 3, roles: [ROLES.SUPERVISOR] }
                ),
            (err) => err.statusCode === 403 && err.errorCode === 'FORBIDDEN'
        );

        mock.method(taiKhoanRepo, 'layThongTinTaiKhoanTheoId', async () => ({
            tai_khoan_id: 1,
            trang_thai: ACCOUNT_STATUS.ACTIVE,
            roles: [ROLES.ADMIN]
        }));

        await assert.rejects(
            () =>
                adminAccountService.updateAccountAccess(
                    1,
                    { trangThai: ACCOUNT_STATUS.TEMP_LOCKED },
                    { taiKhoanId: 3, roles: [ROLES.SUPERVISOR] }
                ),
            (err) => err.statusCode === 403 && err.errorCode === 'FORBIDDEN'
        );
    });
});
