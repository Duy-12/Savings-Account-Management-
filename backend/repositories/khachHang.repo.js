/**
 * Tầng DAL (:DuLieuKhachHang) — Truy xuất NGUOI_DUNG, KHACH_HANG, HO_SO_KHACH_HANG, TAI_KHOAN_THANH_TOAN (FR-04, FR-08)
 * File: backend/repositories/khachHang.repo.js
 */
const { pool } = require('../config/db');

async function layThongTinHoSoTheoCCCD(soCccd, db = pool) {
    const [rows] = await db.execute(
        `SELECT kh.khach_hang_id, kh.nguoi_dung_id, kh.trang_thai, kh.ngay_tao,
                nd.ho_ten, nd.email, nd.so_dien_thoai,
                hskh.ho_so_id, hskh.so_cccd, hskh.ngay_sinh, hskh.dia_chi, hskh.ngay_cap_nhat
         FROM HO_SO_KHACH_HANG hskh
         JOIN KHACH_HANG kh ON hskh.khach_hang_id = kh.khach_hang_id
         JOIN NGUOI_DUNG nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
         WHERE hskh.so_cccd = ?
         LIMIT 1`,
        [soCccd]
    );
    return rows[0] || null;
}

async function layKhachHangTheoId(khachHangId, db = pool) {
    const [rows] = await db.execute(
        `SELECT kh.khach_hang_id, kh.nguoi_dung_id, kh.trang_thai, kh.ngay_tao,
                nd.ho_ten, nd.email, nd.so_dien_thoai,
                hskh.ho_so_id, hskh.so_cccd, hskh.ngay_sinh, hskh.dia_chi, hskh.ngay_cap_nhat
         FROM KHACH_HANG kh
         JOIN NGUOI_DUNG nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
         LEFT JOIN HO_SO_KHACH_HANG hskh ON kh.khach_hang_id = hskh.khach_hang_id
         WHERE kh.khach_hang_id = ?
         LIMIT 1`,
        [khachHangId]
    );
    return rows[0] || null;
}

async function truyVanToanBo({ cccd, q } = {}, db = pool) {
    const conditions = [];
    const params = [];

    if (cccd) {
        conditions.push('hskh.so_cccd = ?');
        params.push(cccd.trim());
    }
    if (q) {
        const like = `%${q.trim()}%`;
        conditions.push('(nd.ho_ten LIKE ? OR hskh.so_cccd LIKE ? OR nd.email LIKE ? OR nd.so_dien_thoai LIKE ?)');
        params.push(like, like, like, like);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await db.execute(
        `SELECT kh.khach_hang_id, kh.nguoi_dung_id, kh.trang_thai, kh.ngay_tao,
                nd.ho_ten, nd.email, nd.so_dien_thoai,
                hskh.so_cccd, hskh.ngay_sinh, hskh.dia_chi, hskh.ngay_cap_nhat
         FROM KHACH_HANG kh
         JOIN NGUOI_DUNG nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
         LEFT JOIN HO_SO_KHACH_HANG hskh ON kh.khach_hang_id = hskh.khach_hang_id
         ${whereClause}
         ORDER BY kh.khach_hang_id DESC`,
        params
    );
    return rows;
}

async function kiemTraTrungLap({ soCccd, email, soDienThoai }, excludeKhachHangId = null, db = pool) {
    const excludeParams = excludeKhachHangId ? [excludeKhachHangId] : [];
    const cccdSql = excludeKhachHangId
        ? `SELECT khach_hang_id FROM HO_SO_KHACH_HANG WHERE so_cccd = ? AND khach_hang_id <> ? LIMIT 1`
        : `SELECT khach_hang_id FROM HO_SO_KHACH_HANG WHERE so_cccd = ? LIMIT 1`;
    const [cRows] = await db.execute(cccdSql, [soCccd, ...excludeParams]);
    if (cRows.length > 0) return 'Số CCCD đã tồn tại trong hệ thống.';

    let excludeNguoiDungId = null;
    if (excludeKhachHangId) {
        const [khRows] = await db.execute(`SELECT nguoi_dung_id FROM KHACH_HANG WHERE khach_hang_id = ? LIMIT 1`, [excludeKhachHangId]);
        excludeNguoiDungId = khRows[0] ? khRows[0].nguoi_dung_id : null;
    }

    const emailSql = excludeNguoiDungId
        ? `SELECT nguoi_dung_id FROM NGUOI_DUNG WHERE (email = ? OR so_dien_thoai = ?) AND nguoi_dung_id <> ? LIMIT 1`
        : `SELECT nguoi_dung_id FROM NGUOI_DUNG WHERE email = ? OR so_dien_thoai = ? LIMIT 1`;
    const emailParams = excludeNguoiDungId ? [email, soDienThoai, excludeNguoiDungId] : [email, soDienThoai];
    const [eRows] = await db.execute(emailSql, emailParams);
    if (eRows.length > 0) return 'Email hoặc số điện thoại đã được sử dụng bởi người dùng khác.';

    return null;
}

async function taoKhachHangMoi({ hoTen, email, soDienThoai, soCccd, ngaySinh, diaChi }, conn) {
    const [ndRes] = await conn.execute(
        `INSERT INTO NGUOI_DUNG (ho_ten, email, so_dien_thoai) VALUES (?, ?, ?)`,
        [hoTen, email, soDienThoai]
    );
    const nguoiDungId = ndRes.insertId;

    const [khRes] = await conn.execute(
        `INSERT INTO KHACH_HANG (nguoi_dung_id, trang_thai) VALUES (?, 'HOAT_DONG')`,
        [nguoiDungId]
    );
    const khachHangId = khRes.insertId;

    await conn.execute(
        `INSERT INTO HO_SO_KHACH_HANG (khach_hang_id, so_cccd, ngay_sinh, dia_chi) VALUES (?, ?, ?, ?)`,
        [khachHangId, soCccd, ngaySinh || '1990-01-01', diaChi || null]
    );

    const soTaiKhoanMoi = `90${String(khachHangId).padStart(8, '0')}`;
    await conn.execute(
        `INSERT INTO TAI_KHOAN_THANH_TOAN (khach_hang_id, so_tai_khoan, so_du, ma_ngan_hang, loai_tien, trang_thai, tai_khoan_mac_dinh)
         VALUES (?, ?, 0.00, 'SAVINGS_BANK', 'VND', 'HOAT_DONG', TRUE)`,
        [khachHangId, soTaiKhoanMoi]
    );

    return layKhachHangTheoId(khachHangId, conn);
}

async function capNhatKhachHang(khachHangId, { hoTen, email, soDienThoai, soCccd, ngaySinh, diaChi }, conn) {
    await conn.execute(
        `UPDATE NGUOI_DUNG nd
         JOIN KHACH_HANG kh ON nd.nguoi_dung_id = kh.nguoi_dung_id
         SET nd.ho_ten = ?, nd.email = ?, nd.so_dien_thoai = ?
         WHERE kh.khach_hang_id = ?`,
        [hoTen, email, soDienThoai, khachHangId]
    );

    const [updRes] = await conn.execute(
        `UPDATE HO_SO_KHACH_HANG
         SET so_cccd = ?, ngay_sinh = COALESCE(?, ngay_sinh), dia_chi = ?, ngay_cap_nhat = NOW()
         WHERE khach_hang_id = ?`,
        [soCccd, ngaySinh || null, diaChi || null, khachHangId]
    );

    if (updRes && updRes.affectedRows === 0) {
        await conn.execute(
            `INSERT INTO HO_SO_KHACH_HANG (khach_hang_id, so_cccd, ngay_sinh, dia_chi)
             VALUES (?, ?, ?, ?)`,
            [khachHangId, soCccd, ngaySinh || '1990-01-01', diaChi || null]
        );
    }

    return layKhachHangTheoId(khachHangId, conn);
}

module.exports = {
    layThongTinHoSoTheoCCCD,
    layKhachHangTheoId,
    truyVanToanBo,
    kiemTraTrungLap,
    taoKhachHangMoi,
    capNhatKhachHang
};
