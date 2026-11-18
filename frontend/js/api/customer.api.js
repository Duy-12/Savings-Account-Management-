/**
 * API Client Nhóm 3: Quản lý hồ sơ khách hàng (FR-08)
 * File: frontend/js/api/customer.api.js
 */
import { apiRequest } from './client.js';

export async function listCustomers({ cccd = '', q = '' } = {}) {
    const params = new URLSearchParams();
    if (cccd) params.set('cccd', cccd);
    if (q) params.set('q', q);
    const qs = params.toString();
    const res = await apiRequest(`/customers${qs ? `?${qs}` : ''}`);
    return res.data || [];
}

export async function createCustomer(payload) {
    const res = await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function updateCustomer(khachHangId, payload) {
    const res = await apiRequest(`/customers/${encodeURIComponent(khachHangId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
    return res.data;
}
