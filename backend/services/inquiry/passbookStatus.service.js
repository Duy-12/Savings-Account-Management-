/**
 * Tầng BLL (:DieuKhienSoTietKiem) — Component TraCuuVaQuanLySo (FR-09 Quản lý trạng thái sổ)
 * File: backend/services/inquiry/passbookStatus.service.js
 */
const { withTransaction } = require('../../config/db');
const { PASSBOOK_STATUS, PASSBOOK_STATUS_TRANSITIONS } = require('../../config/constants');
const { AppError } = require('../../middlewares/error.middleware');
const soTietKiemRepo = require('../../repositories/soTietKiem.repo');

const VALID_STATUSES = new Set(Object.values(PASSBOOK_STATUS));

/**
 * Kiểm tra chuyển trạng thái theo State Machine (FR-09)
 */
function assertValidStatusTransition(currentStatus, targetStatus) {
    if (!VALID_STATUSES.has(targetStatus)) {
        throw new AppError(400, 'INVALID_STATUS_TRANSITION', `Trạng thái '${targetStatus}' không tồn tại.`);
    }
    if (currentStatus === targetStatus) {
        throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Sổ đang ở trạng thái này rồi.');
    }

    const allowedNext = PASSBOOK_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
        throw new AppError(
            400,
            'INVALID_STATUS_TRANSITION',
            `Không thể chuyển trạng thái sổ từ '${currentStatus}' sang '${targetStatus}'.`
        );
    }
}

async function changePassbookStatus(maSo, currentUser, { trangThaiMoi, lyDo }) {
    if (!lyDo || String(lyDo).trim().length < 3) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Vui lòng nhập lý do thay đổi trạng thái (tối thiểu 3 ký tự).');
    }

    return withTransaction(async (conn) => {
        const passbook = await soTietKiemRepo.layVaKhoaSoDeGiaoDich(maSo, conn);
        if (!passbook) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy sổ tiết kiệm.');
        }

        assertValidStatusTransition(passbook.trang_thai, trangThaiMoi);

        const { lichSuId } = await soTietKiemRepo.capNhatTrangThai(
            passbook.so_tiet_kiem_id,
            {
                trangThaiCu: passbook.trang_thai,
                trangThaiMoi,
                taiKhoanThayDoiId: currentUser.taiKhoanId,
                lyDo: String(lyDo).trim()
            },
            conn
        );

        return {
            maSo: passbook.ma_so,
            trangThaiCu: passbook.trang_thai,
            trangThaiMoi,
            lichSuId
        };
    });
}

module.exports = {
    assertValidStatusTransition,
    changePassbookStatus
};
