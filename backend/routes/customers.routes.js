/**
 * Routes Quản lý khách hàng (FR-08)
 * File: backend/routes/customers.routes.js
 */
const express = require('express');
const customerController = require('../controllers/customer.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { ROLES } = require('../config/constants');
const { REGEX, requireBodyFields, validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

const validateCustomerPayload = validateBody((body) => {
    const errors = [];
    if (!REGEX.CCCD.test(String(body.soCccd).trim())) errors.push('Số CCCD phải gồm 9–12 chữ số.');
    if (!REGEX.PHONE.test(String(body.soDienThoai).trim())) errors.push('Số điện thoại không hợp lệ.');
    if (!REGEX.EMAIL.test(String(body.email).trim())) errors.push('Email không hợp lệ.');
    return errors;
});

router.get(
    '/',
    authorizeRoles(ROLES.TELLER, ROLES.SUPERVISOR, ROLES.ADMIN),
    customerController.list
);

router.post(
    '/',
    authorizeRoles(ROLES.TELLER, ROLES.SUPERVISOR, ROLES.ADMIN),
    requireBodyFields(['hoTen', 'soCccd', 'soDienThoai', 'email']),
    validateCustomerPayload,
    customerController.create
);

router.put(
    '/:id',
    authorizeRoles(ROLES.TELLER, ROLES.SUPERVISOR, ROLES.ADMIN),
    requireBodyFields(['hoTen', 'soCccd', 'soDienThoai', 'email']),
    validateCustomerPayload,
    customerController.update
);

module.exports = router;
