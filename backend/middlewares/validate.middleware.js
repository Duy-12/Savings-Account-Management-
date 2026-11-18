/**
 * Middleware kiểm tra định dạng dữ liệu đầu vào tại cửa ngõ API
 * File: backend/middlewares/validate.middleware.js
 */
const { AppError } = require('./error.middleware');

const REGEX = {
    CCCD: /^[0-9]{9,12}$/,
    PHONE: /^0[0-9]{9,10}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    DATE: /^\d{4}-\d{2}-\d{2}$/
};

/**
 * Kiểm tra danh sách trường bắt buộc trong req.body
 * @param {string[]} fields
 */
function requireBodyFields(fields) {
    return (req, res, next) => {
        const missing = fields.filter((field) => {
            const val = req.body ? req.body[field] : undefined;
            return val === undefined || val === null || String(val).trim() === '';
        });

        if (missing.length > 0) {
            return next(
                new AppError(
                    400,
                    'VALIDATION_ERROR',
                    `Thiếu dữ liệu bắt buộc: ${missing.join(', ')}`,
                    { missing }
                )
            );
        }
        return next();
    };
}

/**
 * Chạy mảng validator tùy chỉnh trên req.body
 * @param {(body: any) => string[]} checkFn Trả về mảng thông báo lỗi nếu có
 */
function validateBody(checkFn) {
    return (req, res, next) => {
        const errors = checkFn(req.body || {}) || [];
        if (errors.length > 0) {
            return next(new AppError(400, 'VALIDATION_ERROR', errors[0], { errors }));
        }
        return next();
    };
}

module.exports = {
    REGEX,
    requireBodyFields,
    validateBody
};
