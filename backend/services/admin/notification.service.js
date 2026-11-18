/**
 * Tầng BLL (:DieuKhienThongBao) — Component QuanTriVaTuDongHoa (EX-02)
 * File: backend/services/admin/notification.service.js
 */
const env = require('../../config/env');
const { NOTIFY_STATUS, NOTIFY_TYPE } = require('../../config/constants');
const heThongRepo = require('../../repositories/heThong.repo');

/**
 * Gửi thông báo (hỗ trợ mock mode & fallback hàng đợi thử lại khi lỗi mạng)
 */
async function dispatchNotification({ khachHangId, chuKyId, loaiThongBao, kenhGui = 'SMS', noiDung, recipient }) {
    const thongBaoId = await heThongRepo.luuThongBao({
        khachHangId,
        chuKyId,
        loaiThongBao,
        kenhGui,
        noiDung
    });

    try {
        if (env.notify.mode === 'smtp' && !env.notify.smtpUser) {
            throw new Error('SMTP credentials not configured');
        }
        // Mock mode hoặc gửi thành công
        if (env.nodeEnv !== 'test') {
            console.log(`[NOTIFY:${kenhGui}] -> ${recipient || khachHangId}: ${noiDung}`);
        }
        await heThongRepo.capNhatTrangThaiThongBao(thongBaoId, {
            trangThaiGui: NOTIFY_STATUS.SENT,
            thuLaiSau: null
        });
        return { thongBaoId, status: NOTIFY_STATUS.SENT };
    } catch (err) {
        const retryAt = new Date(Date.now() + 15 * 60 * 1000);
        await heThongRepo.capNhatTrangThaiThongBao(thongBaoId, {
            trangThaiGui: NOTIFY_STATUS.FAILED,
            thuLaiSau: retryAt
        });
        return { thongBaoId, status: NOTIFY_STATUS.FAILED, error: err.message };
    }
}

async function sendOpenPassbookConfirmation({ khachHangId, chuKyId, maSo, soTienGoc, kenhGui = 'EMAIL', recipient }) {
    const formattedMoney = new Intl.NumberFormat('vi-VN').format(Number(soTienGoc));
    const noiDung = `CoreSavings xac nhan: Quy khach da mo so tiet kiem ${maSo} voi so tien ${formattedMoney} VND thanh cong.`;
    return dispatchNotification({
        khachHangId,
        chuKyId,
        loaiThongBao: NOTIFY_TYPE.BALANCE_CHANGE,
        kenhGui,
        noiDung,
        recipient
    });
}

async function listNotifications(currentUser) {
    const isCustomer = currentUser.roles && currentUser.roles.length === 1 && currentUser.roles[0] === 'KHACH_HANG';
    return heThongRepo.layLichSuThongBao({
        khachHangId: isCustomer ? currentUser.khachHangId : null
    });
}

module.exports = {
    dispatchNotification,
    sendOpenPassbookConfirmation,
    listNotifications
};
