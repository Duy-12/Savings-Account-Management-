/**
 * Tầng BLL (:DieuKhienGiaoDich) — Component GiaoDichTietKiem (FR-03 Mở online, FR-04 Mở tại quầy)
 * File: backend/services/transaction/savingsTx.service.js
 */
const { withTransaction } = require('../../config/db');
const { ROLLOVER_MODE, TX_CHANNEL } = require('../../config/constants');
const { AppError } = require('../../middlewares/error.middleware');
const laiSuatRepo = require('../../repositories/laiSuat.repo');
const taiKhoanRepo = require('../../repositories/taiKhoan.repo');
const khachHangRepo = require('../../repositories/khachHang.repo');
const soTietKiemRepo = require('../../repositories/soTietKiem.repo');
const interestService = require('./interest.service');
const notificationService = require('../admin/notification.service');

const VALID_ROLLOVER_MODES = new Set(Object.values(ROLLOVER_MODE));

function generatePassbookCode() {
    const suffix = String(Date.now()).slice(-6);
    const rand = Math.floor(10 + Math.random() * 90);
    return `STK${suffix}${rand}`;
}

function resolveRolloverMode(chiThiDaoHan, loaiKyHan) {
    if (loaiKyHan === 'KHONG_KY_HAN') {
        return ROLLOVER_MODE.NONE;
    }
    const mode = chiThiDaoHan || ROLLOVER_MODE.PRINCIPAL_AND_INTEREST;
    if (!VALID_ROLLOVER_MODES.has(mode)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Chỉ thị đáo hạn không hợp lệ.');
    }
    return mode;
}

async function validateProductAndAmount(kyHanId, soTienGui) {
    const amount = Number(soTienGui);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Số tiền gửi phải lớn hơn 0.');
    }

    const termInfo = await laiSuatRepo.layThongTinKyHanVaLaiSuat(Number(kyHanId));
    if (!termInfo || termInfo.trang_thai_ky_han !== 'HOAT_DONG' || termInfo.bieu_lai_suat_id === null) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy kỳ hạn hoặc biểu lãi suất đang hiệu lực.');
    }

    const minAmount = Number(termInfo.so_tien_toi_thieu || 100000);
    if (amount < minAmount) {
        throw new AppError(
            400,
            'BELOW_MIN_AMOUNT',
            `Số tiền gửi tối thiểu cho sản phẩm này là ${new Intl.NumberFormat('vi-VN').format(minAmount)} VNĐ.`
        );
    }

    return { termInfo, amount };
}

/**
 * FR-03: Mở sổ tiết kiệm trực tuyến (Trích tiền từ TAI_KHOAN_THANH_TOAN trong ACID Transaction)
 */
async function openOnline(currentUser, { kyHanId, taiKhoanNguonId, soTienGui, chiThiDaoHan, kenhThongBao }) {
    if (!currentUser.khachHangId) {
        throw new AppError(403, 'FORBIDDEN', 'Chỉ tài khoản khách hàng mới thực hiện mở sổ online.');
    }

    const { termInfo, amount } = await validateProductAndAmount(kyHanId, soTienGui);
    const resolvedRollover = resolveRolloverMode(chiThiDaoHan, termInfo.loai_ky_han);
    const ngayMo = new Date().toISOString().slice(0, 10);
    const ngayDaoHan = interestService.calculateMaturityDate(ngayMo, termInfo.thoi_han, termInfo.don_vi_thoi_han);
    const maSo = generatePassbookCode();

    const txResult = await withTransaction(async (conn) => {
        const payAccount = taiKhoanNguonId
            ? await taiKhoanRepo.layVaKhoaTaiKhoanThanhToan(Number(taiKhoanNguonId), currentUser.khachHangId, conn)
            : await taiKhoanRepo.layTaiKhoanThanhToanMacDinhVaKhoa(currentUser.khachHangId, conn);

        if (!payAccount) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản thanh toán nguồn hợp lệ.');
        }

        if (Number(payAccount.so_du) < amount) {
            throw new AppError(400, 'INSUFFICIENT_BALANCE', 'Số dư tài khoản thanh toán không đủ để mở sổ.');
        }

        await taiKhoanRepo.truTienThanhToan(payAccount.tai_khoan_thanh_toan_id, amount, conn);

        const created = await soTietKiemRepo.taoBanGhiSoMoi(
            {
                khachHangId: currentUser.khachHangId,
                nhanVienMoId: null,
                maSo,
                ngayMo,
                kyHanId: termInfo.ky_han_id,
                bieuLaiSuatId: termInfo.bieu_lai_suat_id,
                soTienGoc: amount,
                laiSuatApDung: Number(termInfo.lai_suat_nam),
                ngayDaoHan,
                chiThiDaoHan: resolvedRollover,
                taiKhoanNguonId: payAccount.tai_khoan_thanh_toan_id,
                nguoiXuLyId: currentUser.taiKhoanId,
                kenhGiaoDich: TX_CHANNEL.INTERNET_BANKING,
                lyDo: `Mở sổ tiết kiệm online (${termInfo.ten_san_pham})`
            },
            conn
        );

        return {
            ...created,
            soTienGoc: amount,
            laiSuatApDung: Number(termInfo.lai_suat_nam),
            ngayBatDau: ngayMo,
            ngayDaoHan,
            soDuConLai: Number(payAccount.so_du) - amount
        };
    });

    // Kích hoạt UC-EX02 ngoài Transaction để lỗi gửi tin nhắn không rollback sổ vừa mở
    try {
        await notificationService.sendOpenPassbookConfirmation({
            khachHangId: currentUser.khachHangId,
            chuKyId: txResult.chuKyId,
            maSo: txResult.maSo,
            soTienGoc: txResult.soTienGoc,
            kenhGui: kenhThongBao === 'SMS' ? 'SMS' : 'EMAIL',
            recipient: currentUser.hoTen
        });
    } catch (notifyErr) {
        console.error('[UC-EX02_WARN]', notifyErr.message);
    }

    return txResult;
}

/**
 * FR-04: Mở sổ tiết kiệm trực tiếp tại quầy (Kiểm tra hồ sơ CCCD trước khi ghi nhận)
 */
async function openAtCounter(currentUser, { soCccd, kyHanId, soTienGui, chiThiDaoHan }) {
    const customerProfile = await khachHangRepo.layThongTinHoSoTheoCCCD(String(soCccd).trim());
    if (!customerProfile || !customerProfile.so_cccd) {
        throw new AppError(
            404,
            'CUSTOMER_PROFILE_REQUIRED',
            'Chưa tìm thấy hồ sơ khách hàng theo CCCD. Vui lòng tạo mới hoặc bổ sung hồ sơ khách hàng trước.'
        );
    }

    const { termInfo, amount } = await validateProductAndAmount(kyHanId, soTienGui);
    const resolvedRollover = resolveRolloverMode(chiThiDaoHan, termInfo.loai_ky_han);
    const ngayMo = new Date().toISOString().slice(0, 10);
    const ngayDaoHan = interestService.calculateMaturityDate(ngayMo, termInfo.thoi_han, termInfo.don_vi_thoi_han);
    const maSo = generatePassbookCode();

    const created = await withTransaction((conn) =>
        soTietKiemRepo.taoBanGhiSoMoi(
            {
                khachHangId: customerProfile.khach_hang_id,
                nhanVienMoId: currentUser.nhanVienId || null,
                maSo,
                ngayMo,
                kyHanId: termInfo.ky_han_id,
                bieuLaiSuatId: termInfo.bieu_lai_suat_id,
                soTienGoc: amount,
                laiSuatApDung: Number(termInfo.lai_suat_nam),
                ngayDaoHan,
                chiThiDaoHan: resolvedRollover,
                taiKhoanNguonId: null,
                nguoiXuLyId: currentUser.taiKhoanId,
                kenhGiaoDich: TX_CHANNEL.COUNTER,
                lyDo: `Mở sổ tiết kiệm tại quầy (${termInfo.ten_san_pham})`
            },
            conn
        )
    );

    return {
        ...created,
        chuSo: customerProfile.ho_ten,
        soCccd: customerProfile.so_cccd,
        soTienGoc: amount,
        laiSuatApDung: Number(termInfo.lai_suat_nam),
        ngayMo,
        ngayDaoHan,
        chungTuId: `CT-${created.giaoDichId}`
    };
}

module.exports = {
    openOnline,
    openAtCounter
};
