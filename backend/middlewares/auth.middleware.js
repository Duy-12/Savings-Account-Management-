/**
 * Middleware xác thực JWT và kiểm tra trạng thái tài khoản từ CSDL
 * File: backend/middlewares/auth.middleware.js
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ACCOUNT_STATUS } = require('../config/constants');
const { AppError, asyncHandler } = require('./error.middleware');
const taiKhoanRepo = require('../repositories/taiKhoan.repo');

/**
 * Xác thực Bearer Token và gắn thông tin người dùng thực tế từ DB vào req.user
 */
const authenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để tiếp tục.');
    }

    const decoded = jwt.verify(token, env.jwt.secret);
    const account = await taiKhoanRepo.layThongTinTaiKhoanTheoId(decoded.taiKhoanId);

    if (!account) {
        throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản không tồn tại hoặc đã bị xóa.');
    }

    const isTempLocked =
        account.trang_thai === ACCOUNT_STATUS.TEMP_LOCKED &&
        account.khoa_den &&
        new Date(account.khoa_den) > new Date();

    if (isTempLocked) {
        throw new AppError(423, 'ACCOUNT_LOCKED', 'Tài khoản đang bị khóa tạm thời.');
    }

    if (account.trang_thai === ACCOUNT_STATUS.INACTIVE) {
        throw new AppError(403, 'FORBIDDEN', 'Tài khoản đã ngừng hoạt động.');
    }

    req.user = {
        taiKhoanId: account.tai_khoan_id,
        nguoiDungId: account.nguoi_dung_id,
        tenDangNhap: account.ten_dang_nhap,
        hoTen: account.ho_ten,
        khachHangId: account.khach_hang_id || null,
        nhanVienId: account.nhan_vien_id || null,
        roles: account.roles || [],
        permissions: account.permissions || []
    };

    next();
});

module.exports = {
    authenticate
};
