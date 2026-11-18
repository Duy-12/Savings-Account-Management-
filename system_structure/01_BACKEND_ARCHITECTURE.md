# ⚙️ Thiết kế Chi tiết Kiến trúc Codebase Backend (Node.js + Express + MySQL)

> Tài liệu này quy định chi tiết cấu trúc, trách nhiệm từng lớp/module, quản lý Transaction ACID và quy tắc bảo mật cho thư mục `backend/`, bám sát 100% **4 Component BLL** và **1 Component DAL (`TruyCapDuLieu`)** từ tài liệu thiết kế Chương 6.

---

## 1. Nguyên tắc Phân tầng Bắt buộc (Strict 3-Layer Dependency Rule)

```text
HTTP Request
    │
    ▼
[routes/ + middlewares/]  ──►  Xác thực JWT, kiểm tra RBAC, validate định dạng đầu vào
    │
    ▼
[controllers/]             ──►  Chỉ đọc req.body / req.params / req.query, gọi Service, trả HTTP JSON
    │
    ▼
[services/]  (TẦNG BLL)    ──►  Chứa toàn bộ Business Rules, tính lãi, điều phối Transaction ACID
    │                           ❌ CẤM viết SQL trực tiếp, ❌ CẤM phụ thuộc req/res của Express
    ▼
[repositories/] (TẦNG DAL) ──►  Chỉ chạy SQL tham số hóa (Prepared Statements), nhận `conn` transaction
    │                           ❌ CẤM chứa logic nghiệp vụ ngân hàng
    ▼
[MySQL Database]           ──►  19 bảng InnoDB (quan_ly_so_tiet_kiem)
```

---

## 2. Cấu hình Hạ tầng (`backend/config/`)

### `config/db.js` — Connection Pool & ACID Transaction Helper
Nâng cấp từ `config/db.config.example.js`, cung cấp `pool` (`mysql2/promise`) và hàm dùng chung `withTransaction` để đảm bảo tính nguyên tử (Atomicity) cho `FR-03`, `FR-04`, `FR-07`, `FR-14`:

```javascript
// Thiết kế chuẩn hàm withTransaction(workFn)
async function withTransaction(workFn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await workFn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
```
* **Quy tắc dùng `conn` ở DAL:** Mọi hàm trong `repositories/*.repo.js` đều nhận tham số tùy chọn `(..., db = pool)`. Khi chạy trong Transaction, Service truyền `conn` vào để mọi lệnh `SELECT ... FOR UPDATE`, `UPDATE`, `INSERT` nằm chung một phiên giao dịch.

### `config/constants.js` — Đồng bộ Enum với `schema.sql`
Tránh hardcode chuỗi rải rác; đồng bộ chính xác giá trị cột trong `backend/database/schema.sql`:
- `ROLES`: `ADMIN`, `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `KHACH_HANG`
- `ACCOUNT_STATUS`: `HOAT_DONG`, `KHOA_TAM_THOI`, `NGUNG_HOAT_DONG`
- `PASSBOOK_STATUS`: `DANG_HOAT_DONG`, `BAO_MAT`, `PHONG_TOA`, `DA_TAT_TOAN`
- `ROLLOVER_MODE`: `TAI_TUC_GOC_VA_LAI`, `TAI_TUC_GOC_CHUYEN_LAI`, `KHONG_TAI_TUC`
- `TX_TYPE`: `MO_SO`, `GUI_THEM_TIEN`, `RUT_TIEN_MAT`, `TAT_TOAN`, `TRA_LAI_DINH_KY`
- `TX_CHANNEL`: `TAI_QUAY`, `INTERNET_BANKING`, `MOBILE_BANKING`
- `MAX_LOGIN_ATTEMPTS`: `5`, `LOCK_DURATION_MINUTES`: `15`

---

## 3. Thiết kế Tầng Middleware (`backend/middlewares/`)

| File | Chức năng chính | Xử lý chi tiết |
| :--- | :--- | :--- |
| `auth.middleware.js` | Xác thực JWT (`authenticate`) | Đọc header `Authorization: Bearer <token>`, giải mã `jwt.verify`, truy vấn lại `taiKhoan.repo.js` để đảm bảo tài khoản vẫn `HOAT_DONG`, gắn `req.user = { taiKhoanId, nguoiDungId, khachHangId, nhanVienId, roles, permissions }`. **Tuyệt đối không tin vai trò từ payload client gửi lên.** |
| `rbac.middleware.js` | Phân quyền (`authorizeRoles`, `authorizePermissions`) | Kiểm tra `req.user.roles` hoặc `req.user.permissions` (đọc từ `VAI_TRO_QUYEN` / `QUYEN_TRUY_CAP`). Nếu không đủ quyền trả `403 Forbidden`. |
| `validate.middleware.js` | Kiểm tra định dạng đầu vào | Validate CCCD (12 chữ số), SĐT (`0xxxxxxxxx`), Email, `soTien > 0`, `tuNgay <= denNgay` ngay tại cửa ngõ API, trả `400 Bad Request`. |
| `error.middleware.js` | Xử lý lỗi tập trung (`AppError`) | Bắt mọi lỗi từ `next(err)` (hoặc `express-async-errors`/wrapper), phân biệt lỗi nghiệp vụ (`AppError` với `statusCode`, `errorCode`) và lỗi hệ thống (`500`, ẩn chi tiết SQL khi chạy production). |

---

## 4. Thiết kế Tầng DAL (`backend/repositories/`)

Tầng DAL đóng gói thành phần `TruyCapDuLieu (IRepository)`, ánh xạ 1-1 với các đối tượng `:DuLieu...` trong Sơ đồ Cộng tác (`Tuan_10.md`):

| File Repository | Đối tượng UML tương ứng | Các phương thức cốt lõi cần cài đặt | Bảng SQL thao tác |
| :--- | :--- | :--- | :--- |
| `taiKhoan.repo.js` | `:DuLieuTaiKhoan` | • `layThongTinTaiKhoan(tenDangNhap)` *(kèm vai trò & quyền)*<br>• `tangSoLanNhapSai(taiKhoanId)`<br>• `khoaTaiKhoan(taiKhoanId, khoaDen)`<br>• `resetNhapSaiVaCapNhatDangNhapCuoi(taiKhoanId)`<br>• `kiemTraSoDu(khachHangId, taiKhoanTTId, conn)` *(dùng `FOR UPDATE` khi trừ/cộng)*<br>• `truTienThanhToan(taiKhoanTTId, soTien, conn)`<br>• `congTienVaoTaiKhoan(taiKhoanTTId, soTien, conn)`<br>• `truyVanTatCaTaiKhoan()`, `taoTaiKhoanVaGanVaiTro()`, `capNhatTrangThai()` | `TAI_KHOAN_DANG_NHAP`, `TAI_KHOAN_VAI_TRO`, `VAI_TRO`, `VAI_TRO_QUYEN`, `QUYEN_TRUY_CAP`, `TAI_KHOAN_THANH_TOAN` |
| `hoSo.repo.js` | `:DuLieuHoSo` | • `truyVanHoSo(nguoiDungId)`<br>• `capNhatHoSo(nguoiDungId, data, conn)` | `NGUOI_DUNG`, `KHACH_HANG`, `HO_SO_KHACH_HANG` |
| `khachHang.repo.js` | `:DuLieuKhachHang` | • `layThongTinHoSoTheoCCCD(soCCCD)`<br>• `truyVanToanBo(tuKhoa)`<br>• `kiemTraTrungLap(cccd, email, sdt, excludeKhachHangId)`<br>• `taoKhachHangMoi(data, conn)` *(tạo `NGUOI_DUNG` + `KHACH_HANG` + `HO_SO_KHACH_HANG` + `TAI_KHOAN_THANH_TOAN` mặc định nếu cần)*<br>• `capNhatKhachHang(khachHangId, data, conn)` | `NGUOI_DUNG`, `KHACH_HANG`, `HO_SO_KHACH_HANG`, `TAI_KHOAN_THANH_TOAN` |
| `soTietKiem.repo.js` | `:DuLieuSoTietKiem` | • `taoBanGhiSoMoi({ soData, chuKyData, giaoDichData, lichSuData }, conn)`<br>• `truyVanSoTietKiem({ keyword, khachHangId })` *(join kỳ hạn, sản phẩm, chủ sổ)*<br>• `layChiTietSo(maSoHoacId, conn)` *(dùng `FOR UPDATE` khi tất toán/đổi trạng thái)*<br>• `capNhatTrangThai(soId, trangThaiCu, trangThaiMoi, nguoiThayDoiId, lyDo, conn)` *(ghi cả `LICH_SU_TRANG_THAI_SO`)*<br>• `locSoSapDaoHan(soNgay)` *(FR-13)*<br>• `locSoToiHanHomNay(ngayHienTai, conn)` *(FR-14)*<br>• `dongChuKyCuVaMoChuKyMoi(chuKyCuId, chuKyMoiData, giaoDichData, conn)` *(FR-14)* | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `GIAO_DICH_TIET_KIEM`, `LICH_SU_TRANG_THAI_SO`, `YEU_CAU_TAT_TOAN` |
| `laiSuat.repo.js` | `:DuLieuLaiSuat` | • `truyVanTatCa()` *(join `SAN_PHAM_TIET_KIEM`, `KY_HAN_TIET_KIEM`, `BIEU_LAI_SUAT` hiện hành)*<br>• `layThongTinKyHanVaLaiSuat(kyHanId)`<br>• `layLaiSuatKhongKyHan()` *(cho `EX-03`)*<br>• `kiemTraTrungKyHan(sanPhamId, thoiHan, donViThoiHan)`<br>• `taoHoacCapNhatKyHanLaiSuat(data, conn)` *(đóng `hieu_luc_den` của biểu cũ, mở biểu mới)* | `SAN_PHAM_TIET_KIEM`, `KY_HAN_TIET_KIEM`, `BIEU_LAI_SUAT` |
| `heThong.repo.js` | `:DuLieuHeThong` | • `tongHopDuLieuBaoCao({ loaiBaoCao, tuNgay, denNgay, trangThai })`<br>• `luuThongBao(data, conn)`<br>• `capNhatTrangThaiThongBao(thongBaoId, trangThai, thuLaiSau, conn)`<br>• `layLichSuThongBao(khachHangId)` | `GIAO_DICH_TIET_KIEM`, `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `THONG_BAO` |

---

## 5. Thiết kế Tầng BLL (`backend/services/`) — Đóng gói 4 Component Chương 6

### Component 1: `services/account/` (`QuanLyTaiKhoan`)
* **`auth.service.js` (`FR-01`, `EX-01`, Đăng ký online):**
  1. `login(tenDangNhap, matKhau)`:
     - Đọc tài khoản từ `taiKhoan.repo.layThongTinTaiKhoan()`. Nếu không tồn tại $\rightarrow$ trả `401` (`Sai tên đăng nhập hoặc mật khẩu`).
     - Kiểm tra `trang_thai === 'KHOA_TAM_THOI'` và `khoa_den > NOW()` $\rightarrow$ trả `423 Locked` (`Tài khoản đang bị khóa tạm thời`).
     - Kiểm tra mật khẩu bằng `bcrypt.compare(matKhau, mat_khau_bam)`:
       - Nếu sai (`EX-01`): Gọi `tangSoLanNhapSai()`. Nếu `so_lan_dang_nhap_sai >= 5` $\rightarrow$ gọi `khoaTaiKhoan()` (15 phút) và trả `423` (`Tài khoản đã bị khóa do nhập sai 5 lần`); ngược lại trả `401` kèm số lần còn lại.
       - Nếu đúng: Reset `so_lan_dang_nhap_sai = 0`, ký JWT Token (`{ taiKhoanId, nguoiDungId, roles }`), trả về user info + permissions (không trả `mat_khau_bam`).
  2. `registerCustomer(payload)` *(phục vụ màn hình Đăng ký online trên FE)*:
     - Validate + kiểm tra trùng `ten_dang_nhap`, `so_cccd`, `email`, `so_dien_thoai`.
     - Trong `withTransaction`: Insert `NGUOI_DUNG` $\rightarrow$ `KHACH_HANG` $\rightarrow$ `HO_SO_KHACH_HANG` $\rightarrow$ `TAI_KHOAN_DANG_NHAP` (hash `bcrypt`, `10` rounds) $\rightarrow$ `TAI_KHOAN_VAI_TRO` (cố định `KHACH_HANG`) $\rightarrow$ `TAI_KHOAN_THANH_TOAN` mặc định (số dư `0.00`).
* **`user.service.js` (`FR-02`):** Xem & cập nhật hồ sơ cá nhân (khóa không cho tự đổi `so_cccd` hoặc `vai_tro`).
* **`adminAccount.service.js` (`FR-11`):** Xem danh sách tài khoản, tạo tài khoản nội bộ (`GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN`), gán lại vai trò, khóa/mở khóa tài khoản.

### Component 2: `services/transaction/` (`GiaoDichTietKiem`)
* **`interest.service.js` (`FR-06`):**
  - Chuẩn hóa công thức tính lãi Core Banking (lãi đơn theo ngày thực tế trên cơ sở 365 ngày):
    $$\text{Tiền lãi} = \text{Tiền gốc} \times \frac{\text{Lãi suất (%/năm)}}{100} \times \frac{\text{Số ngày thực gửi}}{365}$$
  - Làm tròn chuẩn VNĐ (`Math.round`).
  - Hỗ trợ cả 2 chế độ: tính dự kiến theo tham số tự do (`FR-06`) và tính lãi tất toán (`FR-07` đúng hạn vs `EX-03` rút trước hạn áp dụng lãi không kỳ hạn `0.15%/năm`).
* **`savingsTx.service.js` (`FR-03`, `FR-04`):**
  - **`openOnline(khachHangId, nguoiDungId, taiKhoanId, payload)` (`FR-03`):**
    Chạy trong `withTransaction`:
    1. Lấy thông tin `KY_HAN_TIET_KIEM` + `SAN_PHAM_TIET_KIEM` + `BIEU_LAI_SUAT` đang hiệu lực.
    2. Kiểm tra `soTien >= san_pham.so_tien_toi_thieu`. Nếu không đạt $\rightarrow$ ném `AppError(400, 'INSUFFICIENT_MIN_AMOUNT')`.
    3. Lock hàng tài khoản thanh toán (`SELECT ... FOR UPDATE`): kiểm tra `so_du >= soTien`. Nếu thiếu $\rightarrow$ ném `AppError(400, 'INSUFFICIENT_BALANCE', 'Số dư không đủ')`.
    4. Trừ `so_du` tài khoản thanh toán nguồn.
    5. Sinh `ma_so` (ví dụ `STK` + timestamp/sequence), tính `ngay_dao_han` (nếu có kỳ hạn).
    6. Tạo `SO_TIET_KIEM` (`nhan_vien_mo_id = NULL`), `CHU_KY_SO_TIET_KIEM` (`so_thu_tu_chu_ky = 1`), `GIAO_DICH_TIET_KIEM` (`loai_giao_dich = 'MO_SO'`, `kenh_giao_dich = 'INTERNET_BANKING'`), `LICH_SU_TRANG_THAI_SO`.
    7. Sau khi `COMMIT` thành công $\rightarrow$ gọi bất đồng bộ `notificationService.sendOpenPassbookConfirmation(soTietKiemId)` (`UC-EX02`) — lỗi gửi SMS/Email không làm rollback giao dịch mở sổ!
  - **`openAtCounter(nhanVienId, taiKhoanId, payload)` (`FR-04`):**
    Chạy trong `withTransaction`:
    1. Kiểm tra hồ sơ khách hàng qua `so_cccd`. Nếu chưa có hồ sơ đầy đủ $\rightarrow$ ném `AppError(404, 'CUSTOMER_PROFILE_REQUIRED')`.
    2. Kiểm tra sản phẩm, kỳ hạn, biểu lãi suất hiện hành & `soTien >= so_tien_toi_thieu`.
    3. Ghi `SO_TIET_KIEM` (`nhan_vien_mo_id = nhanVienId`), `CHU_KY_SO_TIET_KIEM`, `GIAO_DICH_TIET_KIEM` (`kenh_giao_dich = 'TAI_QUAY'`), `LICH_SU_TRANG_THAI_SO`.
    4. Trả về dữ liệu chứng từ mở sổ để FE/quầy in.
* **`settlement.service.js` (`FR-07`, `EX-03`):**
  Tách rõ 2 bước khớp hoàn toàn **Sequence `FR 07.png` & `EX 03.png`**:
  1. **`previewSettlement(maSo, callerUser, ngayTatToan)`**:
     - Kiểm tra quyền sở hữu (nếu là `KHACH_HANG`, chỉ được tất toán sổ của chính mình).
     - Kiểm tra `trang_thai === 'DANG_HOAT_DONG'` (nếu `PHONG_TOA` / `BAO_MAT` / `DA_TAT_TOAN` $\rightarrow$ trả `400`).
     - So sánh `ngayTatToan < chu_ky.ngay_dao_han`:
       - Nếu **Trước hạn (`EX-03`)**: Lấy lãi suất không kỳ hạn hiện hành, tính `laiThucNhan`, đặt `isEarly = true`, kèm thông điệp cảnh báo mất lãi kỳ hạn.
       - Nếu **Đúng hạn (`FR-07`)**: Áp dụng `chu_ky.lai_suat_ap_dung` tính lãi đúng hạn, `isEarly = false`.
  2. **`confirmSettlement(maSo, callerUser, { ngayTatToan, hinhThuc, taiKhoanNhanId })`**:
     - Chạy trong `withTransaction`:
       1. Lock dòng `SO_TIET_KIEM` (`FOR UPDATE`) kiểm tra lại trạng thái `DANG_HOAT_DONG` (chống double-submit / race condition).
       2. Tính lại số tiền gốc + lãi phía Server (không bao giờ tin số tiền lãi FE gửi lên).
       3. Đóng chu kỳ hiện tại (`ngay_ket_thuc = ngayTatToan`), cập nhật `SO_TIET_KIEM.trang_thai = 'DA_TAT_TOAN'`, `ngay_tat_toan = NOW()`.
       4. Ghi `GIAO_DICH_TIET_KIEM` (`loai_giao_dich = 'TAT_TOAN'`), ghi `YEU_CAU_TAT_TOAN` (`trang_thai = 'DA_DUYET'`, `loai_tat_toan = isEarly ? 'TRUOC_HAN' : 'DUNG_HAN'`), ghi `LICH_SU_TRANG_THAI_SO`.
       5. Nếu nhận chuyển khoản vào `TAI_KHOAN_THANH_TOAN` $\rightarrow$ cộng `goc + lai` vào `so_du`.

### Component 3: `services/inquiry/` (`TraCuuVaQuanLySo`)
* **`inquiry.service.js` (`FR-05`):** Tìm sổ theo từ khóa (mã sổ / CCCD / họ tên). Nếu `KHACH_HANG`, tự động lọc ràng buộc `khach_hang_id = req.user.khachHangId`. Với mỗi sổ đang hoạt động, tự động gọi `interestService` gắn thêm `tienLaiTamTinh`.
* **`customer.service.js` (`FR-08`):** Danh sách, thêm mới và cập nhật hồ sơ khách hàng (kiểm tra trùng `so_cccd`, `email`).
* **`passbookStatus.service.js` (`FR-09`):** Kiểm tra ma trận chuyển trạng thái hợp lệ bằng State Machine:
  - `DANG_HOAT_DONG` $\rightarrow$ `{ PHONG_TOA, BAO_MAT }`
  - `PHONG_TOA` $\rightarrow$ `{ DANG_HOAT_DONG }` (Giải tỏa)
  - `BAO_MAT` $\rightarrow$ `{ DANG_HOAT_DONG }` (Cấp lại / Mở khóa)
  - `DA_TAT_TOAN` $\rightarrow$ `{}` (Không cho phép chuyển trạng thái nữa!)
  - Mọi chuyển đổi hợp lệ đều bắt buộc ghi `LICH_SU_TRANG_THAI_SO` kèm `ly_do` và `tai_khoan_thay_doi_id`.

### Component 4: `services/admin/` (`QuanTriVaTuDongHoa`)
* **`rateConfig.service.js` (`FR-12`):** Xem danh mục sản phẩm & biểu lãi suất; thêm kỳ hạn / cập nhật lãi suất mới (bắt buộc `laiSuat > 0`, không trùng kỳ hạn; đóng `hieu_luc_den` của biểu cũ để giữ lịch sử tính lãi cho các sổ mở trước đó).
* **`report.service.js` (`FR-10`):** Kiểm tra `tuNgay <= denNgay`, tổng hợp số liệu từ `SO_TIET_KIEM` & `GIAO_DICH_TIET_KIEM` (tổng số sổ, tổng thu mở mới, tổng chi tất toán, số lượng theo trạng thái). Trả về dữ liệu chuẩn cho UI hiển thị bảng và xuất CSV.
* **`notification.service.js` (`EX-02`):** Tạo nội dung SMS/Email từ mẫu, lưu `THONG_BAO` (`CHO_GUI`), gọi Gateway gửi tin (có adapter mock/SMTP thật tùy `.env`), nếu lỗi cập nhật `THAT_BAI` + `thu_lai_sau`, nếu thành công cập nhật `DA_GUI`.
* **`maturityJob.service.js` (`FR-13`):** Quét các sổ `DANG_HOAT_DONG` có `DATEDIFF(ngay_dao_han, CURDATE()) BETWEEN 0 AND 3` và chưa gửi nhắc hạn trong chu kỳ này $\rightarrow$ gọi `notification.service.js`.
* **`rolloverJob.service.js` (`FR-14`):** Quét các sổ `DANG_HOAT_DONG` có `ngay_dao_han <= CURDATE()`:
  - Nếu `chi_thi_dao_han === 'KHONG_TAI_TUC'`: bỏ qua và ghi log chờ xử lý thủ công.
  - Nếu `TAI_TUC_GOC_VA_LAI` hoặc `TAI_TUC_GOC_CHUYEN_LAI`: trong `withTransaction` tính lãi thực tế kỳ vừa qua, đóng chu kỳ `k`, tạo chu kỳ `k+1` với số tiền gốc mới + ngày đáo hạn mới + lãi suất hiệu hành tại ngày tái tục, ghi `GIAO_DICH_TIET_KIEM` (`TRA_LAI_DINH_KY` / tái tục).

---

## 6. Thiết kế Bộ Scheduler Tự động (`backend/jobs/scheduler.js`)

Phục vụ tác nhân **Hệ thống tự động (`Timer`)** trong `FR-13` và `FR-14`:
- Dùng `node-cron` chạy hàng ngày lúc `23:55` (cuối ngày giao dịch) cho `rolloverJob.run()` (`FR-14`) và `08:00` sáng cho `maturityJob.run()` (`FR-13`).
- Đồng thời cung cấp API kích hoạt thủ công (chỉ `ADMIN` / `KIEM_SOAT_VIEN`) tại `POST /api/jobs/maturity-scan` và `POST /api/jobs/rollover-run` để phục vụ màn hình Quản trị và buổi demo nghiệm thu đồ án mà không cần đợi qua đêm.
