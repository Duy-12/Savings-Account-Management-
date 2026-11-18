/**
 * Tầng DAL (:DuLieuSoTietKiem) — CRUD, Transaction Locking & Audit Trail cho SO_TIET_KIEM
 * File: backend/repositories/soTietKiem.repo.js
 */
const { pool } = require('../config/db');
const { PASSBOOK_STATUS, TX_TYPE, SETTLEMENT_STATUS } = require('../config/constants');

async function taoBanGhiSoMoi(
    {
        khachHangId,
        nhanVienMoId,
        maSo,
        ngayMo,
        kyHanId,
        bieuLaiSuatId,
        soTienGoc,
        laiSuatApDung,
        ngayDaoHan,
        chiThiDaoHan,
        taiKhoanNguonId,
        nguoiXuLyId,
        kenhGiaoDich,
        lyDo
    },
    conn
) {
    const [soRes] = await conn.execute(
        `INSERT INTO SO_TIET_KIEM (khach_hang_id, nhan_vien_mo_id, ma_so, ngay_mo, trang_thai)
         VALUES (?, ?, ?, ?, ?)`,
        [khachHangId, nhanVienMoId || null, maSo, ngayMo, PASSBOOK_STATUS.ACTIVE]
    );
    const soTietKiemId = soRes.insertId;

    const [ckRes] = await conn.execute(
        `INSERT INTO CHU_KY_SO_TIET_KIEM
         (so_tiet_kiem_id, ky_han_id, bieu_lai_suat_id, so_thu_tu_chu_ky, so_tien_goc, lai_suat_ap_dung, ngay_bat_dau, ngay_dao_han, chi_thi_dao_han)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [soTietKiemId, kyHanId, bieuLaiSuatId, soTienGoc, laiSuatApDung, ngayMo, ngayDaoHan, chiThiDaoHan]
    );
    const chuKyId = ckRes.insertId;

    const [gdRes] = await conn.execute(
        `INSERT INTO GIAO_DICH_TIET_KIEM
         (chu_ky_id, tai_khoan_nguon_id, tai_khoan_nhan_id, nguoi_xu_ly_id, loai_giao_dich, tien_goc, tien_lai, lai_suat_ap_dung, kenh_giao_dich, trang_thai)
         VALUES (?, ?, NULL, ?, ?, ?, 0, ?, ?, 'THANH_CONG')`,
        [chuKyId, taiKhoanNguonId || null, nguoiXuLyId, TX_TYPE.OPEN, soTienGoc, laiSuatApDung, kenhGiaoDich]
    );

    await conn.execute(
        `INSERT INTO LICH_SU_TRANG_THAI_SO (so_tiet_kiem_id, tai_khoan_thay_doi_id, trang_thai_cu, trang_thai_moi, ly_do)
         VALUES (?, ?, NULL, ?, ?)`,
        [soTietKiemId, nguoiXuLyId, PASSBOOK_STATUS.ACTIVE, lyDo || 'Mở sổ tiết kiệm mới']
    );

    return {
        soTietKiemId,
        chuKyId,
        giaoDichId: gdRes.insertId,
        maSo
    };
}

async function truyVanSoTietKiem({ q, status, khachHangId } = {}, db = pool) {
    const conditions = [];
    const params = [];

    if (khachHangId) {
        conditions.push('stk.khach_hang_id = ?');
        params.push(khachHangId);
    }
    if (status) {
        conditions.push('stk.trang_thai = ?');
        params.push(status);
    }
    if (q) {
        const like = `%${q.trim()}%`;
        conditions.push('(stk.ma_so LIKE ? OR nd.ho_ten LIKE ? OR hskh.so_cccd LIKE ?)');
        params.push(like, like, like);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await db.execute(
        `SELECT stk.so_tiet_kiem_id, stk.khach_hang_id, stk.nhan_vien_mo_id, stk.ma_so,
                DATE_FORMAT(stk.ngay_mo, '%Y-%m-%d') AS ngay_mo,
                stk.trang_thai, stk.ngay_tat_toan,
                nd.ho_ten AS ten_khach_hang, hskh.so_cccd,
                ck.chu_ky_id, ck.so_thu_tu_chu_ky, ck.so_tien_goc, ck.lai_suat_ap_dung,
                DATE_FORMAT(ck.ngay_bat_dau, '%Y-%m-%d') AS ngay_bat_dau,
                DATE_FORMAT(ck.ngay_dao_han, '%Y-%m-%d') AS ngay_dao_han,
                ck.chi_thi_dao_han,
                kh_tk.thoi_han, kh_tk.don_vi_thoi_han, kh_tk.loai_ky_han,
                sp.ten_san_pham
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
         JOIN SAN_PHAM_TIET_KIEM sp ON kh_tk.san_pham_id = sp.san_pham_id
         ${whereClause}
         ORDER BY stk.so_tiet_kiem_id DESC`,
        params
    );
    return rows;
}

async function layChiTietSo(maSo, db = pool) {
    const [rows] = await db.execute(
        `SELECT stk.so_tiet_kiem_id, stk.khach_hang_id, stk.nhan_vien_mo_id, stk.ma_so,
                DATE_FORMAT(stk.ngay_mo, '%Y-%m-%d') AS ngay_mo,
                stk.trang_thai, stk.ngay_tao, stk.ngay_tat_toan,
                nd.ho_ten AS ten_khach_hang, nd.email, nd.so_dien_thoai, hskh.so_cccd,
                ck.chu_ky_id, ck.ky_han_id, ck.so_thu_tu_chu_ky, ck.so_tien_goc, ck.lai_suat_ap_dung,
                DATE_FORMAT(ck.ngay_bat_dau, '%Y-%m-%d') AS ngay_bat_dau,
                DATE_FORMAT(ck.ngay_dao_han, '%Y-%m-%d') AS ngay_dao_han,
                DATE_FORMAT(ck.ngay_ket_thuc, '%Y-%m-%d') AS ngay_ket_thuc,
                ck.chi_thi_dao_han,
                kh_tk.thoi_han, kh_tk.don_vi_thoi_han, kh_tk.loai_ky_han,
                sp.ten_san_pham
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
         JOIN SAN_PHAM_TIET_KIEM sp ON kh_tk.san_pham_id = sp.san_pham_id
         WHERE stk.ma_so = ?
         LIMIT 1`,
        [maSo]
    );
    if (!rows[0]) return null;

    const passbook = rows[0];
    const [txRows] = await db.execute(
        `SELECT gd.giao_dich_id, gd.loai_giao_dich, gd.ngay_giao_dich, gd.tien_goc, gd.tien_lai,
                gd.lai_suat_ap_dung, gd.kenh_giao_dich, gd.trang_thai
         FROM GIAO_DICH_TIET_KIEM gd
         JOIN CHU_KY_SO_TIET_KIEM ck ON gd.chu_ky_id = ck.chu_ky_id
         WHERE ck.so_tiet_kiem_id = ?
         ORDER BY gd.giao_dich_id DESC`,
        [passbook.so_tiet_kiem_id]
    );

    const [historyRows] = await db.execute(
        `SELECT ls.lich_su_id, ls.trang_thai_cu, ls.trang_thai_moi, ls.ly_do, ls.thoi_diem_thay_doi,
                tk.ten_dang_nhap AS nguoi_thay_doi
         FROM LICH_SU_TRANG_THAI_SO ls
         JOIN TAI_KHOAN_DANG_NHAP tk ON ls.tai_khoan_thay_doi_id = tk.tai_khoan_id
         WHERE ls.so_tiet_kiem_id = ?
         ORDER BY ls.lich_su_id DESC`,
        [passbook.so_tiet_kiem_id]
    );

    return {
        ...passbook,
        transactions: txRows,
        statusHistory: historyRows
    };
}

/**
 * Đọc và khóa dòng SO_TIET_KIEM (FOR UPDATE) trước khi tất toán / đổi trạng thái
 */
async function layVaKhoaSoDeGiaoDich(maSo, conn) {
    const [soRows] = await conn.execute(
        `SELECT so_tiet_kiem_id, khach_hang_id, nhan_vien_mo_id, ma_so,
                DATE_FORMAT(ngay_mo, '%Y-%m-%d') AS ngay_mo, trang_thai
         FROM SO_TIET_KIEM
         WHERE ma_so = ?
         LIMIT 1
         FOR UPDATE`,
        [maSo]
    );
    if (!soRows[0]) return null;

    const so = soRows[0];
    const [ckRows] = await conn.execute(
        `SELECT ck.chu_ky_id, ck.ky_han_id, ck.bieu_lai_suat_id, ck.so_thu_tu_chu_ky,
                ck.so_tien_goc, ck.lai_suat_ap_dung,
                DATE_FORMAT(ck.ngay_bat_dau, '%Y-%m-%d') AS ngay_bat_dau,
                DATE_FORMAT(ck.ngay_dao_han, '%Y-%m-%d') AS ngay_dao_han,
                ck.chi_thi_dao_han,
                kh.thoi_han, kh.don_vi_thoi_han, kh.loai_ky_han
         FROM CHU_KY_SO_TIET_KIEM ck
         JOIN KY_HAN_TIET_KIEM kh ON ck.ky_han_id = kh.ky_han_id
         WHERE ck.so_tiet_kiem_id = ?
         ORDER BY ck.chu_ky_id DESC
         LIMIT 1`,
        [so.so_tiet_kiem_id]
    );

    return {
        ...so,
        chuKyHienTai: ckRows[0] || null
    };
}

async function capNhatTrangThai(soTietKiemId, { trangThaiCu, trangThaiMoi, taiKhoanThayDoiId, lyDo }, conn) {
    await conn.execute(
        `UPDATE SO_TIET_KIEM SET trang_thai = ? WHERE so_tiet_kiem_id = ?`,
        [trangThaiMoi, soTietKiemId]
    );

    const [lsRes] = await conn.execute(
        `INSERT INTO LICH_SU_TRANG_THAI_SO (so_tiet_kiem_id, tai_khoan_thay_doi_id, trang_thai_cu, trang_thai_moi, ly_do)
         VALUES (?, ?, ?, ?, ?)`,
        [soTietKiemId, taiKhoanThayDoiId, trangThaiCu, trangThaiMoi, lyDo]
    );

    return { lichSuId: lsRes.insertId };
}

async function hoanTatTatToan(
    {
        soTietKiemId,
        chuKyId,
        ngayTatToan,
        taiKhoanNhanId,
        nguoiXuLyId,
        nhanVienXuLyId,
        loaiTatToan,
        tienGoc,
        tienLai,
        laiSuatApDung,
        kenhGiaoDich
    },
    conn
) {
    await conn.execute(
        `UPDATE SO_TIET_KIEM
         SET trang_thai = ?, ngay_tat_toan = NOW()
         WHERE so_tiet_kiem_id = ?`,
        [PASSBOOK_STATUS.SETTLED, soTietKiemId]
    );

    await conn.execute(
        `UPDATE CHU_KY_SO_TIET_KIEM
         SET ngay_ket_thuc = ?
         WHERE chu_ky_id = ?`,
        [ngayTatToan, chuKyId]
    );

    const [gdRes] = await conn.execute(
        `INSERT INTO GIAO_DICH_TIET_KIEM
         (chu_ky_id, tai_khoan_nguon_id, tai_khoan_nhan_id, nguoi_xu_ly_id, loai_giao_dich, tien_goc, tien_lai, lai_suat_ap_dung, kenh_giao_dich, trang_thai)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'THANH_CONG')`,
        [chuKyId, taiKhoanNhanId || null, nguoiXuLyId, TX_TYPE.SETTLEMENT, tienGoc, tienLai, laiSuatApDung, kenhGiaoDich]
    );
    const giaoDichId = gdRes.insertId;

    await conn.execute(
        `INSERT INTO YEU_CAU_TAT_TOAN
         (chu_ky_id, tai_khoan_yeu_cau_id, nhan_vien_xu_ly_id, giao_dich_id, loai_tat_toan, lai_du_kien, tong_tien_du_kien, lai_suat_ap_dung, trang_thai, ngay_xac_nhan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            chuKyId,
            nguoiXuLyId,
            nhanVienXuLyId || null,
            giaoDichId,
            loaiTatToan,
            tienLai,
            tienGoc + tienLai,
            laiSuatApDung,
            SETTLEMENT_STATUS.APPROVED
        ]
    );

    await conn.execute(
        `INSERT INTO LICH_SU_TRANG_THAI_SO (so_tiet_kiem_id, tai_khoan_thay_doi_id, trang_thai_cu, trang_thai_moi, ly_do)
         VALUES (?, ?, ?, ?, ?)`,
        [soTietKiemId, nguoiXuLyId, PASSBOOK_STATUS.ACTIVE, PASSBOOK_STATUS.SETTLED, `Tất toán sổ (${loaiTatToan})`]
    );

    return { giaoDichId };
}

async function locSoSapDaoHan(soNgay = 3, db = pool) {
    const [rows] = await db.execute(
        `SELECT stk.so_tiet_kiem_id, stk.khach_hang_id, stk.ma_so,
                ck.chu_ky_id, ck.so_tien_goc, ck.lai_suat_ap_dung,
                DATE_FORMAT(ck.ngay_bat_dau, '%Y-%m-%d') AS ngay_bat_dau,
                DATE_FORMAT(ck.ngay_dao_han, '%Y-%m-%d') AS ngay_dao_han,
                nd.ho_ten, nd.email, nd.so_dien_thoai
         FROM SO_TIET_KIEM stk
         JOIN KHACH_HANG kh ON stk.khach_hang_id = kh.khach_hang_id
         JOIN NGUOI_DUNG nd ON kh.nguoi_dung_id = nd.nguoi_dung_id
         JOIN CHU_KY_SO_TIET_KIEM ck
           ON ck.chu_ky_id = (
               SELECT MAX(ck2.chu_ky_id)
               FROM CHU_KY_SO_TIET_KIEM ck2
               WHERE ck2.so_tiet_kiem_id = stk.so_tiet_kiem_id
           )
         WHERE stk.trang_thai = 'DANG_HOAT_DONG'
           AND ck.ngay_dao_han IS NOT NULL
           AND DATEDIFF(ck.ngay_dao_han, CURDATE()) BETWEEN 0 AND ?
           AND NOT EXISTS (
               SELECT 1 FROM THONG_BAO tb
               WHERE tb.chu_ky_id = ck.chu_ky_id
                 AND tb.loai_thong_bao = 'NHAC_DAO_HAN'
                 AND tb.trang_thai_gui = 'DA_GUI'
           )`,
        [soNgay]
    );
    return rows;
}

async function locSoToiHanHomNay(conn) {
    const [rows] = await conn.execute(
        `SELECT stk.so_tiet_kiem_id, stk.khach_hang_id, stk.ma_so, stk.trang_thai,
                ck.chu_ky_id, ck.ky_han_id, ck.bieu_lai_suat_id, ck.so_thu_tu_chu_ky,
                ck.so_tien_goc, ck.lai_suat_ap_dung,
                DATE_FORMAT(ck.ngay_bat_dau, '%Y-%m-%d') AS ngay_bat_dau,
                DATE_FORMAT(ck.ngay_dao_han, '%Y-%m-%d') AS ngay_dao_han,
                ck.chi_thi_dao_han,
                kh_tk.thoi_han, kh_tk.don_vi_thoi_han
         FROM SO_TIET_KIEM stk
         JOIN CHU_KY_SO_TIET_KIEM ck
           ON ck.chu_ky_id = (
               SELECT MAX(ck2.chu_ky_id)
               FROM CHU_KY_SO_TIET_KIEM ck2
               WHERE ck2.so_tiet_kiem_id = stk.so_tiet_kiem_id
           )
         JOIN KY_HAN_TIET_KIEM kh_tk ON ck.ky_han_id = kh_tk.ky_han_id
         WHERE stk.trang_thai = 'DANG_HOAT_DONG'
           AND ck.ngay_dao_han IS NOT NULL
           AND ck.ngay_dao_han <= CURDATE()
         FOR UPDATE`
    );
    return rows;
}

async function dongChuKyCuVaMoChuKyMoi(
    {
        soTietKiemId,
        chuKyCuId,
        ngayKetThucCu,
        kyHanId,
        bieuLaiSuatId,
        soThuTuChuKyMoi,
        soTienGocMoi,
        laiSuatApDung,
        ngayBatDauMoi,
        ngayDaoHanMoi,
        chiThiDaoHan,
        tienLaiKyCu,
        taiKhoanNhanLaiId,
        nguoiXuLyId
    },
    conn
) {
    await conn.execute(
        `UPDATE CHU_KY_SO_TIET_KIEM SET ngay_ket_thuc = ? WHERE chu_ky_id = ?`,
        [ngayKetThucCu, chuKyCuId]
    );

    await conn.execute(
        `INSERT INTO GIAO_DICH_TIET_KIEM
         (chu_ky_id, tai_khoan_nguon_id, tai_khoan_nhan_id, nguoi_xu_ly_id, loai_giao_dich, tien_goc, tien_lai, lai_suat_ap_dung, kenh_giao_dich, trang_thai)
         VALUES (?, NULL, ?, ?, ?, 0, ?, ?, 'INTERNET_BANKING', 'THANH_CONG')`,
        [chuKyCuId, taiKhoanNhanLaiId || null, nguoiXuLyId, TX_TYPE.PERIODIC_INTEREST, tienLaiKyCu, laiSuatApDung]
    );

    const [ckRes] = await conn.execute(
        `INSERT INTO CHU_KY_SO_TIET_KIEM
         (so_tiet_kiem_id, ky_han_id, bieu_lai_suat_id, so_thu_tu_chu_ky, so_tien_goc, lai_suat_ap_dung, ngay_bat_dau, ngay_dao_han, chi_thi_dao_han)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            soTietKiemId,
            kyHanId,
            bieuLaiSuatId,
            soThuTuChuKyMoi,
            soTienGocMoi,
            laiSuatApDung,
            ngayBatDauMoi,
            ngayDaoHanMoi,
            chiThiDaoHan
        ]
    );

    return { chuKyMoiId: ckRes.insertId };
}

module.exports = {
    taoBanGhiSoMoi,
    truyVanSoTietKiem,
    layChiTietSo,
    layVaKhoaSoDeGiaoDich,
    capNhatTrangThai,
    hoanTatTatToan,
    locSoSapDaoHan,
    locSoToiHanHomNay,
    dongChuKyCuVaMoChuKyMoi
};
