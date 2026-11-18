/**
 * API Client Nhóm 1: Đăng nhập, Đăng ký online & Hồ sơ cá nhân (FR-01, EX-01, FR-02)
 * File: frontend/js/api/auth.api.js
 */
import { apiRequest, setToken } from './client.js';

export async function login(tenDangNhap, matKhau) {
    const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ tenDangNhap, matKhau })
    });
    if (res.data && res.data.token) {
        setToken(res.data.token);
    }
    return res.data;
}

export async function register(payload) {
    const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function getMe() {
    const res = await apiRequest('/auth/me');
    return res.data;
}

export function logout() {
    setToken(null);
}

export async function getProfile() {
    const res = await apiRequest('/profile');
    return res.data;
}

export async function updateProfile(payload) {
    const res = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
    return res.data;
}
