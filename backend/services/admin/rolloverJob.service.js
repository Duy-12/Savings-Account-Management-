/**
 * Tầng BLL (:DieuKhienTaiTuc) — Component QuanTriVaTuDongHoa (FR-14 Tái tục sổ tự động)
 * File: backend/services/admin/rolloverJob.service.js
 */
const { withTransaction } = require('../../config/db');
const { ROLLOVER_MODE, NOTIFY_TYPE } = require('../../config/constants');
const soTietKiemRepo = require('../../repositories/soTietKiem.repo');
const laiSuatRepo = require('../../repositories/laiSuat.repo');
const taiKhoanRepo = require('../../repositories/taiKhoan.repo');
const interestService = require('../transaction/interest.service');
const notificationService = require('./notification.service');

/**
 * Thực thi quét và tái tục các sổ có kỳ hạn đến ngày đáo hạn
 */
async function runAutoRollover(executorTaiKhoanId = 1) {
    const notificationsQueue = [];

    const summary = await withTransaction(async (conn) => {
        const duePassbooks = await soTietKiemRepo.locSoToiHanHomNay(conn);
        let rolledOverCount = 0;
        let skippedCount = 0;
        const details = [];

        for (const item of duePassbooks) {
            if (item.chi_thi_dao_han === ROLLOVER_MODE.NONE) {
                skippedCount += 1;
                details.push({
                    maSo: item.ma_so,
                    action: 'SKIPPED',
                    reason: 'Chỉ thị KHÔNG TÁI TỤC — chờ xử lý thủ công'
                });
                continue;
            }

            const days = Math.max(0, interestService.computeDaysBetween(item.ngay_bat_dau, item.ngay_dao_han));
            const tienGocCu = Number(item.so_tien_goc);
            const tienLaiKyCu = interestService.calculateSimpleInterest(
                tienGocCu,
                Number(item.lai_suat_ap_dung),
                days
            );

            const currentTermRate = await laiSuatRepo.layThongTinKyHanVaLaiSuat(item.ky_han_id, conn);
            const bieuLaiSuatMoiId = currentTermRate?.bieu_lai_suat_id || item.bieu_lai_suat_id;
            const laiSuatMoi = Number(currentTermRate?.lai_suat_nam ?? item.lai_suat_ap_dung);

            let soTienGocMoi = tienGocCu + tienLaiKyCu;
            let taiKhoanNhanLaiId = null;

            if (item.chi_thi_dao_han === ROLLOVER_MODE.PRINCIPAL_ONLY && tienLaiKyCu > 0) {
                soTienGocMoi = tienGocCu;
                const defaultAccount = await taiKhoanRepo.layTaiKhoanThanhToanMacDinhVaKhoa(item.khach_hang_id, conn);
                if (defaultAccount) {
                    await taiKhoanRepo.congTienVaoTaiKhoan(defaultAccount.tai_khoan_thanh_toan_id, tienLaiKyCu, conn);
                    taiKhoanNhanLaiId = defaultAccount.tai_khoan_thanh_toan_id;
                }
            }

            const ngayBatDauMoi = item.ngay_dao_han;
            const ngayDaoHanMoi = interestService.calculateMaturityDate(
                ngayBatDauMoi,
                item.thoi_han,
                item.don_vi_thoi_han
            );

            const { chuKyMoiId } = await soTietKiemRepo.dongChuKyCuVaMoChuKyMoi(
                {
                    soTietKiemId: item.so_tiet_kiem_id,
                    chuKyCuId: item.chu_ky_id,
                    ngayKetThucCu: item.ngay_dao_han,
                    kyHanId: item.ky_han_id,
                    bieuLaiSuatId: bieuLaiSuatMoiId,
                    soThuTuChuKyMoi: Number(item.so_thu_tu_chu_ky) + 1,
                    soTienGocMoi,
                    laiSuatApDung: laiSuatMoi,
                    ngayBatDauMoi,
                    ngayDaoHanMoi,
                    chiThiDaoHan: item.chi_thi_dao_han,
                    tienLaiKyCu,
                    taiKhoanNhanLaiId,
                    nguoiXuLyId: executorTaiKhoanId
                },
                conn
            );

            rolledOverCount += 1;
            details.push({
                maSo: item.ma_so,
                action: 'ROLLED_OVER',
                chuKyMoi: Number(item.so_thu_tu_chu_ky) + 1,
                tienLaiKyCu,
                soTienGocMoi,
                ngayDaoHanMoi
            });

            notificationsQueue.push({
                khachHangId: item.khach_hang_id,
                chuKyId: chuKyMoiId,
                maSo: item.ma_so,
                soTienGocMoi,
                ngayDaoHanMoi
            });
        }

        return {
            dueCount: duePassbooks.length,
            rolledOverCount,
            skippedCount,
            details
        };
    });

    // Gửi thông báo tái tục thành công ngoài Transaction
    for (const n of notificationsQueue) {
        try {
            const formatted = new Intl.NumberFormat('vi-VN').format(n.soTienGocMoi);
            await notificationService.dispatchNotification({
                khachHangId: n.khachHangId,
                chuKyId: n.chuKyId,
                loaiThongBao: NOTIFY_TYPE.ROLLOVER_SUCCESS,
                kenhGui: 'SMS',
                noiDung: `CoreSavings: So ${n.maSo} da tai tuc thanh cong. Goc ky moi: ${formatted}d, dao han: ${n.ngayDaoHanMoi}.`
            });
        } catch (err) {
            console.error('[ROLLOVER_NOTIFY_WARN]', err.message);
        }
    }

    return summary;
}

module.exports = {
    runAutoRollover
};
