/**
 * Controller Quản lý thông tin khách hàng (FR-08)
 * File: backend/controllers/customer.controller.js
 */
const { asyncHandler } = require('../middlewares/error.middleware');
const customerService = require('../services/inquiry/customer.service');

const list = asyncHandler(async (req, res) => {
    const data = await customerService.listCustomers({
        cccd: req.query.cccd,
        q: req.query.q
    });
    res.json({
        success: true,
        message: 'Lấy danh sách khách hàng thành công.',
        data
    });
});

const create = asyncHandler(async (req, res) => {
    const data = await customerService.createCustomer(req.body);
    res.status(201).json({
        success: true,
        message: 'Tạo hồ sơ khách hàng mới thành công.',
        data
    });
});

const update = asyncHandler(async (req, res) => {
    const data = await customerService.updateCustomer(req.params.id, req.body);
    res.json({
        success: true,
        message: 'Cập nhật hồ sơ khách hàng thành công.',
        data
    });
});

module.exports = {
    list,
    create,
    update
};
