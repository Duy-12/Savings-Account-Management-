/**
 * Tầng DAL (:DuLieuTaiKhoan) — Truy xuất bảng TAI_KHOAN_DANG_NHAP, VAI_TRO, QUYEN_TRUY_CAP, TAI_KHOAN_THANH_TOAN
 * File: backend/repositories/taiKhoan.repo.js
 */
const { pool } = require('../config/db');
const { ACCOUNT_STATUS } = require('../config/constants');

async function attachRolesAndPermissions(accountRow, db = pool) {
    if (!accountRow) return null;

    const [roleRows] = await db.execute(
        `SELECT DISTINCT vt.ten_vai_tro
         FROM TAI_KHOAN_VAI_TRO tkvt
         JOIN VAI_TRO vt ON tkvt.vai_tro_id = vt.vai_tro_id
         WHERE tkvt.tai_khoan_id = ?`,
        [accountRow.tai_khoan_id]
    );

    const [permRows] = await db.execute(
        `SELECT DISTINCT q.ma_quyen
         FROM TAI_KHOAN_VAI_TRO tkvt
         JOIN VAI_TRO_QUYEN vtq ON tkvt.vai_tro_id = vtq.vai_tro_id
         JOIN QUYEN_TRUY_CAP q ON vtq.quyen_id = q.quyen_id
         WHERE tkvt.tai_khoan_id = ?`,
        [accountRow.tai_khoan_id]
    );

    return {
        ...accountRow,
        roles: roleRows.map((r) => r.ten_vai_tro),
        permissions: permRows.map((p) => p.ma_quyen)
    };
}

/**
 * Tìm thông tin tài khoản theo tên đăng nhập (dùng cho FR-01, EX-01)
 */
async function layThongTinTaiKhoan(tenDangNhap, db = pool) {
    const [rows] = await db.execute(
        `SELECT tk.tai_khoan_id, tk.nguoi_dung_id, tk.ten_dang_nhap, tk.mat_khau_bam,
                tk.trang_thai, tk.so_lan_dang_nhap_sai, tk.khoa_den, tk.dang_nhap_cuoi,
                nd.ho_ten, nd.email, nd.so_dien_thoai,
                kh.khach_hang_id, nv.nhan_vien_id
         FROM TAI_KHOAN_DANG_NHAP tk
         JOIN NGUOI_DUNG nd ON tk.nguoi_dung_id = nd.nguoi_dung_id
         LEFT JOIN KHACH_HANG kh ON nd.nguoi_dung_id = kh.nguoi_dung_id
         LEFT JOIN NHAN_VIEN nv ON nd.nguoi_dung_id = nv.nguoi_dung_id
         WHERE tk.ten_dang_nhap = ?
         LIMIT 1`,
        [tenDangNhap]
    );
    return attachRolesAndPermissions(rows[0] || null, db);
}

/**
 * Tìm thông tin tài khoản theo tai_khoan_id (dùng cho JWT middleware & /auth/me)
 */
async function layThongTinTaiKhoanTheoId(taiKhoanId, db = pool) {
    const [rows] = await db.execute(
        `SELECT tk.tai_khoan_id, tk.nguoi_dung_id, tk.ten_dang_nhap,
                tk.trang_thai, tk.so_lan_dang_nhap_sai, tk.khoa_den, tk.dang_nhap_cuoi,
                nd.ho_ten, nd.email, nd.so_dien_thoai,
                kh.khach_hang_id, nv.nhan_vien_id
         FROM TAI_KHOAN_DANG_NHAP tk
         JOIN NGUOI_DUNG nd ON tk.nguoi_dung_id = nd.nguoi_dung_id
         LEFT JOIN KHACH_HANG kh ON nd.nguoi_dung_id = kh.nguoi_dung_id
         LEFT JOIN NHAN_VIEN nv ON nd.nguoi_dung_id = nv.nguoi_dung_id
         WHERE tk.tai_khoan_id = ?
         LIMIT 1`,
        [taiKhoanId]
    );
    return attachRolesAndPermissions(rows[0] || null, db);
}

async function tangSoLanNhapSai(taiKhoanId, db = pool) {
    await db.execute(
        `UPDATE TAI_KHOAN_DANG_NHAP
         SET so_lan_dang_nhap_sai = COALESCE(so_lan_dang_nhap_sai, 0) + 1
         WHERE tai_khoan_id = ?`,
        [taiKhoanId]
    );
    const [rows] = await db.execute(
        `SELECT so_lan_dang_nhap_sai FROM TAI_KHOAN_DANG_NHAP WHERE tai_khoan_id = ?`,
        [taiKhoanId]
    );
    return rows[0] ? rows[0].so_lan_dang_nhap_sai : 0;
}

async function khoaTaiKhoan(taiKhoanId, khoaDen, db = pool) {
    await db.execute(
        `UPDATE TAI_KHOAN_DANG_NHAP
         SET trang_thai = ?, khoa_den = ?
         WHERE tai_khoan_id = ?`,
        [ACCOUNT_STATUS.TEMP_LOCKED, khoaDen, taiKhoanId]
    );
}

async function resetNhapSaiVaCapNhatDangNhapCuoi(taiKhoanId, db = pool) {
    await db.execute(
        `UPDATE TAI_KHOAN_DANG_NHAP
         SET trang_thai = ?, so_lan_dang_nhap_sai = 0, khoa_den = NULL, dang_nhap_cuoi = NOW()
         WHERE tai_khoan_id = ?`,
        [ACCOUNT_STATUS.ACTIVE, taiKhoanId]
    );
}

async function moKhoaHetHan(taiKhoanId, db = pool) {
    await db.execute(
        `UPDATE TAI_KHOAN_DANG_NHAP
         SET trang_thai = ?, so_lan_dang_nhap_sai = 0, khoa_den = NULL
         WHERE tai_khoan_id = ?`,
        [ACCOUNT_STATUS.ACTIVE, taiKhoanId]
    );
}

async function taoTaiKhoanThanhToanMacDinh(khachHangId, conn) {
    const soTaiKhoanMoi = `90${String(khachHangId).padStart(8, '0')}`;
    await conn.execute(
        `INSERT INTO TAI_KHOAN_THANH_TOAN (khach_hang_id, so_tai_khoan, so_du, ma_ngan_hang, loai_tien, trang_thai, tai_khoan_mac_dinh)
         VALUES (?, ?, 0.00, 'SAVINGS_BANK', 'VND', 'HOAT_DONG', TRUE)`,
        [khachHangId, soTaiKhoanMoi]
    );
    return soTaiKhoanMoi;
}

async function kiemTraTonTaiDangKy({ tenDangNhap, email, soCccd, soDienThoai }, db = pool) {
    const [uRows] = await db.execute(
        `SELECT tai_khoan_id FROM TAI_KHOAN_DANG_NHAP WHERE ten_dang_nhap = ? LIMIT 1`,
        [tenDangNhap]
    );
    if (uRows.length > 0) return 'Tên đăng nhập đã tồn tại.';

    const [eRows] = await db.execute(
        `SELECT nguoi_dung_id FROM NGUOI_DUNG WHERE email = ? OR so_dien_thoai = ? LIMIT 1`,
        [email, soDienThoai]
    );
    if (eRows.length > 0) return 'Email hoặc số điện thoại đã được đăng ký.';

    const [cRows] = await db.execute(
        `SELECT ho_so_id FROM HO_SO_KHACH_HANG WHERE so_cccd = ? LIMIT 1`,
        [soCccd]
    );
    if (cRows.length > 0) return 'Số CCCD đã được đăng ký.';

    return null;
}

async function taoTaiKhoanKhachHang({ hoTen, email, soDienThoai, soCccd, ngaySinh, diaChi, tenDangNhap, matKhauBam }, conn) {
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

    const [tkRes] = await conn.execute(
        `INSERT INTO TAI_KHOAN_DANG_NHAP (nguoi_dung_id, ten_dang_nhap, mat_khau_bam, trang_thai)
         VALUES (?, ?, ?, 'HOAT_DONG')`,
        [nguoiDungId, tenDangNhap, matKhauBam]
    );
    const taiKhoanId = tkRes.insertId;

    await conn.execute(
        `INSERT INTO TAI_KHOAN_VAI_TRO (tai_khoan_id, vai_tro_id)
         SELECT ?, vai_tro_id FROM VAI_TRO WHERE ten_vai_tro = 'KHACH_HANG' LIMIT 1`,
        [taiKhoanId]
    );

    const soTaiKhoanMoi = await taoTaiKhoanThanhToanMacDinh(khachHangId, conn);

    return { taiKhoanId, nguoiDungId, khachHangId, soTaiKhoanMoi };
}

async function layTaiKhoanThanhToanTheoKhachHang(khachHangId, db = pool) {
    const [rows] = await db.execute(
        `SELECT tai_khoan_thanh_toan_id, so_tai_khoan, so_du, ma_ngan_hang, loai_tien, trang_thai, tai_khoan_mac_dinh
         FROM TAI_KHOAN_THANH_TOAN
         WHERE khach_hang_id = ? AND trang_thai = 'HOAT_DONG'
         ORDER BY tai_khoan_mac_dinh DESC, tai_khoan_thanh_toan_id ASC`,
        [khachHangId]
    );
    return rows;
}

/**
 * Đọc và khóa dòng TAI_KHOAN_THANH_TOAN (FOR UPDATE) trong ACID Transaction
 */
async function layVaKhoaTaiKhoanThanhToan(taiKhoanThanhToanId, khachHangId, conn) {
    const [rows] = await conn.execute(
        `SELECT tai_khoan_thanh_toan_id, khach_hang_id, so_tai_khoan, so_du, loai_tien, trang_thai
         FROM TAI_KHOAN_THANH_TOAN
         WHERE tai_khoan_thanh_toan_id = ? AND khach_hang_id = ?
         LIMIT 1
         FOR UPDATE`,
        [taiKhoanThanhToanId, khachHangId]
    );
    return rows[0] || null;
}

async function layTaiKhoanThanhToanMacDinhVaKhoa(khachHangId, conn) {
    const [rows] = await conn.execute(
        `SELECT tai_khoan_thanh_toan_id, khach_hang_id, so_tai_khoan, so_du, loai_tien, trang_thai
         FROM TAI_KHOAN_THANH_TOAN
         WHERE khach_hang_id = ? AND trang_thai = 'HOAT_DONG'
         ORDER BY tai_khoan_mac_dinh DESC, tai_khoan_thanh_toan_id ASC
         LIMIT 1
         FOR UPDATE`,
        [khachHangId]
    );
    return rows[0] || null;
}

async function truTienThanhToan(taiKhoanThanhToanId, soTien, conn) {
    await conn.execute(
        `UPDATE TAI_KHOAN_THANH_TOAN
         SET so_du = so_du - ?
         WHERE tai_khoan_thanh_toan_id = ?`,
        [soTien, taiKhoanThanhToanId]
    );
}

async function congTienVaoTaiKhoan(taiKhoanThanhToanId, soTien, conn) {
    await conn.execute(
        `UPDATE TAI_KHOAN_THANH_TOAN
         SET so_du = so_du + ?
         WHERE tai_khoan_thanh_toan_id = ?`,
        [soTien, taiKhoanThanhToanId]
    );
}

/**
 * Quản trị tài khoản & phân quyền (FR-11)
 */
async function truyVanTatCaTaiKhoan(db = pool) {
    const [rows] = await db.execute(
        `SELECT tk.tai_khoan_id, tk.nguoi_dung_id, tk.ten_dang_nhap, tk.trang_thai,
                tk.so_lan_dang_nhap_sai, tk.khoa_den, tk.dang_nhap_cuoi,
                nd.ho_ten, nd.email, nd.so_dien_thoai,
                GROUP_CONCAT(DISTINCT vt.ten_vai_tro ORDER BY vt.vai_tro_id) AS roles_csv
         FROM TAI_KHOAN_DANG_NHAP tk
         JOIN NGUOI_DUNG nd ON tk.nguoi_dung_id = nd.nguoi_dung_id
         LEFT JOIN TAI_KHOAN_VAI_TRO tkvt ON tk.tai_khoan_id = tkvt.tai_khoan_id
         LEFT JOIN VAI_TRO vt ON tkvt.vai_tro_id = vt.vai_tro_id
         GROUP BY tk.tai_khoan_id, tk.nguoi_dung_id, tk.ten_dang_nhap, tk.trang_thai,
                  tk.so_lan_dang_nhap_sai, tk.khoa_den, tk.dang_nhap_cuoi,
                  nd.ho_ten, nd.email, nd.so_dien_thoai
         ORDER BY tk.tai_khoan_id ASC`
    );

    return rows.map((row) => ({
        ...row,
        roles: row.roles_csv ? row.roles_csv.split(',') : []
    }));
}

async function kiemTraVaiTroTonTai(tenVaiTro, db = pool) {
    const [rows] = await db.execute(
        `SELECT vai_tro_id, ten_vai_tro FROM VAI_TRO WHERE ten_vai_tro = ? LIMIT 1`,
        [tenVaiTro]
    );
    return rows[0] || null;
}

async function kiemTraUsernameHoacEmailTonTai(tenDangNhap, email, db = pool) {
    const [uRows] = await db.execute(
        `SELECT tai_khoan_id FROM TAI_KHOAN_DANG_NHAP WHERE ten_dang_nhap = ? LIMIT 1`,
        [tenDangNhap]
    );
    if (uRows.length > 0) return 'Tên đăng nhập đã tồn tại.';

    const [eRows] = await db.execute(
        `SELECT nguoi_dung_id FROM NGUOI_DUNG WHERE email = ? LIMIT 1`,
        [email]
    );
    if (eRows.length > 0) return 'Email đã tồn tại trong hệ thống.';
    return null;
}

async function taoTaiKhoanVaGanVaiTro({ hoTen, email, soDienThoai, tenDangNhap, matKhauBam, vaiTroId, tenVaiTro }, conn) {
    const [ndRes] = await conn.execute(
        `INSERT INTO NGUOI_DUNG (ho_ten, email, so_dien_thoai) VALUES (?, ?, ?)`,
        [hoTen, email, soDienThoai || null]
    );
    const nguoiDungId = ndRes.insertId;

    if (tenVaiTro === 'GIAO_DICH_VIEN' || tenVaiTro === 'KIEM_SOAT_VIEN') {
        const maNhanVien = `NV${String(nguoiDungId).padStart(4, '0')}`;
        await conn.execute(
            `INSERT INTO NHAN_VIEN (nguoi_dung_id, ma_nhan_vien, trang_thai) VALUES (?, ?, 'DANG_LAM_VIEC')`,
            [nguoiDungId, maNhanVien]
        );
    } else if (tenVaiTro === 'KHACH_HANG') {
        const [khRes] = await conn.execute(
            `INSERT INTO KHACH_HANG (nguoi_dung_id, trang_thai) VALUES (?, 'HOAT_DONG')`,
            [nguoiDungId]
        );
        await taoTaiKhoanThanhToanMacDinh(khRes.insertId, conn);
    }

    const [tkRes] = await conn.execute(
        `INSERT INTO TAI_KHOAN_DANG_NHAP (nguoi_dung_id, ten_dang_nhap, mat_khau_bam, trang_thai)
         VALUES (?, ?, ?, 'HOAT_DONG')`,
        [nguoiDungId, tenDangNhap, matKhauBam]
    );
    const taiKhoanId = tkRes.insertId;

    await conn.execute(
        `INSERT INTO TAI_KHOAN_VAI_TRO (tai_khoan_id, vai_tro_id) VALUES (?, ?)`,
        [taiKhoanId, vaiTroId]
    );

    return layThongTinTaiKhoanTheoId(taiKhoanId, conn);
}

async function capNhatTrangThaiVaVaiTro(taiKhoanId, { vaiTroId, trangThai }, conn) {
    if (trangThai) {
        const resetFields = trangThai === ACCOUNT_STATUS.ACTIVE ? ', so_lan_dang_nhap_sai = 0, khoa_den = NULL' : '';
        await conn.execute(
            `UPDATE TAI_KHOAN_DANG_NHAP
             SET trang_thai = ?${resetFields}
             WHERE tai_khoan_id = ?`,
            [trangThai, taiKhoanId]
        );
    }

    if (vaiTroId) {
        await conn.execute(`DELETE FROM TAI_KHOAN_VAI_TRO WHERE tai_khoan_id = ?`, [taiKhoanId]);
        await conn.execute(
            `INSERT INTO TAI_KHOAN_VAI_TRO (tai_khoan_id, vai_tro_id) VALUES (?, ?)`,
            [taiKhoanId, vaiTroId]
        );
    }

    return layThongTinTaiKhoanTheoId(taiKhoanId, conn);
}

module.exports = {
    layThongTinTaiKhoan,
    layThongTinTaiKhoanTheoId,
    tangSoLanNhapSai,
    khoaTaiKhoan,
    resetNhapSaiVaCapNhatDangNhapCuoi,
    moKhoaHetHan,
    taoTaiKhoanThanhToanMacDinh,
    kiemTraTonTaiDangKy,
    taoTaiKhoanKhachHang,
    layTaiKhoanThanhToanTheoKhachHang,
    layVaKhoaTaiKhoanThanhToan,
    layTaiKhoanThanhToanMacDinhVaKhoa,
    truTienThanhToan,
    congTienVaoTaiKhoan,
    truyVanTatCaTaiKhoan,
    kiemTraVaiTroTonTai,
    kiemTraUsernameHoacEmailTonTai,
    taoTaiKhoanVaGanVaiTro,
    capNhatTrangThaiVaVaiTro
};
