/**
 * ====================================================================
 * BACKEND SERVER (Node.js & Express - Kiến trúc 3 tầng chuẩn Chương 6)
 * File: backend/server.js
 * ====================================================================
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { startScheduler } = require('./jobs/scheduler');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Security & Parser Middlewares
app.use(
    helmet({
        contentSecurityPolicy: false
    })
);
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || env.corsOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, true); // Cho phép linh hoạt khi dev local; siết chặt ở Production
        },
        credentials: true
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ giao diện tĩnh Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount REST API Routes
app.use('/api', apiRoutes);

// Xử lý route API không tồn tại & Global Error Handler
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
    app.listen(env.port, () => {
        console.log(`🚀 CoreSavings API đang chạy tại: http://localhost:${env.port}`);
        console.log(`🌐 Mở giao diện frontend tại: http://localhost:${env.port}/index.html`);
        console.log(`🩺 Kiểm tra Health & MySQL tại: http://localhost:${env.port}/api/health`);
        startScheduler();
    });
}

module.exports = app;
