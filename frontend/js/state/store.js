/**
 * Frontend State Store (lưu phiên người dùng từ JWT, không chứa mật khẩu demo)
 * File: frontend/js/state/store.js
 */
import { getToken, setToken } from '../api/client.js';
import { getMe } from '../api/auth.api.js';

export const store = {
    user: null,
    role: null,
    page: 'dashboard',
    paymentAccounts: [],
    rates: []
};

export function setAuthSession(authData) {
    if (!authData || !authData.user) {
        clearAuthSession();
        return;
    }
    if (authData.token) {
        setToken(authData.token);
    }
    store.user = authData.user;
    store.role = (authData.user.roles && authData.user.roles[0]) || 'KHACH_HANG';
    store.paymentAccounts = authData.user.paymentAccounts || [];
}

export function clearAuthSession() {
    setToken(null);
    store.user = null;
    store.role = null;
    store.page = 'dashboard';
    store.paymentAccounts = [];
}

/**
 * Khôi phục phiên đăng nhập khi F5 reload trang bằng JWT hiện có
 */
export async function restoreSession() {
    const token = getToken();
    if (!token) return null;
    try {
        const user = await getMe();
        setAuthSession({ user });
        return user;
    } catch (error) {
        clearAuthSession();
        return null;
    }
}
