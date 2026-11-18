/**
 * Tầng BLL (:DieuKhienKhachHang) — Component TraCuuVaQuanLySo (FR-08)
 * File: backend/services/inquiry/customer.service.js
 */
const { withTransaction } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');
const khachHangRepo = require('../../repositories/khachHang.repo');

async function listCustomers(filters) {
    return khachHangRepo.truyVanToanBo(filters);
}

async function createCustomer({ hoTen, soCccd, ngaySinh, soDienThoai, email, diaChi }) {
    const cleanData = {
        hoTen: hoTen.trim(),
        soCccd: soCccd.trim(),
        ngaySinh: ngaySinh || '1990-01-01',
        soDienThoai: soDienThoai.trim(),
        email: email.trim().toLowerCase(),
        diaChi: diaChi ? String(diaChi).trim() : null
    };

    const dupMessage = await khachHangRepo.kiemTraTrungLap(cleanData, null);
    if (dupMessage) {
        throw new AppError(409, 'DUPLICATE_ENTRY', dupMessage);
    }

    return withTransaction((conn) => khachHangRepo.taoKhachHangMoi(cleanData, conn));
}

async function updateCustomer(khachHangId, { hoTen, soCccd, ngaySinh, soDienThoai, email, diaChi }) {
    const existing = await khachHangRepo.layKhachHangTheoId(khachHangId);
    if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy hồ sơ khách hàng.');
    }

    const cleanData = {
        hoTen: hoTen.trim(),
        soCccd: soCccd.trim(),
        ngaySinh: ngaySinh || null,
        soDienThoai: soDienThoai.trim(),
        email: email.trim().toLowerCase(),
        diaChi: diaChi !== undefined ? String(diaChi).trim() : existing.dia_chi
    };

    const dupMessage = await khachHangRepo.kiemTraTrungLap(cleanData, Number(khachHangId));
    if (dupMessage) {
        throw new AppError(409, 'DUPLICATE_ENTRY', dupMessage);
    }

    return withTransaction((conn) => khachHangRepo.capNhatKhachHang(Number(khachHangId), cleanData, conn));
}

module.exports = {
    listCustomers,
    createCustomer,
    updateCustomer
};
