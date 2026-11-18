/**
 * Hằng số & Enum nghiệp vụ Core Banking đồng bộ 100% với backend/database/schema.sql
 * File: backend/config/constants.js
 */

const ROLES = Object.freeze({
    ADMIN: 'ADMIN',
    TELLER: 'GIAO_DICH_VIEN',
    SUPERVISOR: 'KIEM_SOAT_VIEN',
    CUSTOMER: 'KHACH_HANG'
});

const PERMISSIONS = Object.freeze({
    OPEN_PASSBOOK: 'SO_TIET_KIEM_MO',
    WITHDRAW_PASSBOOK: 'SO_TIET_KIEM_RUT',
    APPROVE_SETTLEMENT: 'SO_TIET_KIEM_DUYET',
    VIEW_REPORT: 'BAO_CAO_XEM',
    CONFIG_RATE: 'CAU_HINH_LAI_SUAT'
});

const ACCOUNT_STATUS = Object.freeze({
    ACTIVE: 'HOAT_DONG',
    TEMP_LOCKED: 'KHOA_TAM_THOI',
    INACTIVE: 'NGUNG_HOAT_DONG'
});

const PASSBOOK_STATUS = Object.freeze({
    ACTIVE: 'DANG_HOAT_DONG',
    LOST: 'BAO_MAT',
    FROZEN: 'PHONG_TOA',
    SETTLED: 'DA_TAT_TOAN'
});

/**
 * State Machine chuyển đổi trạng thái hợp lệ cho FR-09
 */
const PASSBOOK_STATUS_TRANSITIONS = Object.freeze({
    [PASSBOOK_STATUS.ACTIVE]: [PASSBOOK_STATUS.FROZEN, PASSBOOK_STATUS.LOST],
    [PASSBOOK_STATUS.FROZEN]: [PASSBOOK_STATUS.ACTIVE],
    [PASSBOOK_STATUS.LOST]: [PASSBOOK_STATUS.ACTIVE],
    [PASSBOOK_STATUS.SETTLED]: []
});

const ROLLOVER_MODE = Object.freeze({
    PRINCIPAL_AND_INTEREST: 'TAI_TUC_GOC_VA_LAI',
    PRINCIPAL_ONLY: 'TAI_TUC_GOC_CHUYEN_LAI',
    NONE: 'KHONG_TAI_TUC'
});

const TX_TYPE = Object.freeze({
    OPEN: 'MO_SO',
    DEPOSIT: 'GUI_THEM_TIEN',
    WITHDRAW: 'RUT_TIEN_MAT',
    SETTLEMENT: 'TAT_TOAN',
    PERIODIC_INTEREST: 'TRA_LAI_DINH_KY'
});

const TX_CHANNEL = Object.freeze({
    COUNTER: 'TAI_QUAY',
    INTERNET_BANKING: 'INTERNET_BANKING',
    MOBILE_BANKING: 'MOBILE_BANKING'
});

const SETTLEMENT_TYPE = Object.freeze({
    ON_TIME: 'DUNG_HAN',
    EARLY: 'TRUOC_HAN'
});

const SETTLEMENT_STATUS = Object.freeze({
    PENDING: 'CHO_DUYET',
    APPROVED: 'DA_DUYET',
    REJECTED: 'TU_CHOI'
});

const NOTIFY_TYPE = Object.freeze({
    MATURITY_REMINDER: 'NHAC_DAO_HAN',
    BALANCE_CHANGE: 'BIEN_DONG_SO_DU',
    ROLLOVER_SUCCESS: 'TAI_TUC_THANH_CONG'
});

const NOTIFY_STATUS = Object.freeze({
    PENDING: 'CHO_GUI',
    SENT: 'DA_GUI',
    FAILED: 'THAT_BAI'
});

/**
 * Kiểm tra tài khoản có đang ở trạng thái khóa tạm thời hiệu lực hay không:
 * - Khóa thủ công bởi Admin: trang_thai === KHOA_TAM_THOI và khoa_den === null -> đang khóa
 * - Khóa tự động (EX-01): trang_thai === KHOA_TAM_THOI và khoa_den > now -> đang khóa
 */
function isAccountCurrentlyLocked(account, now = new Date()) {
    if (!account || account.trang_thai !== ACCOUNT_STATUS.TEMP_LOCKED) return false;
    if (!account.khoa_den) return true;
    return new Date(account.khoa_den) > now;
}

module.exports = {
    ROLES,
    PERMISSIONS,
    ACCOUNT_STATUS,
    PASSBOOK_STATUS,
    PASSBOOK_STATUS_TRANSITIONS,
    ROLLOVER_MODE,
    TX_TYPE,
    TX_CHANNEL,
    SETTLEMENT_TYPE,
    SETTLEMENT_STATUS,
    NOTIFY_TYPE,
    NOTIFY_STATUS,
    isAccountCurrentlyLocked
};
