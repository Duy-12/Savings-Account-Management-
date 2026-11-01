/**
 * Cấu hình kết nối cơ sở dữ liệu MySQL (Ví dụ mẫu)
 * Sao chép file này thành `db.config.js` và điền thông tin tài khoản MySQL của máy bạn.
 */

module.exports = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quan_ly_so_tiet_kiem',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
