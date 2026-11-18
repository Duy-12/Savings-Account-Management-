/**
 * Đọc và chuẩn hóa biến môi trường cho Backend CoreSavings
 * File: backend/config/env.js
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const corsOriginsRaw = process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:5500';

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
    corsOrigins: corsOriginsRaw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'quan_ly_so_tiet_kiem',
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'dev_coresavings_super_secret_change_me_in_production_2026',
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    },

    security: {
        bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
        maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockDurationMinutes: Number(process.env.LOCK_DURATION_MINUTES) || 15
    },

    notify: {
        mode: process.env.NOTIFY_MODE || 'mock',
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: Number(process.env.SMTP_PORT) || 587,
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || '',
        smtpFrom: process.env.SMTP_FROM || '"CoreSavings Bank" <no-reply@savingsbank.vn>'
    },

    cron: {
        enabled: String(process.env.ENABLE_CRON_JOBS || 'true').toLowerCase() === 'true',
        maturitySchedule: process.env.CRON_MATURITY_SCHEDULE || '0 8 * * *',
        rolloverSchedule: process.env.CRON_ROLLOVER_SCHEDULE || '55 23 * * *'
    }
};

module.exports = env;
