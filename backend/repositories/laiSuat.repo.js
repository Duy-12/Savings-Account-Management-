/**
 * Tầng DAL (:DuLieuLaiSuat) — Truy xuất SAN_PHAM_TIET_KIEM, KY_HAN_TIET_KIEM, BIEU_LAI_SUAT (FR-06, FR-12, EX-03)
 * File: backend/repositories/laiSuat.repo.js
 */
const { pool } = require('../config/db');

/**
 * Lấy danh sách sản phẩm, kỳ hạn và biểu lãi suất đang hiệu lực
 */
async function truyVanTatCa(db = pool) {
    const [rows] = await db.execute(
        `SELECT kh.ky_han_id, kh.san_pham_id, sp.ten_san_pham, sp.so_tien_toi_thieu, sp.loai_tien,
                kh.thoi_han, kh.don_vi_thoi_han, kh.loai_ky_han, kh.trang_thai AS trang_thai_ky_han,
                bls.bieu_lai_suat_id, bls.lai_suat_nam, bls.hieu_luc_tu, bls.hieu_luc_den
         FROM KY_HAN_TIET_KIEM kh
         JOIN SAN_PHAM_TIET_KIEM sp ON kh.san_pham_id = sp.san_pham_id
         LEFT JOIN BIEU_LAI_SUAT bls
           ON kh.ky_han_id = bls.ky_han_id
          AND bls.hieu_luc_tu <= CURDATE()
          AND (bls.hieu_luc_den IS NULL OR bls.hieu_luc_den >= CURDATE())
         WHERE sp.trang_thai = 'HOAT_DONG' AND kh.trang_thai = 'HOAT_DONG'
         ORDER BY sp.san_pham_id ASC, kh.thoi_han ASC, bls.bieu_lai_suat_id DESC`
    );

    // Giữ lại đúng 1 biểu lãi suất hiệu lực mới nhất cho mỗi kỳ hạn
    const seen = new Set();
    return rows.filter((row) => {
        if (seen.has(row.ky_han_id)) return false;
        seen.add(row.ky_han_id);
        return true;
    });
}

async function layThongTinKyHanVaLaiSuat(kyHanId, db = pool) {
    const [rows] = await db.execute(
        `SELECT kh.ky_han_id, kh.san_pham_id, sp.ten_san_pham, sp.so_tien_toi_thieu, sp.loai_tien,
                kh.thoi_han, kh.don_vi_thoi_han, kh.loai_ky_han, kh.trang_thai AS trang_thai_ky_han,
                bls.bieu_lai_suat_id, bls.lai_suat_nam, bls.hieu_luc_tu
         FROM KY_HAN_TIET_KIEM kh
         JOIN SAN_PHAM_TIET_KIEM sp ON kh.san_pham_id = sp.san_pham_id
         LEFT JOIN BIEU_LAI_SUAT bls
           ON kh.ky_han_id = bls.ky_han_id
          AND bls.hieu_luc_tu <= CURDATE()
          AND (bls.hieu_luc_den IS NULL OR bls.hieu_luc_den >= CURDATE())
         WHERE kh.ky_han_id = ?
         ORDER BY bls.bieu_lai_suat_id DESC
         LIMIT 1`,
        [kyHanId]
    );
    return rows[0] || null;
}

async function layLaiSuatKhongKyHan(db = pool) {
    const [rows] = await db.execute(
        `SELECT kh.ky_han_id, bls.bieu_lai_suat_id, bls.lai_suat_nam
         FROM KY_HAN_TIET_KIEM kh
         JOIN BIEU_LAI_SUAT bls ON kh.ky_han_id = bls.ky_han_id
         WHERE kh.loai_ky_han = 'KHONG_KY_HAN'
           AND kh.trang_thai = 'HOAT_DONG'
           AND bls.hieu_luc_tu <= CURDATE()
           AND (bls.hieu_luc_den IS NULL OR bls.hieu_luc_den >= CURDATE())
         ORDER BY bls.bieu_lai_suat_id DESC
         LIMIT 1`
    );
    return rows[0] || { ky_han_id: null, bieu_lai_suat_id: null, lai_suat_nam: 0.15 };
}

async function kiemTraSanPhamTonTai(sanPhamId, db = pool) {
    const [rows] = await db.execute(
        `SELECT san_pham_id, ten_san_pham, so_tien_toi_thieu FROM SAN_PHAM_TIET_KIEM WHERE san_pham_id = ? LIMIT 1`,
        [sanPhamId]
    );
    return rows[0] || null;
}

async function kiemTraTrungKyHan(sanPhamId, thoiHan, donViThoiHan, db = pool) {
    const [rows] = await db.execute(
        `SELECT ky_han_id FROM KY_HAN_TIET_KIEM
         WHERE san_pham_id = ? AND thoi_han = ? AND don_vi_thoi_han = ? AND trang_thai = 'HOAT_DONG'
         LIMIT 1`,
        [sanPhamId, thoiHan, donViThoiHan]
    );
    return rows.length > 0;
}

async function taoKyHanVaBieuLaiSuat({ sanPhamId, thoiHan, donViThoiHan, loaiKyHan, laiSuatNam }, conn) {
    const [khRes] = await conn.execute(
        `INSERT INTO KY_HAN_TIET_KIEM (san_pham_id, thoi_han, don_vi_thoi_han, loai_ky_han, trang_thai)
         VALUES (?, ?, ?, ?, 'HOAT_DONG')`,
        [sanPhamId, thoiHan, donViThoiHan, loaiKyHan]
    );
    const kyHanId = khRes.insertId;

    const [blsRes] = await conn.execute(
        `INSERT INTO BIEU_LAI_SUAT (ky_han_id, lai_suat_nam, hieu_luc_tu, hieu_luc_den)
         VALUES (?, ?, CURDATE(), NULL)`,
        [kyHanId, laiSuatNam]
    );

    return {
        kyHanId,
        bieuLaiSuatId: blsRes.insertId
    };
}

async function capNhatLaiSuatKyHan(kyHanId, { laiSuatNam, soTienToiThieu }, conn) {
    await conn.execute(
        `UPDATE BIEU_LAI_SUAT
         SET hieu_luc_den = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
         WHERE ky_han_id = ? AND hieu_luc_den IS NULL AND hieu_luc_tu < CURDATE()`,
        [kyHanId]
    );

    await conn.execute(
        `UPDATE BIEU_LAI_SUAT
         SET hieu_luc_den = CURDATE()
         WHERE ky_han_id = ? AND hieu_luc_den IS NULL AND hieu_luc_tu = CURDATE()`,
        [kyHanId]
    );

    const [blsRes] = await conn.execute(
        `INSERT INTO BIEU_LAI_SUAT (ky_han_id, lai_suat_nam, hieu_luc_tu, hieu_luc_den)
         VALUES (?, ?, CURDATE(), NULL)`,
        [kyHanId, laiSuatNam]
    );

    if (soTienToiThieu !== undefined && soTienToiThieu !== null) {
        await conn.execute(
            `UPDATE SAN_PHAM_TIET_KIEM sp
             JOIN KY_HAN_TIET_KIEM kh ON sp.san_pham_id = kh.san_pham_id
             SET sp.so_tien_toi_thieu = ?
             WHERE kh.ky_han_id = ?`,
            [soTienToiThieu, kyHanId]
        );
    }

    return layThongTinKyHanVaLaiSuat(kyHanId, conn);
}

module.exports = {
    truyVanTatCa,
    layThongTinKyHanVaLaiSuat,
    layLaiSuatKhongKyHan,
    kiemTraSanPhamTonTai,
    kiemTraTrungKyHan,
    taoKyHanVaBieuLaiSuat,
    capNhatLaiSuatKyHan
};
