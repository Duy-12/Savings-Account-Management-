/**
 * Routes Hồ sơ cá nhân (FR-02)
 * File: backend/routes/profile.routes.js
 */
const express = require('express');
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { REGEX, requireBodyFields, validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', profileController.getProfile);

router.put(
    '/',
    requireBodyFields(['hoTen', 'soDienThoai', 'email']),
    validateBody((body) => {
        const errors = [];
        if (!REGEX.PHONE.test(String(body.soDienThoai).trim())) errors.push('Số điện thoại không hợp lệ.');
        if (!REGEX.EMAIL.test(String(body.email).trim())) errors.push('Email không hợp lệ.');
        return errors;
    }),
    profileController.updateProfile
);

module.exports = router;
