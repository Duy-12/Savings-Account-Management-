/**
 * Router tổng hợp tất cả API endpoints dưới /api
 * File: backend/routes/index.js
 */
const express = require('express');
const { testConnection } = require('../config/db');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');

const router = express.Router();

// Endpoint kiểm tra sức khỏe Server & kết nối MySQL
router.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        success: true,
        message: 'CoreSavings API Server is running.',
        data: {
            status: 'OK',
            dbConnected,
            timestamp: new Date().toISOString()
        }
    });
});

// Chặng 1: Auth & Profile
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

// Các chặng tiếp theo (TV2 + Bạn sẽ mount tại đây):
// router.use('/savings', savingsRoutes);
// router.use('/interest', interestRoutes);
// router.use('/customers', customerRoutes);
// router.use('/', adminRoutes); // /accounts, /rates, /reports, /notifications, /jobs

module.exports = router;
