/**
 * Fetch Wrapper dùng chung cho toàn bộ Frontend (đính kèm JWT, xử lý lỗi chuẩn)
 * File: frontend/js/api/client.js
 */

const API_BASE =
    window.location.port && window.location.port !== '3000'
        ? 'http://localhost:3000/api'
        : '/api';

const TOKEN_KEY = 'cs_token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Gửi HTTP Request tới Backend REST API
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function apiRequest(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401 && !path.startsWith('/auth/login')) {
        setToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    if (!response.ok || payload.success === false) {
        const err = new Error(payload.message || `Lỗi kết nối máy chủ (${response.status})`);
        err.statusCode = response.status;
        err.errorCode = payload.errorCode || 'REQUEST_FAILED';
        err.details = payload.details || null;
        throw err;
    }

    return payload;
}
