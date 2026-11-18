/**
 * Lớp AppError chuẩn hóa và Global Error Handler cho Express
 * File: backend/middlewares/error.middleware.js
 */
const env = require('../config/env');

class AppError extends Error {
    /**
     * @param {number} statusCode
     * @param {string} errorCode
     * @param {string} message
     * @param {any} [details]
     */
    constructor(statusCode, errorCode, message, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
    }
}

/**
 * Wrapper cho async route/controller để không cần try/catch lặp lại
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handler cho route không tồn tại (chỉ áp dụng cho /api/*)
 */
function notFoundHandler(req, res, next) {
    next(new AppError(404, 'NOT_FOUND', `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`));
}

/**
 * Global Error Handling Middleware (trả về JSON envelope thống nhất)
 */
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            errorCode: err.errorCode,
            message: err.message,
            details: err.details
        });
    }

    // Lỗi trùng khóa UNIQUE từ MySQL
    if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            errorCode: 'DUPLICATE_ENTRY',
            message: 'Dữ liệu đã tồn tại trong hệ thống.',
            details: env.nodeEnv === 'development' ? err.sqlMessage : null
        });
    }

    // Lỗi JWT
    if (err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
        return res.status(401).json({
            success: false,
            errorCode: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
            message: err.name === 'TokenExpiredError' ? 'Phiên đăng nhập đã hết hạn.' : 'Token xác thực không hợp lệ.',
            details: null
        });
    }

    console.error('[UNHANDLED_ERROR]', err);
    return res.status(500).json({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
        details: env.nodeEnv === 'development' ? err.message : null
    });
}

module.exports = {
    AppError,
    asyncHandler,
    notFoundHandler,
    errorHandler
};
