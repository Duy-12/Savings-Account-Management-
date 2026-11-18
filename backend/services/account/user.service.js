/**
 * Tầng BLL (:DieuKhienNguoiDung) — Component QuanLyTaiKhoan (FR-02)
 * File: backend/services/account/user.service.js
 */
const { withTransaction } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');
const hoSoRepo = require('../../repositories/hoSo.repo');

async function getProfile(nguoiDungId) {
    const profile = await hoSoRepo.truyVanHoSo(nguoiDungId);
    if (!profile) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy hồ sơ người dùng.');
    }
    return profile;
}

async function updateProfile(nguoiDungId, { hoTen, email, soDienThoai, diaChi }) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPhone = soDienThoai.trim();

    const duplicated = await hoSoRepo.kiemTraEmailHoacSdtTrung(
        nguoiDungId,
        normalizedEmail,
        cleanPhone
    );
    if (duplicated) {
        throw new AppError(409, 'DUPLICATE_ENTRY', 'Email hoặc số điện thoại đã thuộc về tài khoản khác.');
    }

    return withTransaction((conn) =>
        hoSoRepo.capNhatHoSo(
            nguoiDungId,
            {
                hoTen: hoTen.trim(),
                email: normalizedEmail,
                soDienThoai: cleanPhone,
                diaChi: diaChi !== undefined ? String(diaChi).trim() : undefined
            },
            conn
        )
    );
}

module.exports = {
    getProfile,
    updateProfile
};
