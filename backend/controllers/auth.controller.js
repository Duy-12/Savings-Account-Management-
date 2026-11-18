/**
 * Controller tiếp nhận HTTP Request cho Xác thực & Đăng ký (FR-01, EX-01)
 * File: backend/controllers/auth.controller.js
 */
const { asyncHandler } = require('../middlewares/error.middleware');
const authService = require('../services/account/auth.service');

const login = asyncHandler(async (req, res) => {
    const { tenDangNhap, matKhau } = req.body;
    const data = await authService.login(tenDangNhap, matKhau);
    res.json({
        success: true,
        message: 'Đăng nhập thành công.',
        data
    });
});

const register = asyncHandler(async (req, res) => {
    const data = await authService.registerCustomer(req.body);
    res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản khách hàng thành công.',
        data
    });
});

const me = asyncHandler(async (req, res) => {
    const data = await authService.getCurrentUser(req.user);
    res.json({
        success: true,
        message: 'Lấy thông tin phiên đăng nhập thành công.',
        data
    });
});

module.exports = {
    login,
    register,
    me
};
