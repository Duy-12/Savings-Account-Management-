-- ====================================================================
-- HỆ THỐNG QUẢN LÝ SỔ TIẾT KIỆM (SAVINGS ACCOUNT MANAGEMENT SYSTEM)
-- Cơ sở dữ liệu: MySQL 8.0+
-- Tiêu chuẩn: Core Banking System - Phân tích Thiết kế HTTT (PTTKHDT)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `quan_ly_so_tiet_kiem` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `quan_ly_so_tiet_kiem`;

-- Tắt kiểm tra khóa ngoại để hỗ trợ reset/drop an toàn
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================
-- 1. BẢNG NGUOI_DUNG (Định danh người dùng tổng quát)
-- ====================================================================
DROP TABLE IF EXISTS `NGUOI_DUNG`;
CREATE TABLE `NGUOI_DUNG` (
    `nguoi_dung_id` INT AUTO_INCREMENT,
    `ho_ten` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `so_dien_thoai` VARCHAR(255) NULL,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`nguoi_dung_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 2. BẢNG KHACH_HANG (Thực thể Khách hàng - Kế thừa Người dùng)
-- ====================================================================
DROP TABLE IF EXISTS `KHACH_HANG`;
CREATE TABLE `KHACH_HANG` (
    `khach_hang_id` INT AUTO_INCREMENT,
    `nguoi_dung_id` INT NOT NULL,
    `trang_thai` VARCHAR(255) DEFAULT 'HOAT_DONG',
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`khach_hang_id`),
    CONSTRAINT `fk_kh_nguoidung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NGUOI_DUNG`(`nguoi_dung_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 3. BẢNG HO_SO_KHACH_HANG (Thông tin định danh CCCD & Địa chỉ)
-- ====================================================================
DROP TABLE IF EXISTS `HO_SO_KHACH_HANG`;
CREATE TABLE `HO_SO_KHACH_HANG` (
    `ho_so_id` INT AUTO_INCREMENT,
    `khach_hang_id` INT NOT NULL,
    `so_cccd` VARCHAR(255) UNIQUE NOT NULL,
    `ngay_sinh` DATE NOT NULL,
    `dia_chi` VARCHAR(255) NULL,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ho_so_id`),
    CONSTRAINT `fk_hskh_khachhang` FOREIGN KEY (`khach_hang_id`) REFERENCES `KHACH_HANG`(`khach_hang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 4. BẢNG NHAN_VIEN (Thực thể Nhân viên ngân hàng)
-- ====================================================================
DROP TABLE IF EXISTS `NHAN_VIEN`;
CREATE TABLE `NHAN_VIEN` (
    `nhan_vien_id` INT AUTO_INCREMENT,
    `nguoi_dung_id` INT NOT NULL,
    `ma_nhan_vien` VARCHAR(255) UNIQUE NOT NULL,
    `trang_thai` VARCHAR(255) DEFAULT 'DANG_LAM_VIEC',
    PRIMARY KEY (`nhan_vien_id`),
    CONSTRAINT `fk_nv_nguoidung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NGUOI_DUNG`(`nguoi_dung_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 5. BẢNG TAI_KHOAN_DANG_NHAP (Xác thực đăng nhập hệ thống)
-- ====================================================================
DROP TABLE IF EXISTS `TAI_KHOAN_DANG_NHAP`;
CREATE TABLE `TAI_KHOAN_DANG_NHAP` (
    `tai_khoan_id` INT AUTO_INCREMENT,
    `nguoi_dung_id` INT NOT NULL,
    `ten_dang_nhap` VARCHAR(255) UNIQUE NOT NULL,
    `mat_khau_bam` VARCHAR(255) NOT NULL,
    `trang_thai` VARCHAR(255) DEFAULT 'HOAT_DONG',
    `so_lan_dang_nhap_sai` INT DEFAULT 0,
    `khoa_den` DATETIME NULL,
    `dang_nhap_cuoi` DATETIME NULL,
    PRIMARY KEY (`tai_khoan_id`),
    CONSTRAINT `fk_tkdn_nguoidung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NGUOI_DUNG`(`nguoi_dung_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 6. BẢNG VAI_TRO (Role-Based Access Control - RBAC)
-- ====================================================================
DROP TABLE IF EXISTS `VAI_TRO`;
CREATE TABLE `VAI_TRO` (
    `vai_tro_id` INT AUTO_INCREMENT,
    `ten_vai_tro` VARCHAR(255) UNIQUE NOT NULL,
    `mo_ta` VARCHAR(255) NULL,
    PRIMARY KEY (`vai_tro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 7. BẢNG QUYEN_TRUY_CAP (Permissions)
-- ====================================================================
DROP TABLE IF EXISTS `QUYEN_TRUY_CAP`;
CREATE TABLE `QUYEN_TRUY_CAP` (
    `quyen_id` INT AUTO_INCREMENT,
    `ma_quyen` VARCHAR(255) UNIQUE NOT NULL,
    `mo_ta` VARCHAR(255) NULL,
    PRIMARY KEY (`quyen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 8. BẢNG TAI_KHOAN_VAI_TRO (Quan hệ N-N Tài khoản - Vai trò)
-- ====================================================================
DROP TABLE IF EXISTS `TAI_KHOAN_VAI_TRO`;
CREATE TABLE `TAI_KHOAN_VAI_TRO` (
    `tai_khoan_vai_tro_id` INT AUTO_INCREMENT,
    `tai_khoan_id` INT NOT NULL,
    `vai_tro_id` INT NOT NULL,
    `ngay_gan` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`tai_khoan_vai_tro_id`),
    CONSTRAINT `fk_tkvt_taikhoan` FOREIGN KEY (`tai_khoan_id`) REFERENCES `TAI_KHOAN_DANG_NHAP`(`tai_khoan_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tkvt_vaitro` FOREIGN KEY (`vai_tro_id`) REFERENCES `VAI_TRO`(`vai_tro_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 9. BẢNG VAI_TRO_QUYEN (Quan hệ N-N Vai trò - Quyền hạn)
-- ====================================================================
DROP TABLE IF EXISTS `VAI_TRO_QUYEN`;
CREATE TABLE `VAI_TRO_QUYEN` (
    `vai_tro_quyen_id` INT AUTO_INCREMENT,
    `vai_tro_id` INT NOT NULL,
    `quyen_id` INT NOT NULL,
    PRIMARY KEY (`vai_tro_quyen_id`),
    CONSTRAINT `fk_vtq_vaitro` FOREIGN KEY (`vai_tro_id`) REFERENCES `VAI_TRO`(`vai_tro_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_vtq_quyen` FOREIGN KEY (`quyen_id`) REFERENCES `QUYEN_TRUY_CAP`(`quyen_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 10. BẢNG TAI_KHOAN_THANH_TOAN (Tài khoản CASA khách hàng)
-- ====================================================================
DROP TABLE IF EXISTS `TAI_KHOAN_THANH_TOAN`;
CREATE TABLE `TAI_KHOAN_THANH_TOAN` (
    `tai_khoan_thanh_toan_id` INT AUTO_INCREMENT,
    `khach_hang_id` INT NOT NULL,
    `so_tai_khoan` VARCHAR(255) NOT NULL UNIQUE,
    `ma_ngan_hang` VARCHAR(255) DEFAULT 'SAVINGS_BANK',
    `loai_tien` VARCHAR(255) DEFAULT 'VND',
    `trang_thai` VARCHAR(255) DEFAULT 'HOAT_DONG',
    `tai_khoan_mac_dinh` BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (`tai_khoan_thanh_toan_id`),
    CONSTRAINT `fk_tktt_khachhang` FOREIGN KEY (`khach_hang_id`) REFERENCES `KHACH_HANG`(`khach_hang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 11. BẢNG SAN_PHAM_TIET_KIEM (Danh mục sản phẩm tiền gửi)
-- ====================================================================
DROP TABLE IF EXISTS `SAN_PHAM_TIET_KIEM`;
CREATE TABLE `SAN_PHAM_TIET_KIEM` (
    `san_pham_id` INT AUTO_INCREMENT,
    `ten_san_pham` VARCHAR(255) NOT NULL,
    `so_tien_toi_thieu` DECIMAL(15, 2) NOT NULL DEFAULT 100000.00,
    `loai_tien` VARCHAR(255) DEFAULT 'VND',
    `trang_thai` VARCHAR(255) DEFAULT 'HOAT_DONG',
    PRIMARY KEY (`san_pham_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 12. BẢNG KY_HAN_TIET_KIEM (Kỳ hạn gửi của từng sản phẩm)
-- ====================================================================
DROP TABLE IF EXISTS `KY_HAN_TIET_KIEM`;
CREATE TABLE `KY_HAN_TIET_KIEM` (
    `ky_han_id` INT AUTO_INCREMENT,
    `san_pham_id` INT NOT NULL,
    `thoi_han` INT NOT NULL DEFAULT 0, -- 0: không kỳ hạn, 3: 3 tháng, 6: 6 tháng...
    `don_vi_thoi_han` VARCHAR(255) DEFAULT 'THANG', -- NGAY, THANG, NAM
    `loai_ky_han` VARCHAR(255) NOT NULL, -- KHONG_KY_HAN, CO_KY_HAN
    `trang_thai` VARCHAR(255) DEFAULT 'HOAT_DONG',
    PRIMARY KEY (`ky_han_id`),
    CONSTRAINT `fk_kh_sanpham` FOREIGN KEY (`san_pham_id`) REFERENCES `SAN_PHAM_TIET_KIEM`(`san_pham_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 13. BẢNG BIEU_LAI_SUAT (Lịch sử biểu lãi suất theo thời gian)
-- ====================================================================
DROP TABLE IF EXISTS `BIEU_LAI_SUAT`;
CREATE TABLE `BIEU_LAI_SUAT` (
    `bieu_lai_suat_id` INT AUTO_INCREMENT,
    `ky_han_id` INT NOT NULL,
    `lai_suat_nam` DECIMAL(15, 2) NOT NULL,
    `hieu_luc_tu` DATE NOT NULL,
    `hieu_luc_den` DATE NULL,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`bieu_lai_suat_id`),
    CONSTRAINT `fk_bls_kyhan` FOREIGN KEY (`ky_han_id`) REFERENCES `KY_HAN_TIET_KIEM`(`ky_han_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 14. BẢNG SO_TIET_KIEM (Sổ Tiết Kiệm - Core Entity)
-- ====================================================================
DROP TABLE IF EXISTS `SO_TIET_KIEM`;
CREATE TABLE `SO_TIET_KIEM` (
    `so_tiet_kiem_id` INT AUTO_INCREMENT,
    `khach_hang_id` INT NOT NULL,
    `nhan_vien_mo_id` INT NOT NULL,
    `ma_so` VARCHAR(255) UNIQUE NOT NULL,
    `ngay_mo` DATE NOT NULL,
    `trang_thai` VARCHAR(255) DEFAULT 'DANG_HOAT_DONG', -- DANG_HOAT_DONG, PHONG_TOA, DA_TAT_TOAN
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_tat_toan` DATETIME NULL,
    PRIMARY KEY (`so_tiet_kiem_id`),
    CONSTRAINT `fk_stk_khachhang` FOREIGN KEY (`khach_hang_id`) REFERENCES `KHACH_HANG`(`khach_hang_id`),
    CONSTRAINT `fk_stk_nhanvien` FOREIGN KEY (`nhan_vien_mo_id`) REFERENCES `NHAN_VIEN`(`nhan_vien_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 15. BẢNG CHU_KY_SO_TIET_KIEM (Quản lý từng chu kỳ gửi & tái tục)
-- ====================================================================
DROP TABLE IF EXISTS `CHU_KY_SO_TIET_KIEM`;
CREATE TABLE `CHU_KY_SO_TIET_KIEM` (
    `chu_ky_id` INT AUTO_INCREMENT,
    `so_tiet_kiem_id` INT NOT NULL,
    `ky_han_id` INT NOT NULL,
    `bieu_lai_suat_id` INT NOT NULL,
    `so_thu_tu_chu_ky` INT NOT NULL DEFAULT 1,
    `so_tien_goc` DECIMAL(15, 2) NOT NULL,
    `lai_suat_ap_dung` DECIMAL(15, 2) NOT NULL,
    `ngay_bat_dau` DATE NOT NULL,
    `ngay_dao_han` DATE NULL,
    `ngay_ket_thuc` DATE NULL,
    `chi_thi_dao_han` VARCHAR(255) DEFAULT 'TAI_TUC_GOC_VA_LAI', -- TAI_TUC_GOC_VA_LAI, TAI_TUC_GOC_CHUYEN_LAI, KHONG_TAI_TUC
    PRIMARY KEY (`chu_ky_id`),
    CONSTRAINT `fk_ck_sotietkiem` FOREIGN KEY (`so_tiet_kiem_id`) REFERENCES `SO_TIET_KIEM`(`so_tiet_kiem_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ck_kyhan` FOREIGN KEY (`ky_han_id`) REFERENCES `KY_HAN_TIET_KIEM`(`ky_han_id`),
    CONSTRAINT `fk_ck_bieulaisuat` FOREIGN KEY (`bieu_lai_suat_id`) REFERENCES `BIEU_LAI_SUAT`(`bieu_lai_suat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 16. BẢNG GIAO_DICH_TIET_KIEM (Sổ cái giao dịch gửi, rút, tất toán)
-- ====================================================================
DROP TABLE IF EXISTS `GIAO_DICH_TIET_KIEM`;
CREATE TABLE `GIAO_DICH_TIET_KIEM` (
    `giao_dich_id` INT AUTO_INCREMENT,
    `chu_ky_id` INT NOT NULL,
    `tai_khoan_nguon_id` INT NULL,
    `tai_khoan_nhan_id` INT NULL,
    `nguoi_xu_ly_id` INT NOT NULL,
    `loai_giao_dich` VARCHAR(255) NOT NULL, -- MO_SO, GUI_THEM_TIEN, RUT_TIEN_MAT, TAT_TOAN, TRA_LAI_DINH_KY
    `ngay_giao_dich` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `tien_goc` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tien_lai` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `lai_suat_ap_dung` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `kenh_giao_dich` VARCHAR(255) DEFAULT 'TAI_QUAY', -- TAI_QUAY, INTERNET_BANKING, MOBILE_BANKING
    `trang_thai` VARCHAR(255) DEFAULT 'THANH_CONG', -- THANH_CONG, THAT_BAI, CHO_XU_LY
    PRIMARY KEY (`giao_dich_id`),
    CONSTRAINT `fk_gd_chuky` FOREIGN KEY (`chu_ky_id`) REFERENCES `CHU_KY_SO_TIET_KIEM`(`chu_ky_id`),
    CONSTRAINT `fk_gd_tknguon` FOREIGN KEY (`tai_khoan_nguon_id`) REFERENCES `TAI_KHOAN_THANH_TOAN`(`tai_khoan_thanh_toan_id`),
    CONSTRAINT `fk_gd_tknhan` FOREIGN KEY (`tai_khoan_nhan_id`) REFERENCES `TAI_KHOAN_THANH_TOAN`(`tai_khoan_thanh_toan_id`),
    CONSTRAINT `fk_gd_nguoixuly` FOREIGN KEY (`nguoi_xu_ly_id`) REFERENCES `TAI_KHOAN_DANG_NHAP`(`tai_khoan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 17. BẢNG LICH_SU_TRANG_THAI_SO (Audit Trail kiểm toán thay đổi)
-- ====================================================================
DROP TABLE IF EXISTS `LICH_SU_TRANG_THAI_SO`;
CREATE TABLE `LICH_SU_TRANG_THAI_SO` (
    `lich_su_id` INT AUTO_INCREMENT,
    `so_tiet_kiem_id` INT NOT NULL,
    `tai_khoan_thay_doi_id` INT NOT NULL,
    `trang_thai_cu` VARCHAR(255) NULL,
    `trang_thai_moi` VARCHAR(255) NOT NULL,
    `ly_do` VARCHAR(255) NULL,
    `thoi_diem_thay_doi` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`lich_su_id`),
    CONSTRAINT `fk_ls_sotietkiem` FOREIGN KEY (`so_tiet_kiem_id`) REFERENCES `SO_TIET_KIEM`(`so_tiet_kiem_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ls_taikhoan` FOREIGN KEY (`tai_khoan_thay_doi_id`) REFERENCES `TAI_KHOAN_DANG_NHAP`(`tai_khoan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 18. BẢNG YEU_CAU_TAT_TOAN (Quy trình Maker-Checker phê duyệt)
-- ====================================================================
DROP TABLE IF EXISTS `YEU_CAU_TAT_TOAN`;
CREATE TABLE `YEU_CAU_TAT_TOAN` (
    `yeu_cau_id` INT AUTO_INCREMENT,
    `chu_ky_id` INT NOT NULL,
    `tai_khoan_yeu_cau_id` INT NOT NULL,
    `nhan_vien_xu_ly_id` INT NULL,
    `giao_dich_id` INT NULL,
    `loai_tat_toan` VARCHAR(255) NOT NULL, -- DUNG_HAN, TRUOC_HAN
    `lai_du_kien` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tong_tien_du_kien` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `lai_suat_ap_dung` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `trang_thai` VARCHAR(255) DEFAULT 'CHO_DUYET', -- CHO_DUYET, DA_DUYET, TU_CHOI
    `ngay_yeu_cau` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_xac_nhan` DATETIME NULL,
    PRIMARY KEY (`yeu_cau_id`),
    CONSTRAINT `fk_yc_chuky` FOREIGN KEY (`chu_ky_id`) REFERENCES `CHU_KY_SO_TIET_KIEM`(`chu_ky_id`),
    CONSTRAINT `fk_yc_tkyeucau` FOREIGN KEY (`tai_khoan_yeu_cau_id`) REFERENCES `TAI_KHOAN_DANG_NHAP`(`tai_khoan_id`),
    CONSTRAINT `fk_yc_nvxuly` FOREIGN KEY (`nhan_vien_xu_ly_id`) REFERENCES `NHAN_VIEN`(`nhan_vien_id`),
    CONSTRAINT `fk_yc_giaodich` FOREIGN KEY (`giao_dich_id`) REFERENCES `GIAO_DICH_TIET_KIEM`(`giao_dich_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 19. BẢNG THONG_BAO (Nhắc hạn & Truyền thông khách hàng)
-- ====================================================================
DROP TABLE IF EXISTS `THONG_BAO`;
CREATE TABLE `THONG_BAO` (
    `thong_bao_id` INT AUTO_INCREMENT,
    `khach_hang_id` INT NOT NULL,
    `chu_ky_id` INT NULL,
    `loai_thong_bao` VARCHAR(255) NOT NULL, -- NHAC_DAO_HAN, BIEN_DONG_SO_DU, TAI_TUC_THANH_CONG
    `kenh_gui` VARCHAR(255) DEFAULT 'SMS', -- SMS, EMAIL, APP_PUSH
    `trang_thai_gui` VARCHAR(255) DEFAULT 'CHO_GUI', -- CHO_GUI, DA_GUI, THAT_BAI
    `noi_dung` TEXT NOT NULL,
    `so_lan_thu` INT DEFAULT 0,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_gui` DATETIME NULL,
    `thu_lai_sau` DATETIME NULL,
    PRIMARY KEY (`thong_bao_id`),
    CONSTRAINT `fk_tb_khachhang` FOREIGN KEY (`khach_hang_id`) REFERENCES `KHACH_HANG`(`khach_hang_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tb_chuky` FOREIGN KEY (`chu_ky_id`) REFERENCES `CHU_KY_SO_TIET_KIEM`(`chu_ky_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;


-- ====================================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA CHUẨN ĐỂ KIỂM THỬ)
-- ====================================================================

-- 1. Người dùng (Admin, Nhân viên & Khách hàng)
INSERT INTO `NGUOI_DUNG` (`nguoi_dung_id`, `ho_ten`, `email`, `so_dien_thoai`, `ngay_tao`) VALUES
(1, 'Hệ thống Quản trị (Admin)', 'admin@savingsbank.vn', '0901000001', '2026-01-01 08:00:00'),
(2, 'Nguyễn Văn A (Giao dịch viên)', 'teller01@savingsbank.vn', '0901000002', '2026-01-01 08:00:00'),
(3, 'Lê Thị B (Kiểm soát viên)', 'supervisor01@savingsbank.vn', '0901000003', '2026-01-01 08:00:00'),
(4, 'Trần Thị Mai', 'mai.tran@gmail.com', '0901234567', '2026-02-15 09:30:00'),
(5, 'Lê Hoàng Nam', 'nam.le@gmail.com', '0912345678', '2026-03-20 10:15:00'),
(6, 'Phạm Quốc Bảo', 'bao.pham@gmail.com', '0987654321', '2026-04-10 14:00:00');

-- 2. Nhân viên
INSERT INTO `NHAN_VIEN` (`nhan_vien_id`, `nguoi_dung_id`, `ma_nhan_vien`, `trang_thai`) VALUES
(1, 2, 'NV001_TELLER', 'DANG_LAM_VIEC'),
(2, 3, 'NV002_SUPERVISOR', 'DANG_LAM_VIEC');

-- 3. Khách hàng
INSERT INTO `KHACH_HANG` (`khach_hang_id`, `nguoi_dung_id`, `trang_thai`, `ngay_tao`) VALUES
(1, 4, 'HOAT_DONG', '2026-02-15 09:30:00'),
(2, 5, 'HOAT_DONG', '2026-03-20 10:15:00'),
(3, 6, 'HOAT_DONG', '2026-04-10 14:00:00');

-- 4. Hồ sơ khách hàng (CCCD, địa chỉ)
INSERT INTO `HO_SO_KHACH_HANG` (`ho_so_id`, `khach_hang_id`, `so_cccd`, `ngay_sinh`, `dia_chi`) VALUES
(1, 1, '079201004812', '1990-05-12', '123 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM'),
(2, 2, '079200003411', '1988-10-25', '456 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM'),
(3, 3, '079202008923', '1995-12-08', '789 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM');

-- 5. Tài khoản đăng nhập
INSERT INTO `TAI_KHOAN_DANG_NHAP` (`tai_khoan_id`, `nguoi_dung_id`, `ten_dang_nhap`, `mat_khau_bam`, `trang_thai`) VALUES
(1, 1, 'admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPt.gLzY6', 'HOAT_DONG'),
(2, 2, 'teller01', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPt.gLzY6', 'HOAT_DONG'),
(3, 3, 'supervisor01', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPt.gLzY6', 'HOAT_DONG'),
(4, 4, 'kh_mai', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPt.gLzY6', 'HOAT_DONG');

-- 6. Vai trò & Quyền truy cập (RBAC)
INSERT INTO `VAI_TRO` (`vai_tro_id`, `ten_vai_tro`, `mo_ta`) VALUES
(1, 'ADMIN', 'Quản trị viên toàn quyền hệ thống'),
(2, 'GIAO_DICH_VIEN', 'Nhân viên quầy mở sổ, lập phiếu gửi/rút tiền'),
(3, 'KIEM_SOAT_VIEN', 'Kiểm soát viên phê duyệt yêu cầu tất toán'),
(4, 'KHACH_HANG', 'Khách hàng tra cứu sổ cá nhân');

INSERT INTO `QUYEN_TRUY_CAP` (`quyen_id`, `ma_quyen`, `mo_ta`) VALUES
(1, 'SO_TIET_KIEM_MO', 'Quyền mở sổ tiết kiệm mới'),
(2, 'SO_TIET_KIEM_RUT', 'Quyền lập phiếu rút tiền/tất toán'),
(3, 'SO_TIET_KIEM_DUYET', 'Quyền phê duyệt tất toán tiền gửi'),
(4, 'BAO_CAO_XEM', 'Quyền xem báo cáo doanh số ngày và tháng'),
(5, 'CAU_HINH_LAI_SUAT', 'Quyền cập nhật biểu lãi suất và kỳ hạn');

INSERT INTO `TAI_KHOAN_VAI_TRO` (`tai_khoan_id`, `vai_tro_id`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

INSERT INTO `VAI_TRO_QUYEN` (`vai_tro_id`, `quyen_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 2), (2, 4),
(3, 3), (3, 4);

-- 7. Tài khoản thanh toán (CASA)
INSERT INTO `TAI_KHOAN_THANH_TOAN` (`tai_khoan_thanh_toan_id`, `khach_hang_id`, `so_tai_khoan`, `ma_ngan_hang`, `loai_tien`, `trang_thai`, `tai_khoan_mac_dinh`) VALUES
(1, 1, '1019283746', 'SAVINGS_BANK', 'VND', 'HOAT_DONG', TRUE),
(2, 2, '2028374651', 'SAVINGS_BANK', 'VND', 'HOAT_DONG', TRUE),
(3, 3, '3037465819', 'SAVINGS_BANK', 'VND', 'HOAT_DONG', TRUE);

-- 8. Sản phẩm tiết kiệm
INSERT INTO `SAN_PHAM_TIET_KIEM` (`san_pham_id`, `ten_san_pham`, `so_tien_toi_thieu`, `loai_tien`, `trang_thai`) VALUES
(1, 'Tiết kiệm Thông thường VND', 100000.00, 'VND', 'HOAT_DONG'),
(2, 'Tiết kiệm Tích lũy Tương lai', 500000.00, 'VND', 'HOAT_DONG');

-- 9. Kỳ hạn tiết kiệm
INSERT INTO `KY_HAN_TIET_KIEM` (`ky_han_id`, `san_pham_id`, `thoi_han`, `don_vi_thoi_han`, `loai_ky_han`, `trang_thai`) VALUES
(1, 1, 0, 'THANG', 'KHONG_KY_HAN', 'HOAT_DONG'),
(2, 1, 3, 'THANG', 'CO_KY_HAN', 'HOAT_DONG'),
(3, 1, 6, 'THANG', 'CO_KY_HAN', 'HOAT_DONG'),
(4, 1, 12, 'THANG', 'CO_KY_HAN', 'HOAT_DONG');

-- 10. Biểu lãi suất hiện hành
INSERT INTO `BIEU_LAI_SUAT` (`bieu_lai_suat_id`, `ky_han_id`, `lai_suat_nam`, `hieu_luc_tu`, `hieu_luc_den`) VALUES
(1, 1, 0.15, '2026-01-01', NULL),
(2, 2, 3.50, '2026-01-01', NULL),
(3, 3, 5.80, '2026-01-01', NULL),
(4, 4, 6.20, '2026-01-01', NULL);

-- 11. Sổ tiết kiệm mẫu
INSERT INTO `SO_TIET_KIEM` (`so_tiet_kiem_id`, `khach_hang_id`, `nhan_vien_mo_id`, `ma_so`, `ngay_mo`, `trang_thai`, `ngay_tao`) VALUES
(1, 3, 1, 'STK001090', '2026-08-01', 'DANG_HOAT_DONG', '2026-08-01 08:30:00'),
(2, 2, 1, 'STK001091', '2026-10-15', 'DANG_HOAT_DONG', '2026-10-15 09:15:00'),
(3, 1, 1, 'STK001092', '2026-11-01', 'DANG_HOAT_DONG', '2026-11-01 10:00:00');

-- 12. Chu kỳ sổ tiết kiệm
INSERT INTO `CHU_KY_SO_TIET_KIEM` (`chu_ky_id`, `so_tiet_kiem_id`, `ky_han_id`, `bieu_lai_suat_id`, `so_thu_tu_chu_ky`, `so_tien_goc`, `lai_suat_ap_dung`, `ngay_bat_dau`, `ngay_dao_han`, `chi_thi_dao_han`) VALUES
(1, 1, 2, 2, 1, 50000000.00, 3.50, '2026-08-01', '2026-11-01', 'TAI_TUC_GOC_VA_LAI'),
(2, 2, 1, 1, 1, 25000000.00, 0.15, '2026-10-15', NULL, 'KHONG_TAI_TUC'),
(3, 3, 3, 3, 1, 100000000.00, 5.80, '2026-11-01', '2027-05-01', 'TAI_TUC_GOC_VA_LAI');

-- 13. Giao dịch tiết kiệm ban đầu (Mở sổ)
INSERT INTO `GIAO_DICH_TIET_KIEM` (`giao_dich_id`, `chu_ky_id`, `tai_khoan_nguon_id`, `tai_khoan_nhan_id`, `nguoi_xu_ly_id`, `loai_giao_dich`, `ngay_giao_dich`, `tien_goc`, `tien_lai`, `lai_suat_ap_dung`, `kenh_giao_dich`, `trang_thai`) VALUES
(1, 1, 3, NULL, 2, 'MO_SO', '2026-08-01 08:30:00', 50000000.00, 0, 3.50, 'TAI_QUAY', 'THANH_CONG'),
(2, 2, 2, NULL, 2, 'MO_SO', '2026-10-15 09:15:00', 25000000.00, 0, 0.15, 'TAI_QUAY', 'THANH_CONG'),
(3, 3, 1, NULL, 2, 'MO_SO', '2026-11-01 10:00:00', 100000000.00, 0, 5.80, 'TAI_QUAY', 'THANH_CONG');

-- 14. Lịch sử trạng thái sổ (Audit log)
INSERT INTO `LICH_SU_TRANG_THAI_SO` (`lich_su_id`, `so_tiet_kiem_id`, `tai_khoan_thay_doi_id`, `trang_thai_cu`, `trang_thai_moi`, `ly_do`, `thoi_diem_thay_doi`) VALUES
(1, 1, 2, NULL, 'DANG_HOAT_DONG', 'Mở sổ tiết kiệm kỳ hạn 3 tháng', '2026-08-01 08:30:00'),
(2, 2, 2, NULL, 'DANG_HOAT_DONG', 'Mở sổ tiết kiệm không kỳ hạn', '2026-10-15 09:15:00'),
(3, 3, 2, NULL, 'DANG_HOAT_DONG', 'Mở sổ tiết kiệm kỳ hạn 6 tháng', '2026-11-01 10:00:00');

-- 15. Yêu cầu tất toán mẫu (Sổ STK001090 đến hạn hôm nay 01/11/2026)
INSERT INTO `YEU_CAU_TAT_TOAN` (`yeu_cau_id`, `chu_ky_id`, `tai_khoan_yeu_cau_id`, `nhan_vien_xu_ly_id`, `loai_tat_toan`, `lai_du_kien`, `tong_tien_du_kien`, `lai_suat_ap_dung`, `trang_thai`, `ngay_yeu_cau`) VALUES
(1, 1, 2, 1, 'DUNG_HAN', 437500.00, 50437500.00, 3.50, 'CHO_DUYET', '2026-11-01 10:30:00');

-- 16. Thông báo mẫu (Nhắc ngày đáo hạn gửi qua SMS)
INSERT INTO `THONG_BAO` (`thong_bao_id`, `khach_hang_id`, `chu_ky_id`, `loai_thong_bao`, `kenh_gui`, `trang_thai_gui`, `noi_dung`, `ngay_tao`, `ngay_gui`) VALUES
(1, 3, 1, 'NHAC_DAO_HAN', 'SMS', 'DA_GUI', 'SavingsBank thong bao: So tiet kiem STK001090 cua Quy khach se dao han vao ngay 01/11/2026. Tien goc: 50.000.000d, lai du kien: 437.500d.', '2026-10-30 08:00:00', '2026-10-30 08:05:00');
