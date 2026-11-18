/**
 * Tầng DAL (:DuLieuHeThong) — Báo cáo thống kê (FR-10) & Quản lý Thông báo (FR-13, EX-02)
 * File: backend/repositories/heThong.repo.js
 */
const { pool } = require('../config/db');
const { NOTIFY_STATUS } = require('../config/constants');

async function tongHopDuLieuBaoCao({ loaiBaoCao, trangThai, from, to }, db = pool) {
    const isMaturityReport = loaiBaoCao === 'SO_DEN_HAN';
    const conditions = isMaturityReport
        ? ['ck.ngay_dao_han IS NOT NULL AND ck.ngay_dao_han BETWEEN ? AND ?']
        : ['stk.ngay_mo BETWEEN ? AND ?'];
    const params = [from, to];

    if (isMaturityReport) {
        conditions.push("stk.trang_thai = 'DANG_HOAT_DONG'");
    } else if (trangThai && trangThai !== 'ALL') {
        conditions.push('stk.trang_thai = ?');
        params.push(trangThai);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const [rows] = await db.execute(
        `SELECT stk.so_tiet_kiem_id, stk.ma_so,
                DATE_FORMAT(stk.ngay_mo, '%Y-%m-%d') AS ngay_mo,
                stk.trang_thai,
                nd.ho_ten AS ten_khach_hang, hskh.so_cccd,
                ck.so_tien_goc, ck.lai_suat_ap_dung,
                DATE_FORMAT(ck.ngay_dao_han, '%Y-%m-%d') AS ngay_dao_han,
                kh_tk.thoi_han, kh_tk.don_vi_thoi_han, kh_tk.loai_ky_han
         FROM SO_TIET_KIEM stk
         JOIN KHACH_HANG kh ON stk.khach_hang_id = kh.khach_hang_id
         JOIN NGUOI_DUNG nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
         LEFT JOIN HO_SO_KHACH_HANG hskh ON kh.khach_hang_id = hskh.khach_hang_id
         JOIN CHU_KY_SO_TIET_KIEM ck
           ON ck.chu_ky_id = (
               SELECT MAX(ck2.chu_ky_id)
               FROM CHU_KY_SO_TIET_KIEM ck2
               WHERE ck2.so_tiet_kiem_id = stk.so_tiet_kiem_id
           )
         JOIN KY_HAN_TIET_KIEM kh_tk ON ck.ky_han_id = kh_tk.ky_han_id
         ${whereClause}
         ORDER BY stk.ngay_mo DESC, stk.so_tiet_kiem_id DESC`,
        params
    );

    const [txSummary] = await db.execute(
        `SELECT
            COALESCE(SUM(CASE WHEN loai_giao_dich IN ('MO_SO', 'GUI_THEM_TIEN') THEN tien_goc ELSE 0 END), 0) AS tong_thu_gui,
            COALESCE(SUM(CASE WHEN loai_giao_dich IN ('TAT_TOAN', 'RUT_TIEN_MAT') THEN tien_goc ELSE 0 END), 0) AS tong_chi_goc,
            COALESCE(SUM(CASE WHEN loai_giao_dich IN ('TAT_TOAN', 'TRA_LAI_DINH_KY') THEN tien_lai ELSE 0 END), 0) AS tong_chi_lai
         FROM GIAO_DICH_TIET_KIEM
         WHERE DATE(ngay_giao_dich) BETWEEN ? AND ? AND trang_thai = 'THANH_CONG'`,
        [from, to]
    );

    const totalPrincipal = rows.reduce((sum, r) => sum + Number(r.so_tien_goc || 0), 0);
    return {
        summary: {
            totalBooks: rows.length,
            totalPrincipal,
            totalDeposits: Number(txSummary[0]?.tong_thu_gui || 0),
            totalWithdrawnPrincipal: Number(txSummary[0]?.tong_chi_goc || 0),
            totalInterestPaid: Number(txSummary[0]?.tong_chi_lai || 0)
        },
        rows
    };
}

async function luuThongBao({ khachHangId, chuKyId, loaiThongBao, kenhGui, noiDung }, db = pool) {
    const [res] = await db.execute(
        `INSERT INTO THONG_BAO (khach_hang_id, chu_ky_id, loai_thong_bao, kenh_gui, trang_thai_gui, noi_dung)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [khachHangId, chuKyId || null, loaiThongBao, kenhGui || 'SMS', NOTIFY_STATUS.PENDING, noiDung]
    );
    return res.insertId;
}

async function capNhatTrangThaiThongBao(thongBaoId, { trangThaiGui, thuLaiSau }, db = pool) {
    const isSent = trangThaiGui === NOTIFY_STATUS.SENT;
    await db.execute(
        `UPDATE THONG_BAO
         SET trang_thai_gui = ?,
             so_lan_thu = so_lan_thu + 1,
             ngay_gui = CASE WHEN ? THEN NOW() ELSE ngay_gui END,
             thu_lai_sau = ?
         WHERE thong_bao_id = ?`,
        [trangThaiGui, isSent ? 1 : 0, thuLaiSau || null, thongBaoId]
    );
}

async function layLichSuThongBao({ khachHangId } = {}, db = pool) {
    const whereClause = khachHangId ? 'WHERE tb.khach_hang_id = ?' : '';
    const params = khachHangId ? [khachHangId] : [];
    const [rows] = await db.execute(
        `SELECT tb.thong_bao_id, tb.khach_hang_id, tb.chu_ky_id, tb.loai_thong_bao,
                tb.kenh_gui, tb.trang_thai_gui, tb.noi_dung, tb.so_lan_thu,
                tb.ngay_tao, tb.ngay_gui,
                nd.ho_ten AS ten_khach_hang
         FROM THONG_BAO tb
         JOIN KHACH_HANG kh ON tb.khach_hang_id = kh.khach_hang_id
         JOIN NGUOI_DUNG nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
         ${whereClause}
         ORDER BY tb.thong_bao_id DESC
         LIMIT 100`,
        params
    );
    return rows;
}

module.exports = {
    tongHopDuLieuBaoCao,
    luuThongBao,
    capNhatTrangThaiThongBao,
    layLichSuThongBao
};
