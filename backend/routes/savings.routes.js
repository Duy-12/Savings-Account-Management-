/**
 * Routes Giao dịch Sổ tiết kiệm (/api/savings/*)
 * File: backend/routes/savings.routes.js
 */
const express = require('express');
const savingsController = require('../controllers/savings.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { ROLES } = require('../config/constants');
const { REGEX, requireBodyFields, validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

// FR-03: Tài khoản thanh toán & Mở sổ online
router.get('/payment-accounts', savingsController.getPaymentAccounts);

router.post(
    '/open-online',
    authorizeRoles(ROLES.CUSTOMER),
    requireBodyFields(['kyHanId', 'soTienGui']),
    validateBody((body) => {
        const errors = [];
        if (Number(body.soTienGui) <= 0) errors.push('Số tiền gửi phải lớn hơn 0.');
        return errors;
    }),
    savingsController.openOnline
);

// FR-04: Mở sổ tại quầy
router.post(
    '/open-counter',
    authorizeRoles(ROLES.TELLER, ROLES.ADMIN),
    requireBodyFields(['soCccd', 'kyHanId', 'soTienGui']),
    validateBody((body) => {
        const errors = [];
        if (!REGEX.CCCD.test(String(body.soCccd).trim())) errors.push('Số CCCD phải gồm 9–12 chữ số.');
        if (Number(body.soTienGui) <= 0) errors.push('Số tiền gửi phải lớn hơn 0.');
        return errors;
    }),
    savingsController.openCounter
);

// FR-05: Tra cứu sổ tiết kiệm
router.get('/', savingsController.listPassbooks);
router.get('/:maSo', savingsController.getPassbookDetail);

// FR-07 & EX-03: Tất toán sổ (2 bước preview -> confirm)
router.post(
    '/:maSo/settlement-preview',
    validateBody((body) => {
        const errors = [];
        if (body.ngayTatToan && !REGEX.DATE.test(String(body.ngayTatToan))) {
            errors.push('Định dạng ngayTatToan phải là YYYY-MM-DD.');
        }
        return errors;
    }),
    savingsController.previewSettlement
);

router.post(
    '/:maSo/settlement-confirm',
    validateBody((body) => {
        const errors = [];
        if (body.ngayTatToan && !REGEX.DATE.test(String(body.ngayTatToan))) {
            errors.push('Định dạng ngayTatToan phải là YYYY-MM-DD.');
        }
        return errors;
    }),
    savingsController.confirmSettlement
);

// FR-09: Đổi trạng thái sổ
router.patch(
    '/:maSo/status',
    authorizeRoles(ROLES.TELLER, ROLES.SUPERVISOR, ROLES.ADMIN),
    requireBodyFields(['trangThaiMoi', 'lyDo']),
    savingsController.updateStatus
);

module.exports = router;
