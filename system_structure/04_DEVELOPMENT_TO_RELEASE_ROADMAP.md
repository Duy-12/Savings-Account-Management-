# 🚀 Lộ trình Hoàn thiện Từ Bắt đầu Đến Lúc Release Thực tế (Roadmap & Workflow)

> Tài liệu này tổng hợp quy trình làm việc cho cả nhóm 3 thành viên (Frontend UI/UX, DBA & Backend, Integration & Git Master) đi qua **6 giai đoạn** từ khi chuẩn bị môi trường đến khi đóng gói Release chạy ổn định trên thực tế (khớp với **Sơ đồ Triển khai 3-tier, 3-layer** trong Chương 6).

---

## 1. Phân công Vai trò & Quy trình Git Flow cho 3 Thành viên

| Thành viên | Sở hữu chính trong `system_structure/` | Nhánh làm việc (`feature/*`) |
| :--- | :--- | :--- |
| **TV1 — Frontend UI/UX** | `frontend/js/pages/`, `frontend/js/utils/`, `frontend/css/` | `feature/fe-modularize`, `feature/fe-ui-polish` |
| **TV2 — DBA & Backend** | `backend/database/`, `backend/repositories/`, `backend/services/`, `backend/jobs/` | `feature/be-auth-core`, `feature/be-transactions`, `feature/be-jobs-reports` |
| **TV3 — Integration & Git Master** | `backend/routes/`, `backend/controllers/`, `backend/middlewares/`, `frontend/js/api/`, kiểm thử tích hợp & release | `feature/api-contract`, `feature/integration-all`, `release/v1.0.0` |

**Quy chuẩn phối hợp Git:**
1. Luôn nhánh từ `develop` (hoặc `main` sau khi chốt khung): `git checkout -b feature/<ten-chuc-nang>`.
2. Không commit thẳng vào `main`, không commit `.env`, `node_modules/`, `config/db.config.js`.
3. Mỗi Pull Request (PR) bắt buộc vượt qua checklist: Không lỗi syntax, không hardcode mật khẩu/secret, đã test endpoint trên Postman/Thunder Client và trên giao diện trình duyệt.

---

## 2. Lộ trình Thực thi Theo Giai đoạn (Phase 0 → Phase 6)

### 🔹 Phase 0: Chuẩn bị Môi trường, Thư viện & Đồng bộ Database (Ngày 1)
- [ ] **Cài đặt dependencies bổ sung cho Backend (`backend/`):**
  ```bash
  cd backend
  npm install bcryptjs jsonwebtoken node-cron helmet express-rate-limit
  ```
- [ ] **Tạo file cấu hình môi trường:**
  - Tạo `backend/.env` (từ `.env.example`): `PORT=3000`, `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=...`, `DB_NAME=quan_ly_so_tiet_kiem`, `JWT_SECRET=<chuỗi_bí_mật_mạnh>`, `JWT_EXPIRES_IN=8h`, `NODE_ENV=development`.
- [ ] **Khởi tạo & Sửa đồng bộ Hash mật khẩu Database (`backend/database/`):**
  - Chạy `schema.sql` vào MySQL Server 8.0+.
  - **Việc bắt buộc:** Chạy script `seedPasswords.js` bằng `bcryptjs` để cập nhật cột `mat_khau_bam` của 4 tài khoản mẫu (`admin` $\rightarrow$ `Admin@123`, `teller01` $\rightarrow$ `Nhanvien@123`, `supervisor01` $\rightarrow$ `Quanly@123`, `kh_mai` $\rightarrow$ `Khachhang@123`), vì hash mẫu ban đầu trong `schema.sql` chỉ là chuỗi minh họa.
- [ ] **Dựng lõi Hạ tầng (`backend/config/db.js`, `middlewares/error.middleware.js`):**
  - Test `GET /api/health` trả về `dbConnected: true`.

---

### 🔹 Phase 1: Xác thực, Bảo mật RBAC & Hồ sơ (`FR-01`, `EX-01`, `FR-02`, `FR-11`)
- [ ] **Backend (`TV2` + `TV3`):**
  - Cài đặt `taiKhoan.repo.js` (`layThongTinTaiKhoan`, `tangSoLanNhapSai`, `khoaTaiKhoan`), `hoSo.repo.js`.
  - Cài đặt `auth.service.js`: xác thực `bcrypt`, đếm sai 5 lần tự khóa 15 phút (`EX-01`), phát hành JWT, API `POST /api/auth/register`.
  - Cài đặt `auth.middleware.js` & `rbac.middleware.js` kiểm tra vai trò thật từ DB.
  - Cài đặt `user.service.js` (`FR-02`) & `adminAccount.service.js` (`FR-11`).
- [ ] **Frontend (`TV1` + `TV3`):**
  - Tách `frontend/js/main.js` thành cấu trúc ES6 modules (`api/client.js`, `state/store.js`, `pages/auth.page.js`, `pages/dashboard.page.js`).
  - Nối Login + Đăng ký online + Profile + Quản lý tài khoản vào API thật; xóa bỏ mật khẩu demo hardcode khỏi FE.
- [ ] **Cột mốc kiểm tra (Checkpoint 1):** Đăng nhập bằng cả 4 tài khoản từ DB thật, thử nhập sai 5 lần xác nhận MySQL ghi `trang_thai = 'KHOA_TAM_THOI'` và trả về HTTP `423`.

---

### 🔹 Phase 2: Danh mục Lãi suất, Công cụ Tính lãi & Khách hàng (`FR-12`, `FR-06`, `FR-08`)
- [ ] **Backend (`TV2`):**
  - Cài đặt `laiSuat.repo.js` + `rateConfig.service.js` (`FR-12`): đọc/thêm kỳ hạn/cập nhật biểu lãi suất mới theo lịch sử `hieu_luc_tu`/`hieu_luc_den`.
  - Cài đặt `interest.service.js` (`FR-06`): hàm tính lãi chuẩn Core Banking dùng chung cho cả tra cứu lẫn tất toán.
  - Cài đặt `khachHang.repo.js` + `customer.service.js` (`FR-08`): quản lý hồ sơ CCCD, kiểm tra trùng lặp.
- [ ] **Frontend (`TV1` + `TV3`):**
  - Nối các màn hình `rates`, `interest`, `customers` vào API thật.
- [ ] **Cột mốc kiểm tra (Checkpoint 2):** Thêm một kỳ hạn mới ở màn hình Quản lý $\rightarrow$ chuyển sang màn hình Mở sổ thấy ngay kỳ hạn và lãi suất mới từ MySQL.

---

### 🔹 Phase 3: Nghiệp vụ Cốt lõi Giao dịch Tiết kiệm & Transaction ACID (`FR-03`, `FR-04`, `FR-05`, `FR-07`, `EX-03`, `FR-09`)
- [ ] **Backend (`TV2` + `TV3`):**
  - Cài đặt `soTietKiem.repo.js` hỗ trợ truyền `conn` cho Transaction và `SELECT ... FOR UPDATE`.
  - Cài đặt `savingsTx.service.js`:
    - `FR-03` Mở online: khóa dòng `TAI_KHOAN_THANH_TOAN`, kiểm tra số dư & mức tối thiểu, trừ tiền + tạo `SO_TIET_KIEM` + `CHU_KY_SO_TIET_KIEM` + `GIAO_DICH_TIET_KIEM` trong `withTransaction`.
    - `FR-04` Mở tại quầy: kiểm tra hồ sơ CCCD hợp lệ, ghi `nhan_vien_mo_id`, kênh `TAI_QUAY`.
  - Cài đặt `inquiry.service.js` (`FR-05`) & `passbookStatus.service.js` (`FR-09`) có State Machine và ghi `LICH_SU_TRANG_THAI_SO`.
  - Cài đặt `settlement.service.js` (`FR-07` & `EX-03`): tách 2 endpoint `/settlement-preview` (cảnh báo mất lãi nếu trước hạn) và `/settlement-confirm` (Transaction đóng sổ, cộng tiền tài khoản, ghi `YEU_CAU_TAT_TOAN` + `GIAO_DICH_TIET_KIEM`).
- [ ] **Frontend (`TV1` + `TV3`):**
  - Nối `openBook.page.js`, `savingsOps.page.js`, `staffMgmt.page.js` (sửa lỗi lọc cứng `'Trần Thị Mai'` ở `dashboard`).
- [ ] **Cột mốc kiểm tra (Checkpoint 3):** Mở sổ online cho `kh_mai` 20.000.000đ $\rightarrow$ kiểm tra bảng `TAI_KHOAN_THANH_TOAN.so_du` giảm đúng từ `150.000.000` còn `130.000.000`, `SO_TIET_KIEM` & `GIAO_DICH_TIET_KIEM` tăng thêm 1 bản ghi.

---

### 🔹 Phase 4: Tự động hóa, Thông báo & Báo cáo (`FR-13`, `EX-02`, `FR-14`, `FR-10`)
- [ ] **Backend (`TV2`):**
  - Cài đặt `notification.service.js` (`EX-02`) + `heThong.repo.js`: tạo tin nhắn, ghi `THONG_BAO`, giả lập hoặc gửi SMTP thật (có cấu hình fallback queue `THAT_BAI` + `thu_lai_sau`).
  - Cài đặt `maturityJob.service.js` (`FR-13`) & `rolloverJob.service.js` (`FR-14` tái tục sang chu kỳ `so_thu_tu_chu_ky + 1` trong `withTransaction`).
  - Cài đặt `jobs/scheduler.js` (`node-cron`) + API trigger thủ công cho màn hình Admin.
  - Cài đặt `report.service.js` (`FR-10`) tổng hợp số liệu từ SQL.
- [ ] **Frontend (`TV1` + `TV3`):**
  - Nối `adminMgmt.page.js` (`reports`, `notifications`, `rollover`).
- [ ] **Cột mốc kiểm tra (Checkpoint 4):** Thử chạy `POST /api/jobs/rollover-run` với sổ `STK001090` (ngày đáo hạn `2026-11-01` trong `schema.sql`) $\rightarrow$ xác nhận sinh chu kỳ 2 với gốc mới = `50.000.000 + lãi`!

---

### 🔹 Phase 5: Kiểm thử Tổng thể, Chống Lỗi Đồng thời & Hardening
1. **Kiểm thử Nghiệp vụ (UAT Matrix):** Chạy hết **17 kịch bản kiểm thử** đối chiếu với [`docs/Activity/README_ACTIVITY_FRONTEND.md`](../docs/Activity/README_ACTIVITY_FRONTEND.md).
2. **Kiểm thử Toàn vẹn Dữ liệu (ACID & Concurrency):**
   - Gửi đồng thời 2 request `open-online` có tổng tiền vượt quá `so_du` $\rightarrow$ nhờ `SELECT ... FOR UPDATE`, 1 request thành công và request thứ 2 bắt buộc bị từ chối `INSUFFICIENT_BALANCE` (số dư tuyệt đối không âm!).
   - Gửi đồng thời 2 request `settlement-confirm` cho cùng 1 mã sổ $\rightarrow$ chỉ 1 lần thành công, lần 2 báo lỗi sổ đã tất toán.
3. **Kiểm thử Bảo mật trước Release:**
   - Gắn `helmet()`, `express-rate-limit` cho `/api/auth/login`.
   - Test truy cập API Admin/Teller bằng JWT của `KHACH_HANG` $\rightarrow$ bắt buộc trả `403 Forbidden`.
   - Kiểm tra 100% SQL ở `repositories/` dùng dấu `?` (Prepared Statement), không cộng chuỗi chống SQL Injection.

---

### 🔹 Phase 6: Đóng gói & Release Thực tế (Production Deployment)

Đối chiếu với **Sơ đồ Triển khai Chương 6** ([`Tuan_10.md` — Phần 2](../docs/design_documents/Tuan_10.md#phần-2-sơ-đồ-triển-khai-deployment-diagram)), quy trình đưa hệ thống lên môi trường chạy thật gồm 5 bước:

1. **Tầng Database (`Máy chủ CSDL`):**
   - Tạo user MySQL riêng cho ứng dụng (chỉ cấp quyền `SELECT, INSERT, UPDATE, DELETE` trên `quan_ly_so_tiet_kiem`, không dùng `root`).
   - Bật lịch sao lưu tự động hàng ngày (`mysqldump` trước giờ chạy job `23:55`).
2. **Tầng Ứng dụng (`Máy chủ ứng dụng`):**
   - Cấu hình `.env` production (`NODE_ENV=production`, `JWT_SECRET` ngẫu nhiên 64 ký tự, tắt log stack trace chi tiết trả về client).
   - Chạy tiến trình Node.js bằng trình quản lý tiến trình **PM2** (`pm2 start server.js --name coresavings-api` kèm `pm2 save` tự khởi động lại khi server reboot) hoặc đóng gói **Docker / Docker Compose** (`app` + `mysql`).
3. **Reverse Proxy & HTTPS (`Internet, HTTPS` / `LAN, TCP/IP`):**
   - Đặt **Nginx** phía trước để cấp chứng chỉ **SSL/TLS (HTTPS)** cho cổng giao dịch trực tuyến (`CongTraCuu`), chặn truy cập trực tiếp từ Internet vào cổng MySQL `3306` (chỉ mở `3306` nội bộ qua LAN/Docker network).
4. **Smoke Test sau khi Release:**
   - Kiểm tra `GET /api/health` trả `200 OK` qua HTTPS.
   - Chạy 1 luồng kiểm tra nhanh trên production/staging: Đăng nhập $\rightarrow$ Tra cứu sổ $\rightarrow$ Tính lãi $\rightarrow$ Kiểm tra log PM2 không có unhandled exception.
5. **Bàn giao & Nghiệm thu:**
   - Tag phiên bản release trên Git: `git tag -a v1.0.0 -m "Release CoreSavings v1.0.0"`.
   - Cập nhật [`README.md`](../README.md) với hướng dẫn cài đặt biến môi trường `.env` và chạy script `seedPasswords.js`.
