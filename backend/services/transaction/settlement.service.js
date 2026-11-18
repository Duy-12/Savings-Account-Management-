/**
 * Tầng BLL (:DieuKhienTatToan) — Component GiaoDichTietKiem (FR-07 Tất toán, EX-03 Trước hạn)
 * File: backend/services/transaction/settlement.service.js
 */
const { withTransaction } = require('../../config/db');
const { PASSBOOK_STATUS, ROLES, SETTLEMENT_TYPE, TX_CHANNEL } = require('../../config/constants');
const { AppError } = require('../../middlewares/error.middleware');
const soTietKiemRepo = require('../../repositories/soTietKiem.repo');
const laiSuatRepo = require('../../repositories/laiSuat.repo');
const taiKhoanRepo = require('../../repositories/taiKhoan.repo');
const interestService = require('./interest.service');

function isCustomerOnly(currentUser) {
    return (
        currentUser.roles &&
        currentUser.roles.length === 1 &&
        currentUser.roles[0] === ROLES.CUSTOMER
    );
}

/**
 * Kiểm tra điều kiện & tính toán số tiền tất toán (dùng chung cho preview và confirm)
 */
function computeSettlementMetrics(passbook, ngayTatToan, nonTermRateObj) {
    if (!passbook || !passbook.chuKyHienTai) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy sổ tiết kiệm.');
    }

    if (passbook.trang_thai !== PASSBOOK_STATUS.ACTIVE) {
        throw new AppError(
            400,
            'INVALID_STATUS_TRANSITION',
            `Sổ tiết kiệm hiện ở trạng thái '${passbook.trang_thai}', không đủ điều kiện tất toán.`
        );
    }

    const ck = passbook.chuKyHienTai;
    const soNgayThucGui = interestService.computeDaysBetween(ck.ngay_bat_dau, ngayTatToan);
    if (soNgayThucGui < 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Ngày tất toán không được nhỏ hơn ngày bắt đầu chu kỳ.');
    }

    const isBeforeMaturity = Boolean(ck.ngay_dao_han && ngayTatToan < ck.ngay_dao_han);
    const laiSuatApDung = isBeforeMaturity
        ? Number(nonTermRateObj?.lai_suat_nam ?? 0.15)
        : Number(ck.lai_suat_ap_dung);

    const tienGoc = Number(ck.so_tien_goc);
    const tienLai = interestService.calculateSimpleInterest(tienGoc, laiSuatApDung, soNgayThucGui);

    return {
        maSo: passbook.ma_so,
        trangThai: passbook.trang_thai,
        isBeforeMaturity,
        canhBao: isBeforeMaturity
            ? `Tất toán trước hạn (${ngayTatToan} < ${ck.ngay_dao_han}): hủy lãi suất kỳ hạn ${ck.lai_suat_ap_dung}%/năm, áp dụng lãi suất không kỳ hạn ${laiSuatApDung}%/năm.`
            : null,
        ngayBatDau: ck.ngay_bat_dau,
        ngayDaoHan: ck.ngay_dao_han,
        ngayTatToan,
        soNgayThucGui,
        tienGoc,
        laiSuatApDung,
        tienLai,
        tongTienNhan: tienGoc + tienLai
    };
}

/**
 * Bước 1 (FR-07 / EX-03): Xem trước số tiền gốc + lãi & cảnh báo trước hạn
 */
async function previewSettlement(maSo, currentUser, ngayTatToanInput) {
    const ngayTatToan = ngayTatToanInput || new Date().toISOString().slice(0, 10);
    const passbook = await soTietKiemRepo.layChiTietSo(maSo);
    if (!passbook) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy sổ tiết kiệm.');
    }

    if (isCustomerOnly(currentUser) && passbook.khach_hang_id !== currentUser.khachHangId) {
        throw new AppError(403, 'FORBIDDEN', 'Bạn chỉ được phép tất toán sổ tiết kiệm của chính mình.');
    }

    if (passbook.trang_thai !== PASSBOOK_STATUS.ACTIVE) {
        throw new AppError(
            400,
            'INVALID_STATUS_TRANSITION',
            `Sổ tiết kiệm hiện ở trạng thái '${passbook.trang_thai}', không đủ điều kiện tất toán.`
        );
    }

    const isEarly = Boolean(passbook.ngay_dao_han && ngayTatToan < passbook.ngay_dao_han);
    const nonTermRate = isEarly ? await laiSuatRepo.layLaiSuatKhongKyHan() : null;
    const normalized = {
        ...passbook,
        chuKyHienTai: {
            chu_ky_id: passbook.chu_ky_id,
            so_tien_goc: passbook.so_tien_goc,
            lai_suat_ap_dung: passbook.lai_suat_ap_dung,
            ngay_bat_dau: passbook.ngay_bat_dau,
            ngay_dao_han: passbook.ngay_dao_han
        }
    };

    return computeSettlementMetrics(normalized, ngayTatToan, nonTermRate);
}

/**
 * Bước 2 (FR-07 / EX-03): Xác nhận tất toán sổ bên trong ACID Transaction (FOR UPDATE)
 */
async function confirmSettlement(maSo, currentUser, { ngayTatToan: ngayInput, hinhThucNhan = 'CHUYEN_KHOAN', taiKhoanNhanId }) {
    const ngayTatToan = ngayInput || new Date().toISOString().slice(0, 10);
    const nonTermRate = await laiSuatRepo.layLaiSuatKhongKyHan();

    return withTransaction(async (conn) => {
        const passbook = await soTietKiemRepo.layVaKhoaSoDeGiaoDich(maSo, conn);
        if (!passbook) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy sổ tiết kiệm.');
        }

        if (isCustomerOnly(currentUser) && passbook.khach_hang_id !== currentUser.khachHangId) {
            throw new AppError(403, 'FORBIDDEN', 'Bạn chỉ được phép tất toán sổ tiết kiệm của chính mình.');
        }

        const metrics = computeSettlementMetrics(passbook, ngayTatToan, nonTermRate);

        let creditedAccountId = null;
        if (hinhThucNhan === 'CHUYEN_KHOAN') {
            const targetAccount = taiKhoanNhanId
                ? await taiKhoanRepo.layVaKhoaTaiKhoanThanhToan(Number(taiKhoanNhanId), passbook.khach_hang_id, conn)
                : await taiKhoanRepo.layTaiKhoanThanhToanMacDinhVaKhoa(passbook.khach_hang_id, conn);

            if (!targetAccount) {
                throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản thanh toán nhận tiền tất toán.');
            }
            await taiKhoanRepo.congTienVaoTaiKhoan(targetAccount.tai_khoan_thanh_toan_id, metrics.tongTienNhan, conn);
            creditedAccountId = targetAccount.tai_khoan_thanh_toan_id;
        }

        const loaiTatToan = metrics.isBeforeMaturity ? SETTLEMENT_TYPE.EARLY : SETTLEMENT_TYPE.ON_TIME;
        const kenhGiaoDich = isCustomerOnly(currentUser) ? TX_CHANNEL.INTERNET_BANKING : TX_CHANNEL.COUNTER;

        const { giaoDichId } = await soTietKiemRepo.hoanTatTatToan(
            {
                soTietKiemId: passbook.so_tiet_kiem_id,
                chuKyId: passbook.chuKyHienTai.chu_ky_id,
                ngayTatToan,
                taiKhoanNhanId: creditedAccountId,
                nguoiXuLyId: currentUser.taiKhoanId,
                nhanVienXuLyId: currentUser.nhanVienId || null,
                loaiTatToan,
                tienGoc: metrics.tienGoc,
                tienLai: metrics.tienLai,
                laiSuatApDung: metrics.laiSuatApDung,
                kenhGiaoDich
            },
            conn
        );

        return {
            maSo: passbook.ma_so,
            trangThai: PASSBOOK_STATUS.SETTLED,
            giaoDichId,
            loaiTatToan,
            tienGoc: metrics.tienGoc,
            tienLai: metrics.tienLai,
            tongTienThucNhan: metrics.tongTienNhan,
            ngayTatToan
        };
    });
}

module.exports = {
    computeSettlementMetrics,
    previewSettlement,
    confirmSettlement
};
