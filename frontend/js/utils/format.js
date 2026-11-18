/**
 * Định dạng tiền tệ, ngày tháng, nhãn trạng thái & xuất CSV
 * File: frontend/js/utils/format.js
 */
import { escapeHtml } from './ui.js';

export const roleNames = {
    ADMIN: 'Quản trị viên',
    GIAO_DICH_VIEN: 'Nhân viên giao dịch',
    KIEM_SOAT_VIEN: 'Quản lý / Kiểm soát viên',
    KHACH_HANG: 'Khách hàng'
};

export const STATUS_LABELS = {
    DANG_HOAT_DONG: 'Đang hoạt động',
    PHONG_TOA: 'Phong tỏa',
    BAO_MAT: 'Báo mất',
    DA_TAT_TOAN: 'Đã tất toán',
    HOAT_DONG: 'Hoạt động',
    KHOA_TAM_THOI: 'Khóa tạm thời',
    NGUNG_HOAT_DONG: 'Ngừng hoạt động',
    DA_GUI: 'Đã gửi',
    CHO_GUI: 'Chờ gửi',
    THAT_BAI: 'Thất bại'
};

export const ROLLOVER_LABELS = {
    TAI_TUC_GOC_VA_LAI: 'Tái tục gốc và lãi',
    TAI_TUC_GOC_CHUYEN_LAI: 'Tái tục gốc, chuyển lãi',
    KHONG_TAI_TUC: 'Không tái tục'
};

export function money(n) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(Number(n) || 0);
}

export function today() {
    return new Date().toISOString().slice(0, 10);
}

export function fmtDate(d) {
    if (!d) return '—';
    const iso = String(d).slice(0, 10);
    const dt = new Date(`${iso}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('vi-VN');
}

export function termLabel(thoiHan, donVi = 'THANG', loaiKyHan = '') {
    if (loaiKyHan === 'KHONG_KY_HAN' || Number(thoiHan) === 0) return 'Không kỳ hạn';
    const unitMap = { NGAY: 'ngày', THANG: 'tháng', NAM: 'năm' };
    return `${thoiHan} ${unitMap[donVi] || 'tháng'}`;
}

export function statusLabel(code) {
    return STATUS_LABELS[code] || code || '—';
}

export function rolloverLabel(code) {
    return ROLLOVER_LABELS[code] || code || '—';
}

export function statusBadge(code) {
    const label = statusLabel(code);
    let tone = 'blue';
    if (['DANG_HOAT_DONG', 'HOAT_DONG', 'DA_GUI', 'THANH_CONG'].includes(code)) {
        tone = 'green';
    } else if (['BAO_MAT', 'CHO_GUI', 'CHO_DUYET'].includes(code)) {
        tone = 'amber';
    } else if (['DA_TAT_TOAN', 'PHONG_TOA', 'KHOA_TAM_THOI', 'NGUNG_HOAT_DONG', 'THAT_BAI'].includes(code)) {
        tone = 'red';
    }
    return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

export function downloadCSV(filename, rows) {
    const csv =
        '\ufeff' +
        rows
            .map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))
            .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}
