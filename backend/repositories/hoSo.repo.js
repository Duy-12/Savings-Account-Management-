/**
 * Tầng DAL (:DuLieuHoSo) — Truy xuất thông tin cá nhân người dùng (FR-02)
 * File: backend/repositories/hoSo.repo.js
 */
const { pool } = require('../config/db');

async function truyVanHoSo(nguoiDungId, db = pool) {
    const [rows] = await db.execute(
        `SELECT nd.nguoi_dung_id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.ngay_tao,
                hskh.so_cccd, hskh.ngay_sinh, hskh.dia_chi, hskh.ngay_cap_nhat,
                nv.ma_nhan_vien
         FROM NGUOI_DUNG nd
         LEFT JOIN KHACH_HANG kh ON nd.nguoi_dung_id = kh.nguoi_dung_id
         LEFT JOIN HO_SO_KHACH_HANG hskh ON kh.khach_hang_id = hskh.khach_hang_id
         LEFT JOIN NHAN_VIEN nv ON nd.nguoi_dung_id = nv.nguoi_dung_id
         WHERE nd.nguoi_dung_id = ?
         LIMIT 1`,
        [nguoiDungId]
    );
    return rows[0] || null;
}

async function kiemTraEmailHoacSdtTrung(nguoiDungId, email, soDienThoai, db = pool) {
    const [rows] = await db.execute(
        `SELECT nguoi_dung_id
         FROM NGUOI_DUNG
         WHERE nguoi_dung_id <> ? AND (email = ? OR so_dien_thoai = ?)
         LIMIT 1`,
        [nguoiDungId, email, soDienThoai]
    );
    return rows.length > 0;
}

async function capNhatHoSo(nguoiDungId, { hoTen, email, soDienThoai, diaChi }, conn) {
    await conn.execute(
        `UPDATE NGUOI_DUNG
         SET ho_ten = ?, email = ?, so_dien_thoai = ?
         WHERE nguoi_dung_id = ?`,
        [hoTen, email, soDienThoai, nguoiDungId]
    );

    if (diaChi !== undefined) {
        await conn.execute(
            `UPDATE HO_SO_KHACH_HANG hskh
             JOIN KHACH_HANG kh ON hskh.khach_hang_id = kh.khach_hang_id
             SET hskh.dia_chi = ?, hskh.ngay_cap_nhat = NOW()
             WHERE kh.nguoi_dung_id = ?`,
            [diaChi, nguoiDungId]
        );
    }

    return truyVanHoSo(nguoiDungId, conn);
}

module.exports = {
    truyVanHoSo,
    kiemTraEmailHoacSdtTrung,
    capNhatHoSo
};
