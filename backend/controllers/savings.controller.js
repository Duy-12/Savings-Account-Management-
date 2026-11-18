/**
 * Controller Giao dịch Sổ tiết kiệm (FR-03, FR-04, FR-05, FR-07, FR-09, EX-03)
 * File: backend/controllers/savings.controller.js
 */
const { asyncHandler } = require('../middlewares/error.middleware');
const taiKhoanRepo = require('../repositories/taiKhoan.repo');
const savingsTxService = require('../services/transaction/savingsTx.service');
const settlementService = require('../services/transaction/settlement.service');
const inquiryService = require('../services/inquiry/inquiry.service');
const passbookStatusService = require('../services/inquiry/passbookStatus.service');

const getPaymentAccounts = asyncHandler(async (req, res) => {
    const data = req.user.khachHangId
        ? await taiKhoanRepo.layTaiKhoanThanhToanTheoKhachHang(req.user.khachHangId)
        : [];
    res.json({
        success: true,
        message: 'Lấy danh sách tài khoản thanh toán thành công.',
        data
    });
});

const openOnline = asyncHandler(async (req, res) => {
    const data = await savingsTxService.openOnline(req.user, req.body);
    res.status(201).json({
        success: true,
        message: 'Mở sổ tiết kiệm trực tuyến thành công.',
        data
    });
});

const openCounter = asyncHandler(async (req, res) => {
    const data = await savingsTxService.openAtCounter(req.user, req.body);
    res.status(201).json({
        success: true,
        message: 'Mở sổ tiết kiệm tại quầy thành công.',
        data
    });
});

const listPassbooks = asyncHandler(async (req, res) => {
    const data = await inquiryService.listPassbooks(req.user, {
        q: req.query.q,
        status: req.query.status
    });
    res.json({
        success: true,
        message: 'Tra cứu danh sách sổ tiết kiệm thành công.',
        data
    });
});

const getPassbookDetail = asyncHandler(async (req, res) => {
    const data = await inquiryService.getPassbookDetail(req.params.maSo, req.user);
    res.json({
        success: true,
        message: 'Lấy chi tiết sổ tiết kiệm thành công.',
        data
    });
});

const previewSettlement = asyncHandler(async (req, res) => {
    const data = await settlementService.previewSettlement(
        req.params.maSo,
        req.user,
        req.body?.ngayTatToan
    );
    res.json({
        success: true,
        message: 'Kiểm tra thông tin tất toán thành công.',
        data
    });
});

const confirmSettlement = asyncHandler(async (req, res) => {
    const data = await settlementService.confirmSettlement(
        req.params.maSo,
        req.user,
        req.body || {}
    );
    res.json({
        success: true,
        message: 'Tất toán sổ tiết kiệm thành công.',
        data
    });
});

const updateStatus = asyncHandler(async (req, res) => {
    const data = await passbookStatusService.changePassbookStatus(
        req.params.maSo,
        req.user,
        req.body
    );
    res.json({
        success: true,
        message: 'Cập nhật trạng thái sổ tiết kiệm thành công.',
        data
    });
});

module.exports = {
    getPaymentAccounts,
    openOnline,
    openCounter,
    listPassbooks,
    getPassbookDetail,
    previewSettlement,
    confirmSettlement,
    updateStatus
};
