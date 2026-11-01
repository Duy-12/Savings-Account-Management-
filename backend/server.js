/**
 * ====================================================================
 * BACKEND SERVER (Node.js & Express - Kết nối MySQL)
 * File: server.js
 * ====================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ giao diện tĩnh Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint kiểm tra trạng thái API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Core Banking Savings Management API is running.',
        timestamp: new Date().toISOString()
    });
});

/**
 * Gợi ý các Endpoints Core Banking:
 * - POST   /api/savings/open       : Mở sổ mới (kiểm tra tiền gửi tối thiểu >= 100k)
 * - POST   /api/savings/deposit    : Gửi thêm tiền (áp dụng cho sổ không kỳ hạn)
 * - POST   /api/savings/withdraw   : Rút tiền / Tất toán (tính lãi suất, kỳ hạn)
 * - POST   /api/savings/rollover   : Tái tục tự động (gốc + lãi sang kỳ hạn mới)
 * - GET    /api/savings/search     : Tra cứu sổ theo CMND / Mã sổ / Tên KH
 * - GET    /api/reports/daily      : Báo cáo doanh số ngày (thu/chi/chênh lệch)
 */

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🌐 Mở giao diện frontend tại: http://localhost:${PORT}/index.html`);
});
