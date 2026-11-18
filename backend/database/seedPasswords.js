/**
 * Script cập nhật bcrypt hash chuẩn cho 4 tài khoản seed trong schema.sql
 * Chạy lệnh: npm run seed (trong thư mục backend/)
 * File: backend/database/seedPasswords.js
 */
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { pool } = require('../config/db');

const SEED_PASSWORDS = [
    { tenDangNhap: 'admin', plainPassword: 'Admin@123' },
    { tenDangNhap: 'teller01', plainPassword: 'Nhanvien@123' },
    { tenDangNhap: 'supervisor01', plainPassword: 'Quanly@123' },
    { tenDangNhap: 'kh_mai', plainPassword: 'Khachhang@123' }
];

async function runSeedPasswords() {
    console.log('🔐 Đang cập nhật bcrypt hash cho tài khoản mẫu trong MySQL...');
    try {
        for (const item of SEED_PASSWORDS) {
            const hash = await bcrypt.hash(item.plainPassword, env.security.bcryptSaltRounds);
            const [result] = await pool.execute(
                `UPDATE TAI_KHOAN_DANG_NHAP
                 SET mat_khau_bam = ?, trang_thai = 'HOAT_DONG', so_lan_dang_nhap_sai = 0, khoa_den = NULL
                 WHERE ten_dang_nhap = ?`,
                [hash, item.tenDangNhap]
            );
            if (result.affectedRows > 0) {
                console.log(`  ✅ Đã cập nhật mật khẩu cho '${item.tenDangNhap}'`);
            } else {
                console.log(`  ⚠️  Không tìm thấy tài khoản '${item.tenDangNhap}' (hãy kiểm tra đã import schema.sql chưa)`);
            }
        }
        console.log('🎉 Hoàn tất seed mật khẩu!');
    } catch (error) {
        console.error('❌ Lỗi khi seed mật khẩu:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runSeedPasswords();
