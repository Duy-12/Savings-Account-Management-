/**
 * Tầng BLL (:DieuKhienQuanTri) — Component QuanLyTaiKhoan (FR-11)
 * File: backend/services/account/adminAccount.service.js
 */
const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const { withTransaction } = require('../../config/db');
const { ACCOUNT_STATUS, ROLES } = require('../../config/constants');
const { AppError } = require('../../middlewares/error.middleware');
const taiKhoanRepo = require('../../repositories/taiKhoan.repo');

const ALLOWED_ROLES = new Set(Object.values(ROLES));
const ALLOWED_STATUSES = new Set(Object.values(ACCOUNT_STATUS));

async function listAccounts() {
    return taiKhoanRepo.truyVanTatCaTaiKhoan();
}

async function createAccount({ hoTen, email, soDienThoai, tenDangNhap, matKhau, vaiTro }) {
    if (!ALLOWED_ROLES.has(vaiTro)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Vai trò được gán không hợp lệ.');
    }

    const cleanUsername = tenDangNhap.trim();
    const cleanEmail = email.trim().toLowerCase();

    const dupMessage = await taiKhoanRepo.kiemTraUsernameHoacEmailTonTai(cleanUsername, cleanEmail);
    if (dupMessage) {
        throw new AppError(409, 'DUPLICATE_ENTRY', dupMessage);
    }

    const roleRow = await taiKhoanRepo.kiemTraVaiTroTonTai(vaiTro);
    if (!roleRow) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Không tìm thấy vai trò trong CSDL.');
    }

    const matKhauBam = await bcrypt.hash(matKhau, env.security.bcryptSaltRounds);

    return withTransaction((conn) =>
        taiKhoanRepo.taoTaiKhoanVaGanVaiTro(
            {
                hoTen: hoTen.trim(),
                email: cleanEmail,
                soDienThoai: soDienThoai ? String(soDienThoai).trim() : null,
                tenDangNhap: cleanUsername,
                matKhauBam,
                vaiTroId: roleRow.vai_tro_id,
                tenVaiTro: roleRow.ten_vai_tro
            },
            conn
        )
    );
}

async function updateAccountAccess(taiKhoanId, { vaiTro, trangThai }, currentUser) {
    const id = Number(taiKhoanId);
    const target = await taiKhoanRepo.layThongTinTaiKhoanTheoId(id);
    if (!target) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản người dùng.');
    }

    if (currentUser && currentUser.taiKhoanId === id && trangThai && trangThai !== ACCOUNT_STATUS.ACTIVE) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Không thể tự khóa tài khoản quản trị đang đăng nhập.');
    }

    let vaiTroId = null;
    if (vaiTro) {
        if (!ALLOWED_ROLES.has(vaiTro)) {
            throw new AppError(400, 'VALIDATION_ERROR', 'Vai trò mới không hợp lệ.');
        }
        const roleRow = await taiKhoanRepo.kiemTraVaiTroTonTai(vaiTro);
        if (!roleRow) {
            throw new AppError(400, 'VALIDATION_ERROR', 'Không tìm thấy vai trò trong CSDL.');
        }
        vaiTroId = roleRow.vai_tro_id;
    }

    if (trangThai && !ALLOWED_STATUSES.has(trangThai)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Trạng thái tài khoản không hợp lệ.');
    }

    return withTransaction((conn) =>
        taiKhoanRepo.capNhatTrangThaiVaVaiTro(id, { vaiTroId, trangThai }, conn)
    );
}

module.exports = {
    listAccounts,
    createAccount,
    updateAccountAccess
};
