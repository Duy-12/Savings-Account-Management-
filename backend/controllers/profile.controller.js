/**
 * Controller tiếp nhận HTTP Request cho Hồ sơ cá nhân (FR-02)
 * File: backend/controllers/profile.controller.js
 */
const { asyncHandler } = require('../middlewares/error.middleware');
const userService = require('../services/account/user.service');

const getProfile = asyncHandler(async (req, res) => {
    const profile = await userService.getProfile(req.user.nguoiDungId);
    res.json({
        success: true,
        message: 'Lấy thông tin cá nhân thành công.',
        data: {
            ...profile,
            roles: req.user.roles
        }
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const updated = await userService.updateProfile(req.user.nguoiDungId, req.body);
    res.json({
        success: true,
        message: 'Cập nhật thông tin cá nhân thành công.',
        data: {
            ...updated,
            roles: req.user.roles
        }
    });
});

module.exports = {
    getProfile,
    updateProfile
};
