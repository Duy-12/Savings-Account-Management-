/**
 * Routes Tính & Tra cứu tiền lãi (FR-06)
 * File: backend/routes/interest.routes.js
 */
const express = require('express');
const interestController = require('../controllers/interest.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { REGEX, requireBodyFields, validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
    '/calculate',
    requireBodyFields(['soTienGoc', 'ngayBatDau', 'ngayTinhDen']),
    validateBody((body) => {
        const errors = [];
        if (Number(body.soTienGoc) <= 0) errors.push('Số tiền gốc phải lớn hơn 0.');
        if (!REGEX.DATE.test(String(body.ngayBatDau)) || !REGEX.DATE.test(String(body.ngayTinhDen))) {
            errors.push('Định dạng ngày phải là YYYY-MM-DD.');
        }
        return errors;
    }),
    interestController.calculate
);

module.exports = router;
