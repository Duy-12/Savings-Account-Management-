/**
 * Tầng BLL (:DieuKhienBaoCao) — Component QuanTriVaTuDongHoa (FR-10 Báo cáo & Thống kê)
 * File: backend/services/admin/report.service.js
 */
const { AppError } = require('../../middlewares/error.middleware');
const heThongRepo = require('../../repositories/heThong.repo');

async function generateReport({ loaiBaoCao = 'TONG_HOP', trangThai = 'ALL', from, to }) {
    const today = new Date().toISOString().slice(0, 10);
    const startDate = from || '2026-01-01';
    const endDate = to || today;

    if (endDate < startDate) {
        throw new AppError(400, 'INVALID_DATE_RANGE', 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
    }

    return heThongRepo.tongHopDuLieuBaoCao({
        loaiBaoCao,
        trangThai,
        from: startDate,
        to: endDate
    });
}

module.exports = {
    generateReport
};
