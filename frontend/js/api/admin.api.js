/**
 * API Client Nhóm 1 & 4: Tài khoản (FR-11), Lãi suất (FR-12), Báo cáo (FR-10), Thông báo & Tái tục (FR-13, FR-14)
 * File: frontend/js/api/admin.api.js
 */
import { apiRequest } from './client.js';

export async function listRates() {
    const res = await apiRequest('/rates');
    return res.data || [];
}

export async function createRate(payload) {
    const res = await apiRequest('/rates', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function updateRate(kyHanId, payload) {
    const res = await apiRequest(`/rates/${encodeURIComponent(kyHanId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function listAccounts() {
    const res = await apiRequest('/accounts');
    return res.data || [];
}

export async function createAccount(payload) {
    const res = await apiRequest('/accounts', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function updateAccount(taiKhoanId, payload) {
    const res = await apiRequest(`/accounts/${encodeURIComponent(taiKhoanId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function getReports({ type = '', status = '', from = '', to = '' } = {}) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    const res = await apiRequest(`/reports${qs ? `?${qs}` : ''}`);
    return res.data;
}

export async function listNotifications() {
    const res = await apiRequest('/notifications');
    return res.data || [];
}

export async function triggerMaturityScan() {
    const res = await apiRequest('/jobs/maturity-scan', { method: 'POST' });
    return res.data;
}

export async function triggerRollover() {
    const res = await apiRequest('/jobs/rollover-run', { method: 'POST' });
    return res.data;
}
