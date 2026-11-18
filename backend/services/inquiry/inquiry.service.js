/**
 * Tầng BLL (:DieuKhienTraCuu) — Component TraCuuVaQuanLySo (FR-05 Tra cứu thông tin sổ)
 * File: backend/services/inquiry/inquiry.service.js
 */
const { PASSBOOK_STATUS, ROLES } = require('../../config/constants');
const { AppError } = require('../../middlewares/error.middleware');
const soTietKiemRepo = require('../../repositories/soTietKiem.repo');
const interestService = require('../transaction/interest.service');

function isCustomerOnly(currentUser) {
    return (
        currentUser.roles &&
        currentUser.roles.length === 1 &&
        currentUser.roles[0] === ROLES.CUSTOMER
    );
}

async function listPassbooks(currentUser, { q, status } = {}) {
    const khachHangId = isCustomerOnly(currentUser) ? currentUser.khachHangId : null;
    const rows = await soTietKiemRepo.truyVanSoTietKiem({ q, status, khachHangId });
    const today = new Date().toISOString().slice(0, 10);

    return rows.map((row) => {
        let tienLaiTamTinh = 0;
        if (row.trang_thai === PASSBOOK_STATUS.ACTIVE) {
            const days = Math.max(0, interestService.computeDaysBetween(row.ngay_bat_dau, today));
            tienLaiTamTinh = interestService.calculateSimpleInterest(
                Number(row.so_tien_goc),
                Number(row.lai_suat_ap_dung),
                days
            );
        }
        return {
            ...row,
            tienLaiTamTinh
        };
    });
}

async function getPassbookDetail(maSo, currentUser) {
    const detail = await soTietKiemRepo.layChiTietSo(maSo);
    if (!detail) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy sổ tiết kiệm.');
    }

    if (isCustomerOnly(currentUser) && detail.khach_hang_id !== currentUser.khachHangId) {
        throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền xem thông tin sổ của khách hàng khác.');
    }

    const today = new Date().toISOString().slice(0, 10);
    let tienLaiTamTinh = 0;
    if (detail.trang_thai === PASSBOOK_STATUS.ACTIVE) {
        const days = Math.max(0, interestService.computeDaysBetween(detail.ngay_bat_dau, today));
        tienLaiTamTinh = interestService.calculateSimpleInterest(
            Number(detail.so_tien_goc),
            Number(detail.lai_suat_ap_dung),
            days
        );
    }

    return {
        ...detail,
        tienLaiTamTinh
    };
}

module.exports = {
    listPassbooks,
    getPassbookDetail
};
