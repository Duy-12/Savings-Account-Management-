/**
 * Controller Quản trị: Tài khoản & Phân quyền (FR-11), Danh mục & Lãi suất (FR-12)
 * File: backend/controllers/admin.controller.js
 */
const { asyncHandler } = require('../middlewares/error.middleware');
const adminAccountService = require('../services/account/adminAccount.service');
const rateConfigService = require('../services/admin/rateConfig.service');
const reportService = require('../services/admin/report.service');
const notificationService = require('../services/admin/notification.service');
const maturityJobService = require('../services/admin/maturityJob.service');
const rolloverJobService = require('../services/admin/rolloverJob.service');

const listAccounts = asyncHandler(async (req, res) => {
    const data = await adminAccountService.listAccounts();
    res.json({
        success: true,
        message: 'Lấy danh sách tài khoản thành công.',
        data
    });
});

const createAccount = asyncHandler(async (req, res) => {
    const data = await adminAccountService.createAccount(req.body, req.user);
    res.status(201).json({
        success: true,
        message: 'Tạo tài khoản và gán vai trò thành công.',
        data
    });
});

const updateAccount = asyncHandler(async (req, res) => {
    const data = await adminAccountService.updateAccountAccess(req.params.id, req.body, req.user);
    res.json({
        success: true,
        message: 'Cập nhật tài khoản và phân quyền thành công.',
        data
    });
});

const listRates = asyncHandler(async (req, res) => {
    const data = await rateConfigService.getAllRates();
    res.json({
        success: true,
        message: 'Lấy danh mục sản phẩm và biểu lãi suất thành công.',
        data
    });
});

const createRate = asyncHandler(async (req, res) => {
    const data = await rateConfigService.createTermAndRate(req.body);
    res.status(201).json({
        success: true,
        message: 'Thêm kỳ hạn và biểu lãi suất mới thành công.',
        data
    });
});

const updateRate = asyncHandler(async (req, res) => {
    const data = await rateConfigService.updateRate(Number(req.params.kyHanId), req.body);
    res.json({
        success: true,
        message: 'Cập nhật biểu lãi suất mới thành công.',
        data
    });
});

const getReports = asyncHandler(async (req, res) => {
    const data = await reportService.generateReport({
        loaiBaoCao: req.query.type,
        trangThai: req.query.status,
        from: req.query.from,
        to: req.query.to
    });
    res.json({
        success: true,
        message: 'Tổng hợp báo cáo thống kê thành công.',
        data
    });
});

const listNotifications = asyncHandler(async (req, res) => {
    const data = await notificationService.listNotifications(req.user);
    res.json({
        success: true,
        message: 'Lấy lịch sử thông báo thành công.',
        data
    });
});

const triggerMaturityScan = asyncHandler(async (req, res) => {
    const data = await maturityJobService.runMaturityReminderScan();
    res.json({
        success: true,
        message: `Đã quét ${data.scannedCount} sổ sắp đáo hạn.`,
        data
    });
});

const triggerRollover = asyncHandler(async (req, res) => {
    const data = await rolloverJobService.runAutoRollover(req.user.taiKhoanId);
    res.json({
        success: true,
        message: `Đã xử lý tái tục ${data.rolledOverCount}/${data.dueCount} sổ đến hạn.`,
        data
    });
});

module.exports = {
    listAccounts,
    createAccount,
    updateAccount,
    listRates,
    createRate,
    updateRate,
    getReports,
    listNotifications,
    triggerMaturityScan,
    triggerRollover
};
