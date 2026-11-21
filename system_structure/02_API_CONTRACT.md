# 🔌 Đặc tả Hợp đồng REST API (API Contract — FE ↔ BE)

> **Base URL (Local):** `http://localhost:3000/api`  
> **Xác thực:** JWT Bearer Token (`Authorization: Bearer <access_token>`)  
> **Content-Type:** `application/json; charset=utf-8`

---

## 1. Quy chuẩn Response Chung (Envelope Standard)

Mọi endpoint đều trả về cấu trúc JSON thống nhất để `frontend/js/api/client.js` xử lý tập trung:

* **Thành công (`200 OK`, `201 Created`):**
  ```json
  {
    "success": true,
    "message": "Mở sổ tiết kiệm thành công.",
    "data": { ... }
  }
  ```
* **Thất bại (`400`, `401`, `403`, `404`, `409`, `423`, `500`):**
  ```json
  {
    "success": false,
    "errorCode": "INSUFFICIENT_BALANCE",
    "message": "Số dư tài khoản thanh toán không đủ để mở sổ.",
    "details": null
  }
  ```

### Bảng Mã HTTP Status & `errorCode` Chuẩn
| HTTP | `errorCode` tiêu biểu | Ý nghĩa & Kịch bản tương ứng |
| :---: | :--- | :--- |
| `400` | `VALIDATION_ERROR`, `INSUFFICIENT_BALANCE`, `BELOW_MIN_AMOUNT`, `INVALID_STATUS_TRANSITION`, `INVALID_DATE_RANGE` | Sai định dạng đầu vào, không đủ số dư (`FR-03`), dưới mức tối thiểu, đổi trạng thái không hợp lệ (`FR-09`). |
| `401` | `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `UNAUTHORIZED` | Sai mật khẩu (`EX-01` < 5 lần), chưa đăng nhập hoặc token hết hạn. |
| `403` | `FORBIDDEN` | Vai trò hiện tại không có quyền thực hiện API này (`RBAC`). |
| `404` | `NOT_FOUND`, `CUSTOMER_PROFILE_REQUIRED` | Không tìm thấy mã sổ (`FR-05`), chưa có hồ sơ CCCD khi mở tại quầy (`FR-04`). |
| `409` | `DUPLICATE_ENTRY` | Trùng tên đăng nhập (`FR-11`), trùng CCCD/Email (`FR-08`, Đăng ký), trùng kỳ hạn (`FR-12`). |
| `423` | `ACCOUNT_LOCKED` | Tài khoản bị khóa tạm thời do nhập sai $\ge 5$ lần (`EX-01`). |

---

## 2. Danh mục Endpoints Chi tiết theo 17 Use Cases

### Nhóm 1: Xác thực, Hồ sơ & Quản trị Tài khoản (`FR-01`, `EX-01`, `FR-02`, `FR-11`)

| Use Case | Method & Path | Quyền truy cập | Request Body / Query | Response `data` |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET /api/health` | Public | — | `{ status, dbConnected, timestamp }` |
| **FR-01 / EX-01** | `POST /api/auth/login` | Public | `{ tenDangNhap, matKhau }` | `{ token, user: { taiKhoanId, nguoiDungId, hoTen, tenDangNhap, roles, permissions } }` |
| **Đăng ký online** | `POST /api/auth/register` | Public | `{ hoTen, soCccd, soDienThoai, email, tenDangNhap, matKhau }` | `{ taiKhoanId, tenDangNhap, role: "KHACH_HANG" }` |
| **FR-01** | `GET /api/auth/me` | Authenticated | Header JWT | Thông tin user + vai trò + số dư tài khoản thanh toán mặc định (nếu là KH) |
| **FR-02** | `GET /api/profile` | Authenticated | — | `{ hoTen, soCccd, ngaySinh, soDienThoai, email, diaChi, vaiTro }` |
| **FR-02** | `PUT /api/profile` | Authenticated | `{ hoTen, soDienThoai, email, diaChi }` *(khóa CCCD & role)* | Hồ sơ sau cập nhật |
| **FR-11** | `GET /api/accounts` | `ADMIN`, `KIEM_SOAT_VIEN` | — | Danh sách tài khoản kèm vai trò và trạng thái |
| **FR-11** | `POST /api/accounts` | `ADMIN`, `KIEM_SOAT_VIEN` *(trừ role `ADMIN`)* | `{ hoTen, email, soDienThoai, tenDangNhap, matKhau, vaiTro }` | Tài khoản vừa tạo |
| **FR-11** | `PATCH /api/accounts/:id` | `ADMIN`, `KIEM_SOAT_VIEN` *(trừ tài khoản `ADMIN`)* | `{ vaiTro, trangThai }` (`HOAT_DONG` / `KHOA_TAM_THOI`) | Tài khoản sau phân quyền |

---

### Nhóm 2: Giao dịch Tiết kiệm & Tính lãi (`FR-03`, `FR-04`, `FR-06`, `FR-07`, `EX-03`)

| Use Case | Method & Path | Quyền truy cập | Request Body / Query | Response `data` |
| :--- | :--- | :--- | :--- | :--- |
| **FR-03** | `GET /api/savings/payment-accounts` | `KHACH_HANG` | — | Danh sách `TAI_KHOAN_THANH_TOAN` và `so_du` thực tế |
| **FR-03** | `POST /api/savings/open-online` | `KHACH_HANG` | `{ kyHanId, taiKhoanNguonId, soTienGui, chiThiDaoHan }` | `{ maSo, soTienGoc, laiSuatApDung, ngayBatDau, ngayDaoHan, soDuConLai }` |
| **FR-04** | `POST /api/savings/open-counter` | `GIAO_DICH_VIEN`, `ADMIN` | `{ soCccd, kyHanId, soTienGui, chiThiDaoHan }` | `{ maSo, chuSo, soTienGoc, laiSuatApDung, ngayMo, ngayDaoHan, chungTuId }` |
| **FR-06** | `POST /api/interest/calculate` | Authenticated | `{ soTienGoc, kyHanId, laiSuatNam?, ngayBatDau, ngayTinhDen }` | `{ soNgayGui, laiSuatApDung, tienLaiDuKien, tongGocVaLai }` |
| **FR-07 / EX-03 (Bước 1)** | `POST /api/savings/:maSo/settlement-preview` | `KHACH_HANG` *(chính chủ)*, `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN` | `{ ngayTatToan }` *(mặc định hôm nay)* | `{ maSo, trangThai, isBeforeMaturity, canhBao, soNgayThucGui, tienGoc, laiSuatApDung, tienLai, tongTienNhan }` |
| **FR-07 / EX-03 (Bước 2)** | `POST /api/savings/:maSo/settlement-confirm` | `KHACH_HANG` *(chính chủ, chỉ `CHUYEN_KHOAN`)*, `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN` | `{ ngayTatToan, hinhThucNhan: "CHUYEN_KHOAN" \| "TAI_QUAY", taiKhoanNhanId? }` | `{ maSo, trangThai: "DA_TAT_TOAN", giaoDichId, tienGoc, tienLai, tongTienThucNhan, ngayTatToan }` |

> **Lưu ý nghiệp vụ `FR-03` & `FR-07`:**  
> - `chiThiDaoHan` nhận một trong 3 giá trị: `TAI_TUC_GOC_VA_LAI`, `TAI_TUC_GOC_CHUYEN_LAI`, `KHONG_TAI_TUC`.  
> - Mọi số tiền lãi và tổng nhận ở bước `settlement-confirm` đều do **Server tự tính lại trong Transaction**, tuyệt đối không lấy từ request body của Client.

---

### Nhóm 3: Tra cứu, Khách hàng & Trạng thái Sổ (`FR-05`, `FR-08`, `FR-09`)

| Use Case | Method & Path | Quyền truy cập | Request Body / Query | Response `data` |
| :--- | :--- | :--- | :--- | :--- |
| **FR-05** | `GET /api/savings` | Authenticated | `?q=<maSo\|cccd\|hoTen>&status=<trangThai>` | Danh sách sổ *(KH chỉ thấy sổ của mình)* kèm `tienLaiTamTinh` (`FR-06`) |
| **FR-05** | `GET /api/savings/:maSo` | Authenticated *(kiểm tra ownership nếu là KH)* | — | Chi tiết sổ + danh sách chu kỳ + lịch sử giao dịch + lịch sử trạng thái |
| **FR-08** | `GET /api/customers` | `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN` | `?cccd=<so_cccd>&q=<tuKhoa>` | Danh sách hồ sơ khách hàng |
| **FR-08** | `POST /api/customers` | `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN` | `{ hoTen, soCccd, ngaySinh, soDienThoai, email, diaChi }` | Khách hàng mới vừa tạo |
| **FR-08** | `PUT /api/customers/:id` | `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN` | `{ hoTen, soCccd, ngaySinh, soDienThoai, email, diaChi }` | Khách hàng sau cập nhật |
| **FR-09** | `PATCH /api/savings/:maSo/status` | `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN` | `{ trangThaiMoi, lyDo }` | `{ maSo, trangThaiCu, trangThaiMoi, lichSuId }` |

---

### Nhóm 4: Danh mục Lãi suất, Báo cáo & Tự động hóa (`FR-10`, `FR-12`, `FR-13`, `FR-14`, `EX-02`)

| Use Case | Method & Path | Quyền truy cập | Request Body / Query | Response `data` |
| :--- | :--- | :--- | :--- | :--- |
| **FR-12** | `GET /api/rates` | Authenticated *(cần để hiển thị bảng chọn khi mở sổ)* | — | Danh sách sản phẩm + kỳ hạn + biểu lãi suất hiện hành |
| **FR-12** | `POST /api/rates` | `KIEM_SOAT_VIEN`, `ADMIN` | `{ sanPhamId, thoiHan, donViThoiHan, loaiKyHan, laiSuatNam }` | Kỳ hạn & biểu lãi suất vừa tạo |
| **FR-12** | `PUT /api/rates/:kyHanId` | `KIEM_SOAT_VIEN`, `ADMIN` | `{ laiSuatNam, soTienToiThieu? }` | Biểu lãi suất mới hiệu lực từ `CURDATE()` |
| **FR-10** | `GET /api/reports` | `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN` | `?type=<...>&status=<...>&from=YYYY-MM-DD&to=YYYY-MM-DD` | `{ summary: { totalBooks, totalPrincipal, totalInterestPaid }, rows: [...] }` |
| **FR-13 / EX-02** | `GET /api/notifications` | `KIEM_SOAT_VIEN`, `ADMIN` *(hoặc KH xem tin của mình)* | — | Danh sách log `THONG_BAO` (`NHAC_DAO_HAN`, `BIEN_DONG_SO_DU`, `TAI_TUC_THANH_CONG`) |
| **FR-13** | `POST /api/jobs/maturity-scan` | `KIEM_SOAT_VIEN`, `ADMIN` | — | `{ scannedCount, sentCount, failedCount, details }` *(trigger tay cho demo/vận hành)* |
| **FR-14** | `POST /api/jobs/rollover-run` | `KIEM_SOAT_VIEN`, `ADMIN` | — | `{ dueCount, rolledOverCount, skippedCount, details }` *(trigger tay tái tục cuối ngày)* |
