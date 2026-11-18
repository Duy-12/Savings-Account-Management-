/**
 * Middleware phân quyền theo Vai trò (VAI_TRO) & Quyền hạn (QUYEN_TRUY_CAP)
 * File: backend/middlewares/rbac.middleware.js
 */
const { AppError } = require('./error.middleware');

/**
 * Kiểm tra người dùng có ít nhất 1 trong các vai trò được phép
 * @param {...string} allowedRoles
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError(401, 'UNAUTHORIZED', 'Chưa xác thực người dùng.'));
        }
        const userRoles = req.user.roles || [];
        const hasRole = allowedRoles.some((role) => userRoles.includes(role));
        if (!hasRole) {
            return next(
                new AppError(403, 'FORBIDDEN', 'Bạn không có vai trò phù hợp để thực hiện thao tác này.')
            );
        }
        return next();
    };
}

/**
 * Kiểm tra người dùng có đủ quyền truy cập từ bảng QUYEN_TRUY_CAP
 * @param {...string} requiredPermissions
 */
function authorizePermissions(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError(401, 'UNAUTHORIZED', 'Chưa xác thực người dùng.'));
        }
        const userPerms = req.user.permissions || [];
        const hasAll = requiredPermissions.every((perm) => userPerms.includes(perm));
        if (!hasAll) {
            return next(
                new AppError(403, 'FORBIDDEN', 'Tài khoản thiếu quyền nghiệp vụ theo quy định RBAC.')
            );
        }
        return next();
    };
}

module.exports = {
    authorizeRoles,
    authorizePermissions
};
