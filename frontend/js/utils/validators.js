/**
 * Kiểm tra định dạng cơ bản phía Client (chỉ phục vụ UX; Backend luôn xác minh lại)
 * File: frontend/js/utils/validators.js
 */

export const isValidCccd = (v) => /^[0-9]{9,12}$/.test(String(v || '').trim());
export const isValidPhone = (v) => /^0[0-9]{9,10}$/.test(String(v || '').trim());
export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
