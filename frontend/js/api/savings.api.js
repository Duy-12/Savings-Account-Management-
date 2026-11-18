/**
 * API Client Nhóm 2 & 3: Giao dịch tiết kiệm, Tra cứu, Tính lãi, Tất toán, Trạng thái sổ
 * File: frontend/js/api/savings.api.js
 */
import { apiRequest } from './client.js';

export async function getPaymentAccounts() {
    const res = await apiRequest('/savings/payment-accounts');
    return res.data || [];
}

export async function openOnline(payload) {
    const res = await apiRequest('/savings/open-online', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function openCounter(payload) {
    const res = await apiRequest('/savings/open-counter', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function listPassbooks({ q = '', status = '' } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const qs = params.toString();
    const res = await apiRequest(`/savings${qs ? `?${qs}` : ''}`);
    return res.data || [];
}

export async function getPassbookDetail(maSo) {
    const res = await apiRequest(`/savings/${encodeURIComponent(maSo)}`);
    return res.data;
}

export async function calculateInterest(payload) {
    const res = await apiRequest('/interest/calculate', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function previewSettlement(maSo, ngayTatToan) {
    const res = await apiRequest(`/savings/${encodeURIComponent(maSo)}/settlement-preview`, {
        method: 'POST',
        body: JSON.stringify({ ngayTatToan })
    });
    return res.data;
}

export async function confirmSettlement(maSo, payload) {
    const res = await apiRequest(`/savings/${encodeURIComponent(maSo)}/settlement-confirm`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return res.data;
}

export async function updatePassbookStatus(maSo, payload) {
    const res = await apiRequest(`/savings/${encodeURIComponent(maSo)}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return res.data;
}
