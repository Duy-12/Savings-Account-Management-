-- ====================================================================
-- HỆ THỐNG QUẢN LÝ SỔ TIẾT KIỆM (SAVINGS ACCOUNT MANAGEMENT)
-- Cơ sở dữ liệu: MySQL
-- Đồ án môn học: Phân tích Thiết kế Hệ thống Thông tin (PTTKHDT)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `quan_ly_so_tiet_kiem` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quan_ly_so_tiet_kiem`;

-- 1. BẢNG THAM SỐ QUY ĐỊNH HỆ THỐNG
DROP TABLE IF EXISTS `THAM_SO`;
CREATE TABLE `THAM_SO` (
    `TenThamSo` VARCHAR(50) NOT NULL PRIMARY KEY,
    `GiaTri` DECIMAL(15, 2) NOT NULL,
    `GhiChu` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG LOẠI TIẾT KIỆM
DROP TABLE IF EXISTS `LOAI_TIET_KIEM`;
CREATE TABLE `LOAI_TIET_KIEM` (
    `MaLoaiTietKiem` VARCHAR(10) NOT NULL PRIMARY KEY,
    `TenLoaiTietKiem` VARCHAR(100) NOT NULL,
    `KyHanThang` INT NOT NULL DEFAULT 0, -- 0 = Không kỳ hạn, 3 = 3 tháng, 6 = 6 tháng
    `LaiSuat` DECIMAL(5, 2) NOT NULL,     -- Ví dụ: 0.15% (không kỳ hạn), 5.0% (3 tháng)
    `SoNgayGuiToiThieu` INT NOT NULL DEFAULT 15, -- Số ngày tối thiểu được phép rút
    `TrangThai` TINYINT(1) NOT NULL DEFAULT 1 -- 1: Đang áp dụng, 0: Ngừng áp dụng
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG KHÁCH HÀNG
DROP TABLE IF EXISTS `KHACH_HANG`;
CREATE TABLE `KHACH_HANG` (
    `MaKhachHang` INT AUTO_INCREMENT PRIMARY KEY,
    `HoTen` VARCHAR(150) NOT NULL,
    `CMND_CCCD` VARCHAR(20) NOT NULL UNIQUE,
    `DiaChi` VARCHAR(255) NULL,
    `SoDienThoai` VARCHAR(15) NULL,
    `NgayTao` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG SỔ TIẾT KIỆM
DROP TABLE IF EXISTS `SO_TIET_KIEM`;
CREATE TABLE `SO_TIET_KIEM` (
    `MaSoTietKiem` VARCHAR(20) NOT NULL PRIMARY KEY,
    `MaKhachHang` INT NOT NULL,
    `MaLoaiTietKiem` VARCHAR(10) NOT NULL,
    `SoTienGuiBanDau` DECIMAL(15, 2) NOT NULL,
    `SoDuHienTai` DECIMAL(15, 2) NOT NULL,
    `NgayMoSo` DATE NOT NULL,
    `NgayDaoHan` DATE NULL,
    `TrangThai` ENUM('DANG_HOAT_DONG', 'DA_DONG') NOT NULL DEFAULT 'DANG_HOAT_DONG',
    CONSTRAINT `fk_stk_khachhang` FOREIGN KEY (`MaKhachHang`) REFERENCES `KHACH_HANG`(`MaKhachHang`),
    CONSTRAINT `fk_stk_loaitk` FOREIGN KEY (`MaLoaiTietKiem`) REFERENCES `LOAI_TIET_KIEM`(`MaLoaiTietKiem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG PHIẾU GỬI TIỀN (Chỉ dành cho sổ không kỳ hạn)
DROP TABLE IF EXISTS `PHIEU_GUI_TIEN`;
CREATE TABLE `PHIEU_GUI_TIEN` (
    `MaPhieuGui` INT AUTO_INCREMENT PRIMARY KEY,
    `MaSoTietKiem` VARCHAR(20) NOT NULL,
    `NgayGui` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `SoTienGui` DECIMAL(15, 2) NOT NULL,
    `NguoiNop` VARCHAR(150) NOT NULL,
    CONSTRAINT `fk_pg_so` FOREIGN KEY (`MaSoTietKiem`) REFERENCES `SO_TIET_KIEM`(`MaSoTietKiem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG PHIẾU RÚT TIỀN
DROP TABLE IF EXISTS `PHIEU_RUT_TIEN`;
CREATE TABLE `PHIEU_RUT_TIEN` (
    `MaPhieuRut` INT AUTO_INCREMENT PRIMARY KEY,
    `MaSoTietKiem` VARCHAR(20) NOT NULL,
    `NgayRut` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `SoTienRut` DECIMAL(15, 2) NOT NULL,
    `TienLaiPhatSinh` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `NguoiRut` VARCHAR(150) NOT NULL,
    CONSTRAINT `fk_pr_so` FOREIGN KEY (`MaSoTietKiem`) REFERENCES `SO_TIET_KIEM`(`MaSoTietKiem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- ====================================================================

-- Quy định ban đầu
INSERT INTO `THAM_SO` (`TenThamSo`, `GiaTri`, `GhiChu`) VALUES
('SoTienGuiToiThieu', 100000.00, 'Số tiền gửi ban đầu tối thiểu khi mở sổ (VNĐ)'),
('SoNgayGuiToiThieuKhongKyHan', 15.00, 'Số ngày gửi tối thiểu trước khi được rút tiền đối với loại không kỳ hạn');

-- Loại tiết kiệm
INSERT INTO `LOAI_TIET_KIEM` (`MaLoaiTietKiem`, `TenLoaiTietKiem`, `KyHanThang`, `LaiSuat`, `SoNgayGuiToiThieu`, `TrangThai`) VALUES
('KKH', 'Không kỳ hạn', 0, 0.15, 15, 1),
('KH03', 'Kỳ hạn 3 tháng', 3, 3.50, 90, 1),
('KH06', 'Kỳ hạn 6 tháng', 6, 5.80, 180, 1);

-- Khách hàng mẫu
INSERT INTO `KHACH_HANG` (`MaKhachHang`, `HoTen`, `CMND_CCCD`, `DiaChi`, `SoDienThoai`) VALUES
(1, 'Trần Thị Mai', '079201004812', '123 Nguyễn Văn Cừ, Quận 5, TP.HCM', '0901234567'),
(2, 'Lê Hoàng Nam', '079200003411', '456 Lê Lợi, Quận 1, TP.HCM', '0912345678'),
(3, 'Phạm Quốc Bảo', '079202008923', '789 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', '0987654321');

-- Sổ tiết kiệm mẫu
INSERT INTO `SO_TIET_KIEM` (`MaSoTietKiem`, `MaKhachHang`, `MaLoaiTietKiem`, `SoTienGuiBanDau`, `SoDuHienTai`, `NgayMoSo`, `NgayDaoHan`, `TrangThai`) VALUES
('STK001090', 3, 'KH03', 100000000.00, 100000000.00, '2026-08-01', '2026-11-01', 'DANG_HOAT_DONG'),
('STK001091', 2, 'KKH', 15000000.00, 15000000.00, '2026-10-15', NULL, 'DANG_HOAT_DONG'),
('STK001092', 1, 'KH06', 50000000.00, 50000000.00, '2026-11-01', '2027-05-01', 'DANG_HOAT_DONG');
