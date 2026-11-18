/**
 * Tầng BLL (:DieuKhienTinhLai) — Component GiaoDichTietKiem (FR-06)
 * File: backend/services/transaction/interest.service.js
 */
const { AppError } = require('../../middlewares/error.middleware');
const laiSuatRepo = require('../../repositories/laiSuat.repo');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Chuẩn hóa chuỗi ngày YYYY-MM-DD hoặc Date thành số ngày giữa 2 mốc
 */
function computeDaysBetween(startDate, endDate) {
    const start = new Date(String(startDate).slice(0, 10) + 'T00:00:00Z');
    const end = new Date(String(endDate).slice(0, 10) + 'T00:00:00Z');

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Định dạng ngày tính lãi không hợp lệ (YYYY-MM-DD).');
    }

    return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

/**
 * Công thức lãi đơn Core Banking chuẩn (cơ sở 365 ngày/năm, làm tròn VNĐ)
 */
function calculateSimpleInterest(principal, annualRatePercent, days) {
    if (principal <= 0 || annualRatePercent < 0 || days <= 0) return 0;
    return Math.round(Number(principal) * (Number(annualRatePercent) / 100) * (Number(days) / 365));
}

/**
 * Tính ngày đáo hạn dự kiến từ ngày bắt đầu và thông số kỳ hạn
 */
function calculateMaturityDate(startDate, thoiHan, donViThoiHan = 'THANG') {
    if (!thoiHan || Number(thoiHan) <= 0) return null;

    const date = new Date(String(startDate).slice(0, 10) + 'T00:00:00Z');
    const unit = String(donViThoiHan).toUpperCase();
    const amount = Number(thoiHan);

    if (unit === 'NGAY') {
        date.setUTCDate(date.getUTCDate() + amount);
    } else if (unit === 'NAM') {
        date.setUTCFullYear(date.getUTCFullYear() + amount);
    } else {
        date.setUTCMonth(date.getUTCMonth() + amount);
    }

    return date.toISOString().slice(0, 10);
}

/**
 * Nghiệp vụ FR-06: Tính & tra cứu tiền lãi dự kiến
 */
async function calculateExpectedInterest({ soTienGoc, kyHanId, laiSuatNam, ngayBatDau, ngayTinhDen }) {
    const principal = Number(soTienGoc);
    if (!Number.isFinite(principal) || principal <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Số tiền gốc phải lớn hơn 0.');
    }

    const soNgayGui = computeDaysBetween(ngayBatDau, ngayTinhDen);
    if (soNgayGui < 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Ngày tính đến phải lớn hơn hoặc bằng ngày bắt đầu.');
    }

    let resolvedRate = laiSuatNam !== undefined && laiSuatNam !== null && laiSuatNam !== ''
        ? Number(laiSuatNam)
        : null;

    if (kyHanId) {
        const termInfo = await laiSuatRepo.layThongTinKyHanVaLaiSuat(Number(kyHanId));
        if (!termInfo) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy kỳ hạn tiết kiệm được chọn.');
        }
        if (resolvedRate === null) {
            resolvedRate = Number(termInfo.lai_suat_nam);
        }
    }

    if (resolvedRate === null || !Number.isFinite(resolvedRate) || resolvedRate < 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Lãi suất áp dụng không hợp lệ.');
    }

    const tienLaiDuKien = calculateSimpleInterest(principal, resolvedRate, soNgayGui);

    return {
        soTienGoc: principal,
        soNgayGui,
        laiSuatApDung: resolvedRate,
        tienLaiDuKien,
        tongGocVaLai: principal + tienLaiDuKien
    };
}

module.exports = {
    computeDaysBetween,
    calculateSimpleInterest,
    calculateMaturityDate,
    calculateExpectedInterest
};
