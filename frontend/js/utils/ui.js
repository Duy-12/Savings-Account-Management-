/**
 * Tiện ích DOM, Toast & Chống double-submit
 * File: frontend/js/utils/ui.js
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function toast(message, type = 'success') {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    root.append(el);
    setTimeout(() => el.remove(), 3500);
}

/**
 * Chạy thao tác async kèm trạng thái loading cho nút bấm (tránh bấm đúp giao dịch)
 */
export async function withButtonLoading(button, loadingText, asyncFn) {
    if (!button) return asyncFn();
    const originalText = button.textContent;
    button.disabled = true;
    if (loadingText) button.textContent = loadingText;
    try {
        return await asyncFn();
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}
