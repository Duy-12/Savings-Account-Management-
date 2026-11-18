# 🏗️ System Structure — Tổng quan Kiến trúc Codebase & Phân tích Hiện trạng

> **Dự án:** Hệ thống Quản lý Sổ Tiết kiệm (`Saving-Passbook_Management` / **CoreSavings**)  
> **Tech Stack:** Node.js + Express (Backend) · MySQL 8.0+ (Database) · HTML5/CSS3/Vanilla JS ES6+ (Frontend)  
> **Căn cứ thiết kế:**  
> - Tài liệu kiến trúc Chương 6: [`docs/design_documents/01_Prerequisites.md`](../docs/design_documents/01_Prerequisites.md), [`Tuan_10.md`](../docs/design_documents/Tuan_10.md)  
> - Cơ sở dữ liệu 19 bảng: [`backend/database/schema.sql`](../backend/database/schema.sql)  
> - Giao diện hiện có: [`frontend/index.html`](../frontend/index.html), [`frontend/css/style.css`](../frontend/css/style.css), [`frontend/js/main.js`](../frontend/js/main.js)

---

## 1. Mục đích của Thư mục `system_structure/`

Bộ tài liệu này đóng vai trò **bản thiết kế kỹ thuật (Engineering Blueprint)** chuyển hóa toàn bộ các sơ đồ UML (Use Case, Activity, Sequence, Class Phân tích, Component, Deployment, Collaboration) thành **cấu trúc mã nguồn thực tế**, giúp cả nhóm 3 thành viên nắm rõ:
1. Code được tổ chức vào những thư mục/file nào để giữ đúng kiến trúc **3 tầng (`GUI` – `BLL` – `DAL`)**.
2. Hợp đồng giao tiếp **REST API** giữa Frontend và Backend.
3. Cách nâng cấp từ bản **Frontend demo (`localStorage`)** sang **hệ thống thật kết nối MySQL**.
4. Lộ trình từng bước từ **lúc khởi tạo code đến khi Release Production**.

---

## 2. Đánh giá Hiện trạng Codebase (As-Is) vs. Mục tiêu Release (To-Be)

| Thành phần | Hiện trạng đã có trong Repo (As-Is) | Khoảng trống cần hoàn thiện để Release (Gap) |
| :--- | :--- | :--- |
| **Database (`backend/database/schema.sql`)** | Đã có đủ **19 bảng InnoDB** chuẩn Core Banking + Seed data (`admin`, `teller01`, `supervisor01`, `kh_mai`, `STK001090`–`STK001092`). | • Mật khẩu hash mẫu trong `TAI_KHOAN_DANG_NHAP` đang dùng chung 1 chuỗi placeholder `$2b$10$EixZa...`, cần script seed chuẩn khớp mật khẩu thật (`Admin@123`, `Nhanvien@123`, `Quanly@123`, `Khachhang@123`) bằng `bcryptjs`.<br>• Bổ sung index cho các cột hay tra cứu (`ma_so`, `ngay_dao_han`, `trang_thai`) nếu dữ liệu lớn. |
| **Frontend (`frontend/`)** | Đã hoàn thiện UI Responsive + **14 màn hình** trong `js/main.js` (đăng nhập, đăng ký online, dashboard, hồ sơ, mở sổ online/quầy, tra cứu, tính lãi, tất toán, khách hàng, trạng thái sổ, báo cáo CSV, tài khoản, lãi suất, thông báo, tái tục). | • Toàn bộ đang chạy **mô phỏng trên RAM/`localStorage`**, chứa sẵn mật khẩu demo plaintext trong JS.<br>• `dashboard()` đang lọc cứng `Trần Thị Mai` khi là `KHACH_HANG`.<br>• Chưa tách module ES6, chưa gọi `fetch()` tới Backend API, chưa lưu JWT token. |
| **Backend (`backend/`)** | Mới có khung tối thiểu `server.js` (45 dòng, chỉ có `GET /api/health`), `db.config.example.js`, và `package.json` (`express`, `mysql2`, `cors`, `dotenv`). | • Chưa có kết nối pool MySQL (`db.js`) & helper Transaction ACID.<br>• Chưa có các tầng `routes/`, `controllers/`, `services/` (BLL), `repositories/` (DAL), `middlewares/` (JWT, RBAC, Validate, Error), `jobs/` (`node-cron`).<br>• Thiếu thư viện bảo mật (`bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`) và `node-cron`. |

---

## 3. Ánh xạ Sơ đồ Thành phần Chương 6 vào Cấu trúc Thư mục Mục tiêu

Dựa trên [`Tuan_10.md`](../docs/design_documents/Tuan_10.md) (Sơ đồ Thành phần & Sơ đồ Cộng tác), codebase mục tiêu được tổ chức như sau:

```text
Saving-Passbook_Management/
├── .gitignore
├── README.md
├── system_structure/                  # [Tài liệu thiết kế codebase & lộ trình release]
│   ├── 00_README_OVERVIEW.md
│   ├── 01_BACKEND_ARCHITECTURE.md
│   ├── 02_API_CONTRACT.md
│   ├── 03_FRONTEND_INTEGRATION.md
│   └── 04_DEVELOPMENT_TO_RELEASE_ROADMAP.md
│
├── frontend/                          # TẦNG GUI (Client-side - Vanilla JS ES6 Modules)
│   ├── index.html                     # Đổi <script type="module" src="js/main.js">
│   ├── css/
│   │   └── style.css                  # Giữ nguyên & mở rộng style nếu cần
│   ├── assets/
│   └── js/
│       ├── main.js                    # Entry point: boot app, router, điều phối render
│       ├── state/
│       │   └── store.js               # Quản lý session (JWT token, currentUser, role, cache)
│       ├── api/                       # Lớp giao tiếp Backend (thay thế hoàn toàn localStorage)
│       │   ├── client.js              # Fetch wrapper (gắn Bearer token, xử lý 401/403/JSON error)
│       │   ├── auth.api.js            # FR-01, FR-02, Đăng ký online
│       │   ├── savings.api.js         # FR-03, FR-04, FR-05, FR-06, FR-07, FR-09, EX-03
│       │   ├── customer.api.js        # FR-08
│       │   └── admin.api.js           # FR-10, FR-11, FR-12, FR-13, FR-14
│       ├── utils/
│       │   ├── format.js              # money(), fmtDate(), today(), downloadCSV()
│       │   ├── validators.js          # Validate client-side (CCCD 12 số, SĐT, Email)
│       │   └── ui.js                  # $, $$, toast(), statusBadge()
│       └── pages/                     # Các màn hình giao diện tách gọn từ main.js hiện tại
│           ├── auth.page.js           # Đăng nhập & Đăng ký online
│           ├── dashboard.page.js      # Tổng quan & Hồ sơ cá nhân (profile)
│           ├── openBook.page.js       # Mở sổ online (FR-03) & Mở sổ tại quầy (FR-04)
│           ├── savingsOps.page.js     # Tra cứu (FR-05), Tính lãi (FR-06), Tất toán (FR-07/EX-03)
│           ├── staffMgmt.page.js      # QL Khách hàng (FR-08) & Trạng thái sổ (FR-09)
│           └── adminMgmt.page.js      # Báo cáo (FR-10), Tài khoản (FR-11), Lãi suất (FR-12), Jobs (FR-13/14)
│
└── backend/                           # TẦNG BLL + TẦNG DAL (Node.js + Express + MySQL)
    ├── .env                           # Biến môi trường thực (DB, JWT_SECRET, PORT) - gitignored
    ├── .env.example                   # Mẫu biến môi trường cho cả nhóm
    ├── package.json
    ├── server.js                      # Khởi tạo app Express, mount routes, error handler & cron jobs
    ├── config/
    │   ├── db.js                      # MySQL2 Pool + helper withTransaction(callback)
    │   ├── env.js                     # Đọc & kiểm tra biến môi trường
    │   └── constants.js               # Enum ROLES, PERMISSIONS, STATUS khớp schema.sql
    ├── database/
    │   ├── schema.sql                 # Schema 19 bảng chuẩn
    │   └── seedPasswords.js           # Script cập nhật hash bcrypt chuẩn cho 4 user demo
    ├── middlewares/
    │   ├── auth.middleware.js         # Xác thực JWT Token -> gắn req.user từ DB
    │   ├── rbac.middleware.js         # Kiểm tra Role & Permission (QUYEN_TRUY_CAP)
    │   ├── validate.middleware.js     # Kiểm tra input request body/query
    │   └── error.middleware.js        # Bắt lỗi tập trung (AppError -> JSON chuẩn)
    ├── routes/                        # Khai báo Endpoint REST -> map tới Controllers
    │   ├── index.js
    │   ├── auth.routes.js             # /api/auth/*
    │   ├── profile.routes.js          # /api/profile/*
    │   ├── savings.routes.js          # /api/savings/*
    │   ├── interest.routes.js         # /api/interest/*
    │   ├── customers.routes.js        # /api/customers/*
    │   ├── admin.routes.js            # /api/accounts/*, /api/rates/*, /api/reports/*, /api/jobs/*
    ├── controllers/                   # Tầng tiếp nhận HTTP (chỉ parse req & trả res, không chứa logic)
    │   ├── auth.controller.js
    │   ├── profile.controller.js
    │   ├── savings.controller.js
    │   ├── interest.controller.js
    │   ├── customer.controller.js
    │   └── admin.controller.js
    ├── services/                      # TẦNG BLL (Đóng gói đúng 4 Component Chương 6)
    │   ├── account/                   # Component 1: QuanLyTaiKhoan (FR-01, FR-02, FR-11, EX-01)
    │   │   ├── auth.service.js        # (= DieuKhienDangNhap)
    │   │   ├── user.service.js        # (= DieuKhienNguoiDung)
    │   │   └── adminAccount.service.js# (= DieuKhienQuanTri)
    │   ├── transaction/               # Component 2: GiaoDichTietKiem (FR-03, FR-04, FR-06, FR-07, EX-03)
    │   │   ├── savingsTx.service.js   # (= DieuKhienGiaoDich)
    │   │   ├── interest.service.js    # (= DieuKhienTinhLai)
    │   │   └── settlement.service.js  # (= DieuKhienTatToan)
    │   ├── inquiry/                   # Component 3: TraCuuVaQuanLySo (FR-05, FR-08, FR-09)
    │   │   ├── inquiry.service.js     # (= DieuKhienTraCuu)
    │   │   ├── customer.service.js    # (= DieuKhienKhachHang)
    │   │   └── passbookStatus.service.js # (= DieuKhienSoTietKiem)
    │   └── admin/                     # Component 4: QuanTriVaTuDongHoa (FR-10, FR-12, FR-13, FR-14, EX-02)
    │       ├── rateConfig.service.js  # (= DieuKhienLaiSuat)
    │       ├── report.service.js      # (= DieuKhienBaoCao)
    │       ├── notification.service.js# (= DieuKhienThongBao + EX-02)
    │       ├── maturityJob.service.js # (= DieuKhienDaoHan)
    │       └── rolloverJob.service.js # (= DieuKhienTaiTuc)
    ├── repositories/                  # TẦNG DAL (Component TruyCapDuLieu / IRepository)
    │   ├── taiKhoan.repo.js           # (= DuLieuTaiKhoan)
    │   ├── hoSo.repo.js               # (= DuLieuHoSo)
    │   ├── khachHang.repo.js          # (= DuLieuKhachHang)
    │   ├── soTietKiem.repo.js         # (= DuLieuSoTietKiem)
    │   ├── laiSuat.repo.js            # (= DuLieuLaiSuat)
    │   └── heThong.repo.js            # (= DuLieuHeThong + THONG_BAO + GIAO_DICH)
    └── jobs/                          # Scheduler chạy ngầm (Timer Actor cho FR-13 & FR-14)
        └── scheduler.js               # Cron job quét nhắc đáo hạn & tái tục cuối ngày
```

---

## 4. Ma trận Bao phủ 17 Use Case (Traceability Matrix)

| Mã UC | Tên Use Case | Component BLL | Service (`backend/services/`) | Repository (`backend/repositories/`) | Bảng MySQL chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Đăng nhập & Xác thực | `QuanLyTaiKhoan` | `account/auth.service.js` | `taiKhoan.repo.js` | `TAI_KHOAN_DANG_NHAP`, `TAI_KHOAN_VAI_TRO`, `VAI_TRO` |
| **EX-01** | Sai mật khẩu & Khóa 5 lần | `QuanLyTaiKhoan` | `account/auth.service.js` | `taiKhoan.repo.js` | `TAI_KHOAN_DANG_NHAP` (`so_lan_dang_nhap_sai`, `khoa_den`) |
| **FR-02** | Quản lý thông tin cá nhân | `QuanLyTaiKhoan` | `account/user.service.js` | `hoSo.repo.js` | `NGUOI_DUNG`, `HO_SO_KHACH_HANG` |
| **FR-11** | Quản lý tài khoản & phân quyền | `QuanLyTaiKhoan` | `account/adminAccount.service.js` | `taiKhoan.repo.js` | `TAI_KHOAN_DANG_NHAP`, `TAI_KHOAN_VAI_TRO`, `VAI_TRO_QUYEN` |
| **FR-03** | Mở sổ tiết kiệm online | `GiaoDichTietKiem` | `transaction/savingsTx.service.js` | `taiKhoan.repo.js`, `soTietKiem.repo.js` | `TAI_KHOAN_THANH_TOAN`, `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `GIAO_DICH_TIET_KIEM` |
| **FR-04** | Mở sổ tiết kiệm tại quầy | `GiaoDichTietKiem` | `transaction/savingsTx.service.js` | `khachHang.repo.js`, `soTietKiem.repo.js` | `HO_SO_KHACH_HANG`, `NHAN_VIEN`, `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `GIAO_DICH_TIET_KIEM` |
| **FR-06** | Tính & Tra cứu tiền lãi | `GiaoDichTietKiem` | `transaction/interest.service.js` | `laiSuat.repo.js` | `BIEU_LAI_SUAT`, `KY_HAN_TIET_KIEM` |
| **FR-07** | Tất toán sổ tiết kiệm | `GiaoDichTietKiem` | `transaction/settlement.service.js` | `soTietKiem.repo.js`, `taiKhoan.repo.js` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `YEU_CAU_TAT_TOAN`, `GIAO_DICH_TIET_KIEM`, `TAI_KHOAN_THANH_TOAN` |
| **EX-03** | Tất toán trước hạn | `GiaoDichTietKiem` | `transaction/settlement.service.js` | `laiSuat.repo.js`, `soTietKiem.repo.js` | `BIEU_LAI_SUAT` (lãi không kỳ hạn), `YEU_CAU_TAT_TOAN` |
| **FR-05** | Tra cứu thông tin sổ | `TraCuuVaQuanLySo` | `inquiry/inquiry.service.js` | `soTietKiem.repo.js` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `BIEU_LAI_SUAT` |
| **FR-08** | Quản lý thông tin khách hàng | `TraCuuVaQuanLySo` | `inquiry/customer.service.js` | `khachHang.repo.js` | `NGUOI_DUNG`, `KHACH_HANG`, `HO_SO_KHACH_HANG` |
| **FR-09** | Quản lý trạng thái sổ | `TraCuuVaQuanLySo` | `inquiry/passbookStatus.service.js` | `soTietKiem.repo.js` | `SO_TIET_KIEM`, `LICH_SU_TRANG_THAI_SO` |
| **FR-10** | Cung cấp báo cáo & thống kê | `QuanTriVaTuDongHoa` | `admin/report.service.js` | `heThong.repo.js` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `GIAO_DICH_TIET_KIEM` |
| **FR-12** | Quản lý danh mục & lãi suất | `QuanTriVaTuDongHoa` | `admin/rateConfig.service.js` | `laiSuat.repo.js` | `SAN_PHAM_TIET_KIEM`, `KY_HAN_TIET_KIEM`, `BIEU_LAI_SUAT` |
| **FR-13** | Gửi thông báo đáo hạn | `QuanTriVaTuDongHoa` | `admin/maturityJob.service.js` | `soTietKiem.repo.js`, `heThong.repo.js` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `THONG_BAO` |
| **EX-02** | Gửi thông báo Email/SMS | `QuanTriVaTuDongHoa` | `admin/notification.service.js` | `soTietKiem.repo.js`, `heThong.repo.js` | `SO_TIET_KIEM`, `NGUOI_DUNG`, `THONG_BAO` |
| **FR-14** | Xử lý tái tục sổ tự động | `QuanTriVaTuDongHoa` | `admin/rolloverJob.service.js` | `soTietKiem.repo.js`, `laiSuat.repo.js` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `BIEU_LAI_SUAT`, `GIAO_DICH_TIET_KIEM` |

---

## 5. Thứ tự đọc bộ tài liệu `system_structure/`
1. [`00_README_OVERVIEW.md`](./00_README_OVERVIEW.md) — Kiến trúc tổng thể & ánh xạ sơ đồ vào file.
2. [`01_BACKEND_ARCHITECTURE.md`](./01_BACKEND_ARCHITECTURE.md) — Thiết kế chi tiết từng tầng Backend (Middleware, BLL, DAL, ACID Transaction, Cron Job).
3. [`02_API_CONTRACT.md`](./02_API_CONTRACT.md) — Hợp đồng REST API đầy đủ cho toàn bộ 17 Use Cases.
4. [`03_FRONTEND_INTEGRATION.md`](./03_FRONTEND_INTEGRATION.md) — Thiết kế tách module Vanilla JS & kế hoạch nối API thay `localStorage`.
5. [`04_DEVELOPMENT_TO_RELEASE_ROADMAP.md`](./04_DEVELOPMENT_TO_RELEASE_ROADMAP.md) — Lộ trình từng giai đoạn từ cài đặt đến kiểm thử, bảo mật và Release thực tế.
