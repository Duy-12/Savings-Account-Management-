# 👥 Kịch bản Phân việc Chi tiết cho 3 Thành viên (Từ Khởi tạo Đến Release)

> Tài liệu này chia nhỏ khối lượng công việc của bộ khung trong `system_structure/` thành **3 luồng làm việc song song không xung đột file**, có lịch trình đồng bộ (handoff) và tiêu chí nghiệm thu rõ ràng cho từng người.

---

## 1. Bức tranh Phân chia Sở hữu File (Zero Merge Conflict)

| Thành viên | Vai trò trong dự án | Thư mục / File sở hữu độc quyền | Nhánh Git (`feature/*`) |
| :--- | :--- | :--- | :--- |
| **Bạn (Tôi)** | **Tech Lead, Integration & Git Master** | • `backend/.env.example`, `backend/package.json`, `backend/server.js`<br>• `backend/config/` (`env.js`, `db.js`, `constants.js`)<br>• `backend/middlewares/` (Auth, RBAC, Validate, Error)<br>• `backend/routes/*` & `backend/controllers/*`<br>• `frontend/js/api/*` & `frontend/js/state/store.js` | `develop`<br>`feature/core-infra`<br>`feature/api-controllers`<br>`feature/fe-api-bridge` |
| **Thành viên 1 (FE)** | **Frontend UI/UX** | • `frontend/index.html`, `frontend/css/style.css`<br>• `frontend/js/main.js` (router)<br>• `frontend/js/utils/` (`format.js`, `validators.js`, `ui.js`)<br>• `frontend/js/pages/` (6 module màn hình tách từ `main.js`) | `feature/fe-modularize`<br>`feature/fe-api-pages` |
| **Thành viên 2 (BE/DBA)** | **DBA & Backend Logic** | • `backend/database/` (`schema.sql`, `seedPasswords.js`)<br>• `backend/repositories/` (6 file DAL tương ứng `:DuLieu...`)<br>• `backend/services/` (4 nhóm Component BLL)<br>• `backend/jobs/scheduler.js` (`FR-13`, `FR-14`) | `feature/db-dal`<br>`feature/be-bll-core`<br>`feature/be-jobs-reports` |

> **Nguyên tắc vàng:**  
> - **TV2 (BE)** chỉ làm việc từ tầng `services/` trở xuống `database/` (nhận tham số thuần JS, trả object hoặc ném `AppError`, không đụng `req`/`res`).  
> - **Bạn** làm phần "vỏ giao tiếp" ở giữa (`routes/` + `controllers/` + `middlewares/`) và cầu nối `frontend/js/api/` ở FE.  
> - **TV1 (FE)** tách giao diện vào `pages/` và gọi hàm từ `frontend/js/api/` của Bạn, không viết `fetch()` rải rác trong file UI.

---

## 2. Kịch bản Phân việc Chi tiết Từng Người theo Từng Chặng

### 🟦 CHẶNG 1: Khởi tạo Hạ tầng & Đăng nhập / Bảo mật (Ngày 1–2)
**Mục tiêu:** Chạy được MySQL + đăng nhập thật từ DB cho 4 vai trò (`FR-01`, `EX-01`, `FR-02`, `FR-11`, Đăng ký online).

* **Việc của Bạn (Lead & Integration):**
  1. Tạo nhánh `develop` từ `main`; chia sẻ file `backend/.env.example` cho nhóm tạo `.env` cục bộ.
  2. Cài thêm package trong `backend/`: `npm install bcryptjs jsonwebtoken node-cron helmet express-rate-limit`.
  3. Viết `backend/config/env.js`, `config/constants.js`, `config/db.js` (kèm `withTransaction`) và nâng cấp `GET /api/health` kiểm tra kết nối MySQL thật.
  4. Viết `middlewares/error.middleware.js`, `auth.middleware.js`, `rbac.middleware.js`, `validate.middleware.js`.
  5. Viết `auth.routes.js`, `profile.routes.js`, `auth.controller.js`, `profile.controller.js`.
  6. Viết khung `frontend/js/api/client.js`, `auth.api.js` và `frontend/js/state/store.js`.
  7. Review & merge PR của TV1 và TV2 vào `develop`.

* **Việc của Thành viên 2 (BE & DBA):**
  1. Import `backend/database/schema.sql` vào MySQL, viết script `backend/database/seedPasswords.js` dùng `bcryptjs` cập nhật đúng mật khẩu cho 4 user demo (`admin`, `teller01`, `supervisor01`, `kh_mai`).
  2. Viết `repositories/taiKhoan.repo.js` (`layThongTinTaiKhoan`, `tangSoLanNhapSai`, `khoaTaiKhoan`, `resetNhapSai...`, `truyVanTatCaTaiKhoan`, `taoTaiKhoanVaGanVaiTro`, `capNhatTrangThai`).
  3. Viết `repositories/hoSo.repo.js` (`truyVanHoSo`, `capNhatHoSo`).
  4. Viết `services/account/auth.service.js` (`login` xử lý khóa 5 lần sai `EX-01`, `registerCustomer` transaction tạo đủ 6 bảng), `user.service.js` (`FR-02`), `adminAccount.service.js` (`FR-11`).

* **Việc của Thành viên 1 (FE):**
  1. Cập nhật `frontend/index.html` sang `<script type="module" src="js/main.js">`.
  2. Tách phần tiện ích từ `frontend/js/main.js` hiện tại sang `utils/format.js`, `utils/validators.js`, `utils/ui.js`.
  3. Tách `auth.page.js` (Đăng nhập + Đăng ký online) và `dashboard.page.js` (Tổng quan + Hồ sơ cá nhân).
  4. Xóa bỏ hoàn toàn mảng `state.accounts` (chứa mật khẩu plaintext) và bộ đếm `cs_login_fail_*` trên `localStorage`; thay bằng gọi `authApi.login()`, `authApi.register()`, `authApi.getProfile()`, `authApi.updateProfile()`.
  5. Sửa dòng hardcode `'Trần Thị Mai'` trong `dashboard()` thành dữ liệu từ `store.user`.

* **✅ Nghiệm thu Chặng 1:** Đăng nhập thành công cả 4 tài khoản từ MySQL; thử sai 5 lần trả HTTP `423 Locked`; đăng ký tài khoản khách hàng mới lưu thật vào 6 bảng trong MySQL.

---

### 🟩 CHẶNG 2: Danh mục, Khách hàng & Giao dịch Tiết kiệm Cốt lõi (Ngày 3–5)
**Mục tiêu:** Chạy trọn vẹn mở sổ online/tại quầy, tính lãi, tra cứu, tất toán & trạng thái sổ (`FR-03` $\rightarrow$ `FR-09`, `EX-03`).

* **Việc của Bạn (Lead & Integration):**
  1. Viết `routes/` & `controllers/` cho: `savings` (`open-online`, `open-counter`, `payment-accounts`, `search/detail`, `settlement-preview`, `settlement-confirm`, `status`), `interest` (`calculate`), `customers`, `rates` (`GET/POST/PUT`).
  2. Viết `frontend/js/api/savings.api.js`, `customer.api.js`, và phần `rates` trong `admin.api.js`.
  3. Dùng Postman/Thunder Client kiểm thử trước các ca khó: không đủ số dư (`FR-03`), thiếu hồ sơ CCCD (`FR-04`), tất toán trước hạn (`EX-03`), đổi trạng thái sai quy tắc (`FR-09`), double-submit `settlement-confirm`.

* **Việc của Thành viên 2 (BE & DBA):**
  1. Viết `repositories/laiSuat.repo.js`, `khachHang.repo.js`, `soTietKiem.repo.js` (có `FOR UPDATE` ở tài khoản thanh toán & sổ tiết kiệm).
  2. Viết `services/transaction/interest.service.js` (`FR-06`).
  3. Viết `services/transaction/savingsTx.service.js` (`FR-03` trừ tiền + tạo sổ trong `withTransaction`; `FR-04` mở tại quầy).
  4. Viết `services/transaction/settlement.service.js` (`FR-07` & `EX-03`: 2 hàm `previewSettlement` và `confirmSettlement` tính lại tiền phía server).
  5. Viết `services/inquiry/`: `inquiry.service.js` (`FR-05`), `customer.service.js` (`FR-08`), `passbookStatus.service.js` (`FR-09` với State Machine + ghi `LICH_SU_TRANG_THAI_SO`).

* **Việc của Thành viên 1 (FE):**
  1. Tách `pages/openBook.page.js` (`FR-03` online + `FR-04` tại quầy):
     - Nạp danh sách kỳ hạn từ API `/rates` và tài khoản thanh toán thật từ `/savings/payment-accounts`.
     - Tại quầy: thêm nút tìm nhanh theo CCCD gọi API `/customers?cccd=...`, tự điền họ tên khách.
     - Vô hiệu hóa nút bấm khi đang `await` API để tránh bấm 2 lần.
  2. Tách `pages/savingsOps.page.js` (`FR-05` tra cứu, `FR-06` tính lãi, `FR-07/EX-03` tất toán 2 bước `preview` $\rightarrow$ `confirm`).
  3. Tách `pages/staffMgmt.page.js` (`FR-08` khách hàng, `FR-09` trạng thái sổ có đồng bộ enum trạng thái `DANG_HOAT_DONG`, `PHONG_TOA`, `BAO_MAT`, `DA_TAT_TOAN`).

* **✅ Nghiệm thu Chặng 2:** Mở sổ online trừ đúng `so_du` trong `TAI_KHOAN_THANH_TOAN`; tất toán trước hạn hiển thị đúng cảnh báo lãi `0.15%/năm` từ Server; số dư không bao giờ âm khi test 2 request song song.

---

### 🟨 CHẶNG 3: Báo cáo, Thông báo, Tái tục Tự động & Release (Ngày 6–7)
**Mục tiêu:** Hoàn thiện Cron Job, Thông báo, Báo cáo (`FR-10`, `FR-12`, `FR-13`, `FR-14`, `EX-02`), Hardening & đóng gói Release.

* **Việc của Thành viên 2 (BE & DBA):**
  1. Viết `repositories/heThong.repo.js` (`tongHopDuLieuBaoCao`, `THONG_BAO`).
  2. Viết `services/admin/`: `rateConfig.service.js` (`FR-12`), `report.service.js` (`FR-10`), `notification.service.js` (`EX-02` hỗ trợ `NOTIFY_MODE=mock|smtp` + retry queue), `maturityJob.service.js` (`FR-13`), `rolloverJob.service.js` (`FR-14`).
  3. Viết `backend/jobs/scheduler.js` (`node-cron`) và gắn vào `server.js` (chỉ bật khi `ENABLE_CRON_JOBS=true`).

* **Việc của Thành viên 1 (FE):**
  1. Tách `pages/adminMgmt.page.js` (`reports`, `accounts`, `rates`, `notifications`, `rollover`).
  2. Nối nút xuất CSV ở Báo cáo vào dữ liệu API `/reports`, nối nút chạy thử Job (`POST /api/jobs/maturity-scan`, `POST /api/jobs/rollover-run`) và hiển thị bảng kết quả rõ ràng.
  3. Kiểm tra Responsive trên desktop/tablet/mobile cho toàn bộ 14 màn hình sau khi refactor.

* **Việc của Bạn (Lead, Integration & Release):**
  1. Viết `admin.routes.js` & `admin.controller.js` (`/accounts`, `/rates`, `/reports`, `/notifications`, `/jobs/*`) và `frontend/js/api/admin.api.js`.
  2. Gắn `helmet()` và `express-rate-limit` cho `/api/auth/login` trong `server.js`.
  3. Chạy kiểm thử toàn bộ **17 kịch bản UAT** trong `docs/Activity/README_ACTIVITY_FRONTEND.md` và kiểm tra RBAC (đảm bảo `KHACH_HANG` không gọi được API của Nhân viên/Admin).
  4. Merge `develop` $\rightarrow$ `main`, cập nhật `README.md`, tạo tag `v1.0.0`, chạy thử đóng gói Production (`PM2` + `.env` production + backup DB `mysqldump`).

---

## 3. Quy ước Đồng bộ Nhanh Khi Giao tiếp Giữa 3 Người

1. **Khi TV2 hoàn thành 1 Service/Repo:** Nhắn lên nhóm theo mẫu: *"Đã xong `auth.service.js` trên nhánh `feature/be-bll-core`, nhận `(tenDangNhap, matKhau)`, trả về `{ token, user }`, lỗi ném `AppError(423, 'ACCOUNT_LOCKED')`."*
2. **Khi Bạn hoàn thành Endpoint & `frontend/js/api/*.api.js`:** Mở PR vào `develop` và báo TV1: *"Đã có `authApi.login(tenDangNhap, matKhau)` trả Promise JSON chuẩn, TV1 gắn vào `auth.page.js`."*
3. **Mỗi tối cuối ngày (15 phút):** Cả 3 người cùng pull `develop` mới nhất về nhánh của mình để kiểm tra app chạy thông suốt từ UI $\rightarrow$ API $\rightarrow$ MySQL.
