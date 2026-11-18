# 📊 Báo cáo Chi tiết Toàn bộ Hệ thống — CoreSavings (Saving-Passbook Management)

> **Dự án:** Hệ thống Quản lý Sổ Tiết kiệm (`Saving-Passbook_Management`)  
> **Tech Stack:** Node.js + Express (`backend/`) · MySQL 8.0+ (`mysql2`) · HTML5 / CSS3 / Vanilla JS ES6+ Modules (`frontend/`)  
> **Phạm vi bao phủ:** 19 bảng CSDL · 17 Use Case (`FR-01`–`FR-14`, `EX-01`–`EX-03`) + Đăng ký online · Kiến trúc 3 tầng (`GUI` – `BLL` – `DAL`)

---

## PHẦN 1: TÀI LIỆU NGUỒN & CƠ SỞ THIẾT KẾ (ĐÃ DỰA VÀO ĐỂ XÂY DỰNG)

Toàn bộ mã nguồn và thiết kế của hệ thống được xây dựng dựa trên sự đối chiếu trực tiếp với các tài liệu gốc sau trong repository:

| Nhóm tài liệu | Đường dẫn thực tế | Vai trò đầu vào cho thiết kế & code |
| :--- | :--- | :--- |
| **Đặc tả Yêu cầu (Use Case)** | `docs/UseCase/Use case.docx` | Xác định 4 tác nhân người + 1 Scheduler và **17 Use Case** gom thành 4 phân hệ nghiệp vụ. |
| **Sơ đồ Hoạt động (Phân tích)** | `docs/Activity/*.png` (17 ảnh)<br>`docs/Activity/Activity_Diagram_Nhom_8.docx`<br>`docs/Activity/README_ACTIVITY_FRONTEND.md` | Quy định các bước nghiệp vụ, nhánh rẽ điều kiện, thông báo lỗi và checklist kiểm thử 17 luồng trên UI. |
| **Sơ đồ Tuần tự (Phân tích)** | `docs/Sequence/*.png` (17 ảnh) | Quy định chính xác tên đối tượng (`:GiaoDien...`, `:DieuKhien...`, `:DuLieu...`), thứ tự thông điệp và các nhánh `alt` (`5a`/`5b`...). |
| **Sơ đồ Lớp, Trạng thái & ERD** | `docs/Class/Bao_cao_so_do_lop_phan_tich.docx`<br>`docs/Sơ đồ ERD.drawio.png`<br>`docs/Bao_cao_so_do_trang_thai(1).docx`<br>`docs/Tong_hop_so_do_UML_quan_ly_so_tiet_kiem (1).docx` | Xác định lớp Boundary / Control / Entity, State Machine chuyển trạng thái sổ (`FR-09`) và quan hệ thực thể. |
| **Thiết kế Kiến trúc Chương 6** | `docs/design_documents/01_Prerequisites.md`<br>`docs/design_documents/02_Component_Deployment.md`<br>`docs/design_documents/03_Collaboration_Activity.md`<br>`docs/design_documents/Tuan_10.md` | Bộ tài liệu Chương 6 hoàn chỉnh gồm **36 sơ đồ PlantUML** (1 Component + 1 Deployment 2D + 17 Communication + 17 Design-level Activity 3 làn) kèm bảng truy vết 3 tầng. |
| **Cơ sở dữ liệu 19 bảng** | `backend/database/schema.sql` | Chuẩn hóa tên bảng, cột, khóa ngoại, kiểu dữ liệu `DECIMAL(15,2)`, cột `so_du` ở `TAI_KHOAN_THANH_TOAN` và `nhan_vien_mo_id NULL` cho mở sổ online. |
| **Bản thiết kế Kỹ thuật & Quy tắc** | `system_structure/00_README_OVERVIEW.md` $\rightarrow$ `06_ONE_WEEK_SPRINT_PLAN.md`<br>`.agents/rules/project-structure-guard.md` | Định nghĩa cấu trúc thư mục, REST API Contract, refactor Frontend, phân công nhóm và rào chắn kiến trúc 3 tầng. |

---

## PHẦN 2: KIỂM KÊ TOÀN BỘ NHỮNG GÌ ĐÃ LÀM & ĐÃ THIẾT KẾ

### 2.1. Tầng Cơ sở Dữ liệu (`backend/database/`)
- **`schema.sql`:** 19 bảng InnoDB hoàn chỉnh + dữ liệu mẫu khởi tạo (`admin`, `teller01`, `supervisor01`, `kh_mai`, 3 sổ mẫu `STK001090`–`STK001092`, sản phẩm, kỳ hạn, biểu lãi suất).
- **`seedPasswords.js`:** Script chạy qua `npm run seed` để cập nhật `bcrypt` hash thật cho 4 tài khoản mẫu (`Admin@123`, `Nhanvien@123`, `Quanly@123`, `Khachhang@123`).

### 2.2. Tầng Backend (`backend/` — 3 Tầng Nghiêm ngặt)
1. **Cấu hình & Hạ tầng (`config/`, `middlewares/`, `server.js`):**
   - `config/env.js`, `config/constants.js` (Enum đồng bộ `schema.sql`), `config/db.js` (`mysql2/promise` pool, `withTransaction()`, `testConnection()`), `.env.example`.
   - `middlewares/error.middleware.js` (`AppError`, `asyncHandler`, `notFoundHandler`, `errorHandler`), `auth.middleware.js` (JWT + kiểm tra trạng thái DB thật), `rbac.middleware.js` (`authorizeRoles`, `authorizePermissions`), `validate.middleware.js`.
   - `server.js`: Kích hoạt `helmet`, `cors`, static server cho `../frontend`, mount `/api`, global error handler và khởi chạy `startScheduler()`.
2. **Tầng DAL — Component `TruyCapDuLieu` (`backend/repositories/` — 6 file):**
   - `taiKhoan.repo.js` (`:DuLieuTaiKhoan`) · `hoSo.repo.js` (`:DuLieuHoSo`) · `khachHang.repo.js` (`:DuLieuKhachHang`) · `soTietKiem.repo.js` (`:DuLieuSoTietKiem`) · `laiSuat.repo.js` (`:DuLieuLaiSuat`) · `heThong.repo.js` (`:DuLieuHeThong`).
   - 100% sử dụng Prepared Statements (`?`), hỗ trợ nhận `conn` transaction và khóa dòng `SELECT ... FOR UPDATE`.
3. **Tầng BLL — 4 Component Nghiệp vụ (`backend/services/` — 14 file):**
   - **Nhóm 1 `account/` (`QuanLyTaiKhoan`):** `auth.service.js`, `user.service.js`, `adminAccount.service.js`.
   - **Nhóm 2 `transaction/` (`GiaoDichTietKiem`):** `savingsTx.service.js`, `interest.service.js`, `settlement.service.js`.
   - **Nhóm 3 `inquiry/` (`TraCuuVaQuanLySo`):** `inquiry.service.js`, `customer.service.js`, `passbookStatus.service.js`.
   - **Nhóm 4 `admin/` (`QuanTriVaTuDongHoa`):** `rateConfig.service.js`, `report.service.js`, `notification.service.js`, `maturityJob.service.js`, `rolloverJob.service.js`.
4. **Cổng HTTP & Tự động hóa (`controllers/`, `routes/`, `jobs/`):**
   - 6 Controllers (`auth`, `profile`, `savings`, `interest`, `customer`, `admin`) và 7 file Routes mount tại `/api`.
   - `jobs/scheduler.js` (`node-cron`) chạy tự động `FR-13` (`08:00`) và `FR-14` (`23:55`) + hỗ trợ kích hoạt tay qua API cho demo.
5. **Bộ Kiểm thử Tự động (`backend/tests/`):**
   - `batch1.test.js`, `batch2.test.js`, `batch3.test.js` (19 test cases dùng `node:test`).

### 2.3. Tầng Frontend (`frontend/` — Vanilla JS ES6 Modules)
- **`index.html` & `css/style.css`:** Nạp `js/main.js` dạng `type="module"`, giữ nguyên giao diện Responsive hiện đại, đã bổ sung style cho vị trí mới của **Nút Tài khoản** và **Nút Đăng xuất** trên cả Desktop và Mobile.
- **Lớp giao tiếp API & State (`js/api/`, `js/state/`):**
  - `client.js` (Fetch wrapper tự gắn `Bearer <token>`, tự bắn `auth:expired` khi `401`), `auth.api.js`, `savings.api.js`, `customer.api.js`, `admin.api.js`, `store.js`.
  - Đã loại bỏ hoàn toàn mật khẩu demo plaintext, `seedBooks` giả và `localStorage` mock nghiệp vụ.
- **Tiện ích & 6 Module Trang (`js/utils/`, `js/pages/`, `js/main.js`):**
  - `utils/`: `ui.js` (có `withButtonLoading` chống bấm đúp nút), `format.js` (tiền tệ VNĐ, ngày, nhãn trạng thái, xuất CSV), `validators.js`.
  - `pages/`: `auth.page.js`, `dashboard.page.js`, `openBook.page.js`, `savingsOps.page.js`, `staffMgmt.page.js`, `adminMgmt.page.js`.
  - `main.js`: Router điều phối 14 màn hình theo vai trò; **góc trên bên phải** là nút **Tài khoản (`#topbar-account`)** mở nhanh trang Hồ sơ, **đáy sidebar bên trái** là nút **Đăng xuất (`#logout`)**.

---

## PHẦN 3: CHI TIẾT TOÀN BỘ CÁC LUỒNG BÊN TRONG HỆ THỐNG

### 3.1. Luồng Khởi động & Chu trình Xử lý 1 Request Chuẩn
```text
[1. Trình duyệt tải index.html]
   └─► main.js chạy restoreSession(): đọc token ở localStorage -> GET /api/auth/me
       ├─► Không có / Hết hạn -> renderAuthScreen() (Đăng nhập / Đăng ký online)
       └─► Hợp lệ -> Lưu user + role vào store -> render() giao diện theo RBAC

[2. Mọi thao tác nghiệp vụ trên UI]
   └─► Page (pages/*.page.js) gọi hàm API (api/*.api.js) kèm withButtonLoading()
       └─► client.js gửi fetch('/api/...') + Header Authorization: Bearer <JWT>
           └─► Backend Express:
               helmet -> cors -> express.json -> rateLimit (nếu login)
               -> authenticate (jwt.verify + đọc lại DB kiểm tra trạng thái hoạt động/khóa)
               -> authorizeRoles (RBAC)
               -> validateBody (kiểm tra input)
               -> Controller -> Service (BLL + withTransaction) -> Repository (DAL SQL '?')
               -> MySQL -> JSON { success, message, data } (hoặc errorHandler -> { success: false, errorCode, message })
```

---

### 3.2. Luồng Nhóm 1: Xác thực, Khóa Bảo mật, Đăng ký & Tài khoản

1. **Đăng nhập & Khóa 5 lần (`FR-01`, `EX-01`) — `POST /api/auth/login`:**
   - Kiểm tra rate limit (`30 req / 15 phút`).
   - Đọc tài khoản từ `TAI_KHOAN_DANG_NHAP` + vai trò (`VAI_TRO`) + quyền (`QUYEN_TRUY_CAP`).
   - Nếu `trang_thai == 'NGUNG_HOAT_DONG'` $\rightarrow$ `403`. Nếu `'KHOA_TAM_THOI'` và `khoa_den > NOW()` $\rightarrow$ `423 ACCOUNT_LOCKED`.
   - So sánh `bcrypt.compare(matKhau, mat_khau_bam)`:
     - **Sai:** Tăng `so_lan_dang_nhap_sai`. Nếu đạt `>= 5` $\rightarrow$ cập nhật `trang_thai = 'KHOA_TAM_THOI'`, `khoa_den = NOW() + 15 phút` $\rightarrow$ trả `423`. Nếu `< 5` $\rightarrow$ trả `401` kèm số lần thử còn lại.
     - **Đúng:** Reset `so_lan_dang_nhap_sai = 0`, `khoa_den = NULL`, cập nhật `dang_nhap_cuoi = NOW()`, ký JWT (hạn `8h`), trả `token` + `user`.
2. **Đăng ký khách hàng trực tuyến — `POST /api/auth/register`:**
   - Kiểm tra trùng `ten_dang_nhap`, `email`, `so_dien_thoai`, `so_cccd` (`409 DUPLICATE_ENTRY`).
   - Hash mật khẩu bằng `bcryptjs` (`saltRounds = 10`).
   - Trong `withTransaction`: Insert đồng bộ 6 bản ghi vào `NGUOI_DUNG` $\rightarrow$ `KHACH_HANG` $\rightarrow$ `HO_SO_KHACH_HANG` $\rightarrow$ `TAI_KHOAN_DANG_NHAP` $\rightarrow$ `TAI_KHOAN_VAI_TRO` (ép cứng vai trò `KHACH_HANG`) $\rightarrow$ `TAI_KHOAN_THANH_TOAN` mặc định (`so_du = 0.00`).
3. **Hồ sơ cá nhân (`FR-02`) — `GET/PUT /api/profile`:**
   - Đọc từ `NGUOI_DUNG` + `HO_SO_KHACH_HANG` + `NHAN_VIEN`. Cho sửa `hoTen`, `email`, `soDienThoai`, `diaChi` (kiểm tra trùng email/SĐT), **khóa cứng `so_cccd` và vai trò**.
4. **Quản trị tài khoản & RBAC (`FR-11`) — `GET/POST /api/accounts`, `PATCH /api/accounts/:id`:**
   - `ADMIN` và `KIEM_SOAT_VIEN` xem danh sách; chỉ `ADMIN` được tạo mới tài khoản nội bộ (`NHAN_VIEN`/`ADMIN`), gán lại vai trò (`TAI_KHOAN_VAI_TRO`) hoặc khóa/mở khóa (chặn Admin tự khóa chính mình).

---

### 3.3. Luồng Nhóm 2: Core Banking Giao dịch Tiết kiệm & Tính lãi

1. **Mở sổ tiết kiệm Online (`FR-03` + `EX-02`) — `POST /api/savings/open-online`:**
   - Chỉ `KHACH_HANG` được gọi.
   - Đọc `KY_HAN_TIET_KIEM` + `SAN_PHAM_TIET_KIEM` + `BIEU_LAI_SUAT` hiệu lực $\rightarrow$ kiểm tra `soTienGui >= so_tien_toi_thieu` (`400 BELOW_MIN_AMOUNT`).
   - Trong `withTransaction`:
     1. Khóa dòng tài khoản thanh toán (`SELECT ... FOR UPDATE` trên `TAI_KHOAN_THANH_TOAN`).
     2. Kiểm tra `so_du >= soTienGui` (nếu thiếu $\rightarrow$ `400 INSUFFICIENT_BALANCE` + rollback).
     3. Trừ `so_du` tài khoản thanh toán nguồn.
     4. Tạo `SO_TIET_KIEM` (`nhan_vien_mo_id = NULL`, `trang_thai = 'DANG_HOAT_DONG'`), `CHU_KY_SO_TIET_KIEM` (chu kỳ 1, tính `ngay_dao_han`), `GIAO_DICH_TIET_KIEM` (`MO_SO`, kênh `INTERNET_BANKING`), `LICH_SU_TRANG_THAI_SO`.
   - Sau `COMMIT`: Gọi bất đồng bộ `sendOpenPassbookConfirmation` (`EX-02`) ghi nhận bảng `THONG_BAO` (lỗi gửi tin không làm rollback sổ đã mở).
2. **Mở sổ tiết kiệm Tại quầy (`FR-04`) — `POST /api/savings/open-counter`:**
   - Chỉ `GIAO_DICH_VIEN` hoặc `ADMIN` được gọi.
   - FE hỗ trợ tra nhanh `GET /api/customers?cccd=...` để tự điền họ tên khách hàng.
   - Backend kiểm tra bắt buộc tồn tại hồ sơ trong `HO_SO_KHACH_HANG` theo `so_cccd` (nếu chưa có $\rightarrow$ `404 CUSTOMER_PROFILE_REQUIRED`).
   - Kiểm tra hạn mức tối thiểu & trong `withTransaction` tạo `SO_TIET_KIEM` (gắn `nhan_vien_mo_id`), `CHU_KY_SO_TIET_KIEM`, `GIAO_DICH_TIET_KIEM` (kênh `TAI_QUAY`) và trả về `chungTuId`.
3. **Tính & Tra cứu tiền lãi (`FR-06`) — `POST /api/interest/calculate`:**
   - Kiểm tra `soTienGoc > 0`, `soNgayGui >= 0`, `laiSuatApDung >= 0`.
   - Áp dụng công thức chuẩn Core Banking:
     $$\text{Tiền lãi} = \text{round}\left(\text{Tiền gốc} \times \frac{\text{Lãi suất năm}}{100} \times \frac{\text{Số ngày thực gửi}}{365}\right)$$
4. **Tất toán sổ 2 bước (`FR-07` & `EX-03`):**
   - **Bước 1 (`POST /api/savings/:maSo/settlement-preview`):**
     - Kiểm tra quyền sở hữu (nếu `KHACH_HANG` chỉ xem sổ của mình), kiểm tra `trang_thai == 'DANG_HOAT_DONG'`.
     - Nếu `ngayTatToan < ngay_dao_han` (`EX-03`): tự lấy lãi suất `KHONG_KY_HAN` hiện hành (`0.15%/năm`), trả về cờ `isBeforeMaturity: true` + chuỗi `canhBao` mất lãi kỳ hạn.
     - Nếu đúng hạn hoặc sổ không kỳ hạn (`FR-07`): tính theo `lai_suat_ap_dung` của chu kỳ.
   - **Bước 2 (`POST /api/savings/:maSo/settlement-confirm`):**
     - Trong `withTransaction`: Khóa dòng `SO_TIET_KIEM` (`FOR UPDATE`) kiểm tra lại trạng thái `DANG_HOAT_DONG` (chống double-submit), **tự tính lại toàn bộ gốc + lãi phía Server**, đóng `ngay_ket_thuc` chu kỳ, chuyển `SO_TIET_KIEM.trang_thai = 'DA_TAT_TOAN'`, cộng tiền vào `TAI_KHOAN_THANH_TOAN` (nếu chọn chuyển khoản), ghi `GIAO_DICH_TIET_KIEM` (`TAT_TOAN`), `YEU_CAU_TAT_TOAN` (`DA_DUYET`) và `LICH_SU_TRANG_THAI_SO`.

---

### 3.4. Luồng Nhóm 3: Tra cứu, Khách hàng & Trạng thái Sổ

1. **Tra cứu thông tin sổ (`FR-05`) — `GET /api/savings` & `GET /api/savings/:maSo`:**
   - Nếu là `KHACH_HANG`: Server ép buộc lọc `khach_hang_id = req.user.khachHangId` (và chặn `403` nếu truy cập chi tiết sổ người khác).
   - Tự động tính & đính kèm `tienLaiTamTinh` đến ngày hiện tại cho các sổ `DANG_HOAT_DONG`; xem chi tiết trả thêm lịch sử giao dịch & lịch sử thay đổi trạng thái.
2. **Quản lý thông tin khách hàng (`FR-08`) — `GET/POST/PUT /api/customers`:**
   - Dành cho `GIAO_DICH_VIEN`, `KIEM_SOAT_VIEN`, `ADMIN`.
   - Kiểm tra trùng lặp `so_cccd`, `email`, `so_dien_thoai` (`409`). Khi tạo mới tự khởi tạo đồng bộ `NGUOI_DUNG`, `KHACH_HANG`, `HO_SO_KHACH_HANG`, và 1 `TAI_KHOAN_THANH_TOAN` mặc định.
3. **Quản lý trạng thái sổ (`FR-09`) — `PATCH /api/savings/:maSo/status`:**
   - Kiểm soát chặt theo **State Machine (`PASSBOOK_STATUS_TRANSITIONS`)**:
     - `DANG_HOAT_DONG` $\leftrightarrow$ `PHONG_TOA`
     - `DANG_HOAT_DONG` $\leftrightarrow$ `BAO_MAT`
     - `DA_TAT_TOAN` $\rightarrow$ **Cấm mọi chuyển đổi** (`400 INVALID_STATUS_TRANSITION`).
   - Bắt buộc có `lyDo` và lưu vết vào `LICH_SU_TRANG_THAI_SO`.

---

### 3.5. Luồng Nhóm 4: Danh mục Lãi suất, Báo cáo & Tự động hóa

1. **Quản lý danh mục & biểu lãi suất (`FR-12`) — `GET/POST /api/rates`, `PUT /api/rates/:kyHanId`:**
   - Bắt buộc `laiSuatNam > 0`, chống trùng kỳ hạn trong cùng sản phẩm. Khi cập nhật lãi suất mới, đóng `hieu_luc_den` của biểu cũ và chèn dòng `BIEU_LAI_SUAT` mới để bảo toàn lịch sử tính lãi cho các sổ đã mở trước đó.
2. **Báo cáo & Thống kê (`FR-10`) — `GET /api/reports`:**
   - Kiểm tra `to >= from` (`400 INVALID_DATE_RANGE`). Tổng hợp `totalBooks`, `totalPrincipal`, `totalDeposits`, `totalWithdrawnPrincipal`, `totalInterestPaid` và danh sách sổ chi tiết; Frontend xuất ra file `.csv` chuẩn UTF-8 BOM.
3. **Quét thông báo đáo hạn (`FR-13` & `EX-02`) — `Cron 08:00` / `POST /api/jobs/maturity-scan`:**
   - Lọc sổ `DANG_HOAT_DONG` có `DATEDIFF(ngay_dao_han, CURDATE()) BETWEEN 0 AND 3` chưa có thông báo `NHAC_DAO_HAN` thành công $\rightarrow$ gửi SMS/Email (`NOTIFY_MODE=mock|smtp`), ghi log `DA_GUI` hoặc `THAT_BAI` kèm `thu_lai_sau` (+15 phút) vào `THONG_BAO`.
4. **Tái tục sổ tự động cuối ngày (`FR-14`) — `Cron 23:55` / `POST /api/jobs/rollover-run`:**
   - Chạy trong `withTransaction` khóa các sổ `DANG_HOAT_DONG` có `ngay_dao_han <= CURDATE()`:
     - `KHONG_TAI_TUC`: Bỏ qua, giữ nguyên để xử lý thủ công.
     - `TAI_TUC_GOC_VA_LAI`: Tính lãi kỳ vừa xong, cộng dồn thành gốc mới = `goc + lai`, đóng chu kỳ cũ, ghi giao dịch `TRA_LAI_DINH_KY` và mở `CHU_KY_SO_TIET_KIEM` thứ `n+1` với lãi suất hiện hành & `ngay_dao_han` mới.
     - `TAI_TUC_GOC_CHUYEN_LAI`: Giữ nguyên `so_tien_goc`, cộng phần `tienLai` vào `TAI_KHOAN_THANH_TOAN` mặc định của khách và mở chu kỳ `n+1`.

---

## PHẦN 4: HIỆN TRẠNG KIỂM CHỨNG & LƯU Ý KHI TEST THỰC TẾ

### 4.1. Những gì đã được kiểm chứng trực tiếp bằng công cụ
1. **Kiểm tra cú pháp tĩnh (`node --check`):** Thông qua **100% file JS** (`47` file `backend/` + `16` file `frontend/js/`).
2. **Kiểm tra đồ thị nạp ES6 Module Frontend:** `import('./frontend/js/main.js')` thông suốt không lỗi thiếu file hay sai tên hàm export.
3. **Kiểm tra Unit Test Backend (`npm --prefix backend test`):** **19 / 19 tests PASS** (0 fail, 0 skip) trên 3 file `batch1.test.js`, `batch2.test.js`, `batch3.test.js` (dùng mock repository/connection để test độc lập từng rule nghiệp vụ, ACID rollback, State Machine, lockout 5 lần và tính lãi/tái tục).

### 4.2. Những bước cần test trực tiếp trên máy Local (có MySQL thật)
Do môi trường sandbox không mở kết nối TCP loopback (`127.0.0.1:3306` / port `3000`), các hạng mục sau cần bạn chạy kiểm thử trực tiếp trên máy thật:
1. Chạy `npm --prefix backend run seed` để cập nhật bcrypt hash cho 4 tài khoản mẫu (`admin`, `teller01`, `supervisor01`, `kh_mai`).
2. Chạy `npm --prefix backend run dev` và truy cập `http://localhost:3000/api/health` xác nhận `"dbConnected": true`.
3. Đăng nhập trên `http://localhost:3000/index.html` lần lượt cả 4 vai trò, kiểm tra toàn bộ **14 màn hình** và test trực tiếp các giao dịch ghi MySQL: mở sổ online (check trừ `so_du`), mở sổ tại quầy, tất toán trước hạn (`EX-03`), đổi trạng thái (`FR-09`), và bấm chạy thử `POST /api/jobs/rollover-run` trên sổ mẫu `STK001090`.
