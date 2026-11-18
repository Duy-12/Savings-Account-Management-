/**
 * Tầng BLL (:DieuKhienDaoHan) — Component QuanTriVaTuDongHoa (FR-13 Gửi thông báo đáo hạn)
 * File: backend/services/admin/maturityJob.service.js
 */
const { NOTIFY_STATUS, NOTIFY_TYPE } = require('../../config/constants');
const soTietKiemRepo = require('../../repositories/soTietKiem.repo');
const interestService = require('../transaction/interest.service');
const notificationService = require('./notification.service');

async function runMaturityReminderScan(daysAhead = 3) {
    const candidates = await soTietKiemRepo.locSoSapDaoHan(daysAhead);
    let sentCount = 0;
    let failedCount = 0;
    const details = [];

    for (const item of candidates) {
        const days = Math.max(0, interestService.computeDaysBetween(item.ngay_bat_dau, item.ngay_dao_han));
        const expectedInterest = interestService.calculateSimpleInterest(
            Number(item.so_tien_goc),
            Number(item.lai_suat_ap_dung),
            days
        );
        const formattedPrincipal = new Intl.NumberFormat('vi-VN').format(Number(item.so_tien_goc));
        const formattedInterest = new Intl.NumberFormat('vi-VN').format(expectedInterest);

        const noiDung =
            `CoreSavings thong bao: So tiet kiem ${item.ma_so} cua Quy khach se dao han vao ngay ${item.ngay_dao_han}. ` +
            `Tien goc: ${formattedPrincipal}d, lai du kien: ${formattedInterest}d.`;

        const res = await notificationService.dispatchNotification({
            khachHangId: item.khach_hang_id,
            chuKyId: item.chu_ky_id,
            loaiThongBao: NOTIFY_TYPE.MATURITY_REMINDER,
            kenhGui: 'SMS',
            noiDung,
            recipient: item.so_dien_thoai || item.email
        });

        if (res.status === NOTIFY_STATUS.SENT) sentCount += 1;
        else failedCount += 1;

        details.push({
            maSo: item.ma_so,
            ngayDaoHan: item.ngay_dao_han,
            status: res.status
        });
    }

    return {
        scannedCount: candidates.length,
        sentCount,
        failedCount,
        details
    };
}

module.exports = {
    runMaturityReminderScan
};
