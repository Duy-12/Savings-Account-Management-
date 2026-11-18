/**
 * Tầng BLL (:DieuKhienDangNhap) — Component QuanLyTaiKhoan (FR-01, EX-01, Đăng ký online)
 * File: backend/services/account/auth.service.js
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { withTransaction } = require('../../config/db');
const { ACCOUNT_STATUS, ROLES, isAccountCurrentlyLocked } = require('../../config/constants');
const { AppError } = require('../../middlewares/error.middleware');
const taiKhoanRepo = require('../../repositories/taiKhoan.repo');

/**
 * Xác thực đăng nhập + xử lý ngoại lệ khóa 5 lần sai (FR-01, EX-01)
 */
async function login(tenDangNhap, matKhau) {
    const account = await taiKhoanRepo.layThongTinTaiKhoan(tenDangNhap.trim());

    if (!account) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    if (account.trang_thai === ACCOUNT_STATUS.INACTIVE) {
        throw new AppError(403, 'FORBIDDEN', 'Tài khoản đã bị vô hiệu hóa.');
    }

    // Kiểm tra trạng thái khóa (cả khóa thủ công bởi Admin lẫn khóa tự động 15 phút)
    if (isAccountCurrentlyLocked(account)) {
        throw new AppError(
            423,
            'ACCOUNT_LOCKED',
            account.khoa_den
                ? 'Tài khoản đang bị khóa tạm thời do nhập sai nhiều lần. Vui lòng thử lại sau.'
                : 'Tài khoản đang bị khóa bởi quản trị viên.'
        );
    }

    // Nếu khóa tự động đã hết thời gian chờ -> mở lại chu kỳ đếm sai trước khi đối chiếu mật khẩu
    if (
        account.trang_thai === ACCOUNT_STATUS.TEMP_LOCKED &&
        account.khoa_den &&
        new Date(account.khoa_den) <= new Date()
    ) {
        await taiKhoanRepo.moKhoaHetHan(account.tai_khoan_id);
    }

    const isPasswordValid = await bcrypt.compare(matKhau, account.mat_khau_bam);
    if (!isPasswordValid) {
        const failCount = await taiKhoanRepo.tangSoLanNhapSai(account.tai_khoan_id);

        if (failCount >= env.security.maxLoginAttempts) {
            const lockUntil = new Date(Date.now() + env.security.lockDurationMinutes * 60 * 1000);
            await taiKhoanRepo.khoaTaiKhoan(account.tai_khoan_id, lockUntil);
            throw new AppError(
                423,
                'ACCOUNT_LOCKED',
                `Tài khoản đã bị khóa ${env.security.lockDurationMinutes} phút do nhập sai mật khẩu ${env.security.maxLoginAttempts} lần.`
            );
        }

        const remaining = env.security.maxLoginAttempts - failCount;
        throw new AppError(
            401,
            'INVALID_CREDENTIALS',
            `Sai mật khẩu. Bạn còn ${remaining} lần thử trước khi tài khoản bị khóa.`
        );
    }

    await taiKhoanRepo.resetNhapSaiVaCapNhatDangNhapCuoi(account.tai_khoan_id);

    const token = jwt.sign(
        {
            taiKhoanId: account.tai_khoan_id,
            nguoiDungId: account.nguoi_dung_id,
            roles: account.roles
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );

    return {
        token,
        user: {
            taiKhoanId: account.tai_khoan_id,
            nguoiDungId: account.nguoi_dung_id,
            khachHangId: account.khach_hang_id || null,
            nhanVienId: account.nhan_vien_id || null,
            tenDangNhap: account.ten_dang_nhap,
            hoTen: account.ho_ten,
            email: account.email,
            soDienThoai: account.so_dien_thoai,
            roles: account.roles,
            permissions: account.permissions
        }
    };
}

/**
 * Đăng ký tài khoản khách hàng trực tuyến (luôn gán cố định vai trò KHACH_HANG)
 */
async function registerCustomer({ hoTen, soCccd, soDienThoai, email, tenDangNhap, matKhau, ngaySinh, diaChi }) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanUsername = tenDangNhap.trim();
    const cleanCccd = soCccd.trim();
    const cleanPhone = soDienThoai.trim();

    const duplicateMsg = await taiKhoanRepo.kiemTraTonTaiDangKy({
        tenDangNhap: cleanUsername,
        email: normalizedEmail,
        soCccd: cleanCccd,
        soDienThoai: cleanPhone
    });

    if (duplicateMsg) {
        throw new AppError(409, 'DUPLICATE_ENTRY', duplicateMsg);
    }

    const matKhauBam = await bcrypt.hash(matKhau, env.security.bcryptSaltRounds);

    const created = await withTransaction((conn) =>
        taiKhoanRepo.taoTaiKhoanKhachHang(
            {
                hoTen: hoTen.trim(),
                email: normalizedEmail,
                soDienThoai: cleanPhone,
                soCccd: cleanCccd,
                ngaySinh,
                diaChi,
                tenDangNhap: cleanUsername,
                matKhauBam
            },
            conn
        )
    );

    return {
        taiKhoanId: created.taiKhoanId,
        tenDangNhap: cleanUsername,
        role: ROLES.CUSTOMER,
        soTaiKhoanThanhToan: created.soTaiKhoanMoi
    };
}

/**
 * Lấy thông tin phiên hiện tại (kèm tài khoản thanh toán nếu là khách hàng)
 */
async function getCurrentUser(user) {
    let paymentAccounts = [];
    if (user.khachHangId) {
        paymentAccounts = await taiKhoanRepo.layTaiKhoanThanhToanTheoKhachHang(user.khachHangId);
    }
    return {
        ...user,
        paymentAccounts
    };
}

module.exports = {
    login,
    registerCustomer,
    getCurrentUser
};
