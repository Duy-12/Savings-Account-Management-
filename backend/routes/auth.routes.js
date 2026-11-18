/**
 * Routes Xác thực & Đăng ký online (FR-01, EX-01)
 * File: backend/routes/auth.routes.js
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { REGEX, requireBodyFields, validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorCode: 'TOO_MANY_REQUESTS',
        message: 'Quá nhiều yêu cầu đăng nhập từ IP này. Vui lòng thử lại sau 15 phút.'
    }
});

router.post(
    '/login',
    loginLimiter,
    requireBodyFields(['tenDangNhap', 'matKhau']),
    authController.login
);

router.post(
    '/register',
    requireBodyFields(['hoTen', 'soCccd', 'soDienThoai', 'email', 'tenDangNhap', 'matKhau']),
    validateBody((body) => {
        const errors = [];
        if (!REGEX.CCCD.test(String(body.soCccd).trim())) errors.push('Số CCCD phải gồm 9–12 chữ số.');
        if (!REGEX.PHONE.test(String(body.soDienThoai).trim())) errors.push('Số điện thoại không đúng định dạng Việt Nam.');
        if (!REGEX.EMAIL.test(String(body.email).trim())) errors.push('Email không hợp lệ.');
        if (String(body.tenDangNhap).trim().length < 4) errors.push('Tên đăng nhập tối thiểu 4 ký tự.');
        if (String(body.matKhau).length < 8) errors.push('Mật khẩu tối thiểu 8 ký tự.');
        return errors;
    }),
    authController.register
);

router.get('/me', authenticate, authController.me);

module.exports = router;
