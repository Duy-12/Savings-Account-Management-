/**
 * Tầng BLL (:DieuKhienLaiSuat) — Component QuanTriVaTuDongHoa (FR-12)
 * File: backend/services/admin/rateConfig.service.js
 */
const { withTransaction } = require('../../config/db');
const { AppError } = require('../../middlewares/error.middleware');
const laiSuatRepo = require('../../repositories/laiSuat.repo');

async function getAllRates() {
    return laiSuatRepo.truyVanTatCa();
}

async function createTermAndRate({ sanPhamId = 1, thoiHan, donViThoiHan = 'THANG', loaiKyHan, laiSuatNam, soTienToiThieu }) {
    const parsedRate = Number(laiSuatNam);
    const parsedTerm = Number(thoiHan);

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Lãi suất năm phải lớn hơn 0.');
    }
    if (!Number.isInteger(parsedTerm) || parsedTerm < 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Thời hạn gửi phải là số nguyên không âm.');
    }

    const product = await laiSuatRepo.kiemTraSanPhamTonTai(sanPhamId);
    if (!product) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm tiết kiệm.');
    }

    const duplicated = await laiSuatRepo.kiemTraTrungKyHan(sanPhamId, parsedTerm, donViThoiHan);
    if (duplicated) {
        throw new AppError(409, 'DUPLICATE_ENTRY', 'Kỳ hạn này đã tồn tại trong sản phẩm đã chọn.');
    }

    const resolvedLoaiKyHan = loaiKyHan || (parsedTerm === 0 ? 'KHONG_KY_HAN' : 'CO_KY_HAN');

    const created = await withTransaction(async (conn) => {
        const res = await laiSuatRepo.taoKyHanVaBieuLaiSuat(
            {
                sanPhamId,
                thoiHan: parsedTerm,
                donViThoiHan,
                loaiKyHan: resolvedLoaiKyHan,
                laiSuatNam: parsedRate
            },
            conn
        );
        if (soTienToiThieu !== undefined && soTienToiThieu !== null && Number(soTienToiThieu) > 0) {
            return laiSuatRepo.capNhatLaiSuatKyHan(res.kyHanId, { laiSuatNam: parsedRate, soTienToiThieu: Number(soTienToiThieu) }, conn);
        }
        return laiSuatRepo.layThongTinKyHanVaLaiSuat(res.kyHanId, conn);
    });

    return created;
}

async function updateRate(kyHanId, { laiSuatNam, soTienToiThieu }) {
    const parsedRate = Number(laiSuatNam);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Lãi suất năm mới phải lớn hơn 0.');
    }
    if (soTienToiThieu !== undefined && soTienToiThieu !== null && Number(soTienToiThieu) <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Số tiền tối thiểu phải lớn hơn 0.');
    }

    const existing = await laiSuatRepo.layThongTinKyHanVaLaiSuat(kyHanId);
    if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy kỳ hạn cần cập nhật.');
    }

    return withTransaction((conn) =>
        laiSuatRepo.capNhatLaiSuatKyHan(kyHanId, { laiSuatNam: parsedRate, soTienToiThieu }, conn)
    );
}

module.exports = {
    getAllRates,
    createTermAndRate,
    updateRate
};
