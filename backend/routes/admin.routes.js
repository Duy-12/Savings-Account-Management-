/**
 * Routes Quản trị: /accounts (FR-11), /rates (FR-12)
 * File: backend/routes/admin.routes.js
 */
const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { ROLES } = require('../config/constants');
const { REGEX, requireBodyFields, validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

// FR-11: Quản lý tài khoản & phân quyền
router.get(
    '/accounts',
    authorizeRoles(ROLES.ADMIN, ROLES.SUPERVISOR),
    adminController.listAccounts
);

router.post(
    '/accounts',
    authorizeRoles(ROLES.SUPERVISOR, ROLES.ADMIN),
    requireBodyFields(['hoTen', 'email', 'tenDangNhap', 'matKhau', 'vaiTro']),
    validateBody((body) => {
        const errors = [];
        if (!REGEX.EMAIL.test(String(body.email).trim())) errors.push('Email không hợp lệ.');
        if (String(body.tenDangNhap).trim().length < 4) errors.push('Tên đăng nhập tối thiểu 4 ký tự.');
        if (String(body.matKhau).length < 8) errors.push('Mật khẩu tối thiểu 8 ký tự.');
        return errors;
    }),
    adminController.createAccount
);

router.patch(
    '/accounts/:id',
    authorizeRoles(ROLES.SUPERVISOR, ROLES.ADMIN),
    adminController.updateAccount
);

// FR-12: Danh mục sản phẩm & biểu lãi suất
router.get('/rates', adminController.listRates);

router.post(
    '/rates',
    authorizeRoles(ROLES.SUPERVISOR, ROLES.ADMIN),
    requireBodyFields(['thoiHan', 'laiSuatNam']),
    adminController.createRate
);

router.put(
    '/rates/:kyHanId',
    authorizeRoles(ROLES.SUPERVISOR, ROLES.ADMIN),
    requireBodyFields(['laiSuatNam']),
    adminController.updateRate
);

// FR-10: Báo cáo & thống kê
router.get(
    '/reports',
    authorizeRoles(ROLES.TELLER, ROLES.SUPERVISOR, ROLES.ADMIN),
    adminController.getReports
);

// FR-13 & EX-02: Thông báo & Quét đáo hạn
router.get('/notifications', adminController.listNotifications);

router.post(
    '/jobs/maturity-scan',
    authorizeRoles(ROLES.SUPERVISOR, ROLES.ADMIN),
    adminController.triggerMaturityScan
);

// FR-14: Tái tục sổ tự động
router.post(
    '/jobs/rollover-run',
    authorizeRoles(ROLES.SUPERVISOR, ROLES.ADMIN),
    adminController.triggerRollover
);

module.exports = router;
