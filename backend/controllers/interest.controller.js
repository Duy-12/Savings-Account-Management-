/**
 * Controller Tính & Tra cứu tiền lãi (FR-06)
 * File: backend/controllers/interest.controller.js
 */
const { asyncHandler } = require('../middlewares/error.middleware');
const interestService = require('../services/transaction/interest.service');

const calculate = asyncHandler(async (req, res) => {
    const data = await interestService.calculateExpectedInterest(req.body);
    res.json({
        success: true,
        message: 'Tính tiền lãi dự kiến thành công.',
        data
    });
});

module.exports = {
    calculate
};
