# 01 — Tiền đề Thiết kế Kiến trúc Hệ thống (Prerequisites)

> **Môn học:** Phân tích và Thiết kế Hướng đối tượng (841111 - Chương 6: Thiết kế Hướng đối tượng - Tiết 2–3)  
> **Đơn vị đào tạo:** Trường Đại học Sài Gòn – Khoa Công nghệ Thông tin  
> **Căn cứ tài liệu đầu vào có thật của dự án:**
> 1. Đặc tả Use Case: `docs/UseCase/Use case.docx` (4 nhóm phân hệ, 17 Use Case: FR-01 đến FR-14, EX-01 đến EX-03).
> 2. Báo cáo sơ đồ lớp phân tích: `docs/Class/Bao_cao_so_do_lop_phan_tich.docx` (Danh mục các lớp Boundary, Control, Entity).
> 3. Sơ đồ tuần tự phân tích: `docs/Sequence/` (17 sơ đồ tuần tự mức phân tích).
> 4. Sơ đồ hoạt động phân tích: `docs/Activity/` (17 sơ đồ hoạt động mức phân tích).
> 5. Cơ sở dữ liệu: `backend/database/schema.sql` (19 bảng chuẩn Core Banking).
> 6. Mã nguồn dự án: `frontend/` (HTML5, CSS3, Vanilla JS) và `backend/` (Node.js, Express, MySQL).

---

## 1. Tác nhân Hệ thống (Actors)

Dựa trên tài liệu đặc tả `Use case.docx`, hệ thống có 4 tác nhân con người và 1 tác nhân hệ thống tự động:

| STT | Tác nhân | Vai trò nghiệp vụ | Mã vai trò trong CSDL (`VAI_TRO.ten_vai_tro`) |
| :---: | :--- | :--- | :--- |
| 1 | **Khách hàng** | Người gửi tiền, truy cập ứng dụng web/app để mở sổ online, tra cứu sổ, xem tiền lãi, yêu cầu tất toán. | `KHACH_HANG` |
| 2 | **Nhân viên giao dịch** | Giao dịch viên tại quầy, tiếp nhận tiền mặt, mở sổ tại quầy, hỗ trợ tất toán, quản lý hồ sơ khách hàng. | `GIAO_DICH_VIEN` |
| 3 | **Quản lý / Kiểm soát viên** | Phê duyệt lệnh tất toán, quản lý tài khoản, phân quyền, cấu hình lãi suất và xem báo cáo thống kê. | `KIEM_SOAT_VIEN` |
| 4 | **Quản trị hệ thống** | Cấp cao nhất, quản lý kỹ thuật và cấu hình tham số toàn hệ thống. | `ADMIN` |
| 5 | **Bộ kích hoạt hệ thống (Timer / Scheduler)** | Tiến trình tự động chạy ngầm theo lịch định kỳ (quét sổ đáo hạn để gửi thông báo, tự động tái tục cuối ngày). | *Hệ thống nội bộ (System Daemon)* |

---

## 2. Danh mục Use Case theo 4 Nhóm Phân hệ Chuẩn

Theo mục 13.1 tài liệu `Use case.docx`, toàn bộ 17 Use Case của hệ thống được gom nhóm thành **4 phân hệ nghiệp vụ cốt lõi**. Đây chính là căn cứ trực tiếp để thiết kế các thành phần tầng Business Logic Layer (BLL) theo đúng **Hình 6.3 - Trang 5 slide bài giảng**:

### Nhóm 1: Quản lý Tài khoản (Account & Identity Management)
| Mã Use Case | Tên Use Case | Tác nhân chính | Lớp Boundary (GUI) | Lớp Control (BLL) | Bảng CSDL (DAL) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Đăng nhập & Xác thực | Tất cả người dùng | `GiaoDienDangNhap` | `DieuKhienXacThuc` | `TAI_KHOAN_DANG_NHAP`, `TAI_KHOAN_VAI_TRO`, `VAI_TRO` |
| **FR-02** | Quản lý thông tin cá nhân | Khách hàng, Nhân viên | `GiaoDienHoSoCaNhan` | `DieuKhienHoSoCaNhan` | `NGUOI_DUNG`, `HO_SO_KHACH_HANG` |
| **FR-11** | Quản lý tài khoản & phân quyền | Quản lý | `GiaoDienQLTaiKhoan` | `DieuKhienTKVaPhanQuyen` | `TAI_KHOAN_DANG_NHAP`, `VAI_TRO`, `QUYEN_TRUY_CAP` |
| **EX-01** | Sai mật khẩu / Giải quyết PIN (Extend FR-01) | Tất cả người dùng | `GiaoDienDangNhap` | `DieuKhienXacThuc` | `TAI_KHOAN_DANG_NHAP` (`so_lan_dang_nhap_sai`, `khoa_den`) |

### Nhóm 2: Giao dịch Mở sổ Tiết kiệm (Savings Account Transactions)
| Mã Use Case | Tên Use Case | Tác nhân chính | Lớp Boundary (GUI) | Lớp Control (BLL) | Bảng CSDL (DAL) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-03** | Mở sổ tiết kiệm online | Khách hàng | `GiaoDienMoSoOnline` | `DieuKhienMoSo` / `DieuKhienGiaoDich` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `TAI_KHOAN_THANH_TOAN`, `GIAO_DICH_TIET_KIEM` |
| **FR-04** | Mở sổ tiết kiệm trực tiếp | Nhân viên giao dịch | `GiaoDienMoSoTaiQuay` | `DieuKhienMoSo` / `DieuKhienGiaoDich` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `NHAN_VIEN`, `GIAO_DICH_TIET_KIEM` |
| **FR-07** | Tất toán sổ tiết kiệm | Khách hàng, Nhân viên | `GiaoDienTatToan` | `DieuKhienTatToan` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `YEU_CAU_TAT_TOAN`, `GIAO_DICH_TIET_KIEM` |
| **EX-02** | Gửi thông báo Email/SMS (Extend FR-03) | Hệ thống | `DichVuGuiThongBao` | `DieuKhienThongBao` | `THONG_BAO` |
| **EX-03** | Tất toán trước hạn (Extend FR-07) | Khách hàng, Nhân viên | `GiaoDienTatToan` | `DieuKhienTatToan` | `YEU_CAU_TAT_TOAN`, `BIEU_LAI_SUAT` |

### Nhóm 3: Tra cứu & Quản lý Thông tin (Inquiry & Information Management)
| Mã Use Case | Tên Use Case | Tác nhân chính | Lớp Boundary (GUI) | Lớp Control (BLL) | Bảng CSDL (DAL) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-05** | Tra cứu thông tin sổ | Khách hàng, Nhân viên, QL | `GiaoDienQuanLySo` | `DieuKhienQuanLySo` | `SO_TIET_KIEM`, `CHU_KY_SO_TIET_KIEM`, `BIEU_LAI_SUAT` |
| **FR-06** | Tính & Tra cứu tiền lãi (Include FR-05, FR-07) | Khách hàng, Nhân viên | `GiaoDienTinhLai` | `DieuKhienTinhLai` | `BIEU_LAI_SUAT`, `KY_HAN_TIET_KIEM` |
| **FR-08** | Quản lý thông tin khách hàng | Nhân viên, Quản lý | `GiaoDienQLKhachHang` | `DieuKhienKhachHang` | `KHACH_HANG`, `HO_SO_KHACH_HANG`, `NGUOI_DUNG` |
| **FR-09** | Quản lý thông tin & trạng thái sổ | Nhân viên, Quản lý | `GiaoDienQuanLySo` | `DieuKhienQuanLySo` | `SO_TIET_KIEM`, `LICH_SU_TRANG_THAI_SO` |

### Nhóm 4: Quản trị & Tự động hóa (Administration & Automation)
| Mã Use Case | Tên Use Case | Tác nhân chính | Lớp Boundary (GUI) | Lớp Control (BLL) | Bảng CSDL (DAL) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-10** | Cung cấp báo cáo & thống kê | Quản lý | `GiaoDienBaoCao` | `DieuKhienBaoCao` | `GIAO_DICH_TIET_KIEM`, `SO_TIET_KIEM` |
| **FR-12** | Quản lý danh mục & lãi suất | Quản trị viên / QL | `GiaoDienQLDanhMuc` | `DieuKhienDanhMucVaLS` | `SAN_PHAM_TIET_KIEM`, `KY_HAN_TIET_KIEM`, `BIEU_LAI_SUAT` |
| **FR-13** | Gửi thông báo đáo hạn | Tiến trình tự động (Timer) | `BoKichHoatKTDaoHan` | `DieuKhienThongBao` | `CHU_KY_SO_TIET_KIEM`, `THONG_BAO` |
| **FR-14** | Xử lý tái tục sổ tự động | Tiến trình tự động (Timer) | `BoKichHoatTaiTuc` | `DieuKhienTaiTuc` | `CHU_KY_SO_TIET_KIEM`, `SO_TIET_KIEM`, `GIAO_DICH_TIET_KIEM` |

---

## 3. Chuyển đổi từ Lớp Phân tích sang Kiến trúc 3 Tầng (3-Layer Architecture)

Theo bài giảng Chương 6 (Slide trang 3, 5, 10, 12), kiến trúc thiết kế hệ thống phân rã thành **3 tầng logic độc lập**:

```
[ Tầng Giao diện (GUI) ]
          │  cần (required) Interface nghiệp vụ
          ▼
[ Tầng Nghiệp vụ (BLL) ]  (Gom 4 thành phần theo 4 nhóm Use Case)
          │  cần (required) IRepository
          ▼
[ Tầng Truy cập Dữ liệu (DAL) ]
          │  giao thức SQL / TCP 3306
          ▼
[ Cơ sở Dữ liệu MySQL (19 bảng) ]
```

### 3.1. Phân định Trách nhiệm Từng Tầng

| Tầng | Lớp đối tượng tương ứng từ Sơ đồ phân tích | Trách nhiệm thiết kế | Được phép | Không được phép |
| :--- | :--- | :--- | :--- | :--- |
| **GUI** *(Presentation)* | Toàn bộ các lớp **Boundary**: `GiaoDienMoSoOnline`, `GiaoDienDangNhap`, `GiaoDienTatToan`... | • Hiển thị giao diện, tiếp nhận thao tác người dùng.<br>• Kiểm tra tính hợp lệ về mặt định dạng (Format Validation: không để trống, kiểu số, độ dài...). | Gọi các hàm nghiệp vụ của BLL thông qua Interface được BLL cung cấp. | ❌ Không được chứa quy tắc nghiệp vụ (Business Rules).<br>❌ Không được kết nối hay viết SQL trực tiếp tới CSDL. |
| **BLL** *(Business Logic)* | Toàn bộ các lớp **Control**: `DieuKhienMoSo`, `DieuKhienXacThuc`, `DieuKhienTinhLai`, `DieuKhienTatToan`... | • Thực thi toàn bộ quy tắc nghiệp vụ (Ràng buộc số tiền gửi tối thiểu, kiểm tra số dư, tính toán lãi suất, kiểm tra trạng thái sổ).<br>• Quản lý và phân định phạm vi Transaction (Transaction Boundary). | • Cung cấp Interface cho GUI gọi.<br>• Gọi tầng DAL thông qua `IRepository` để đọc/ghi dữ liệu. | ❌ Không phụ thuộc vào công nghệ giao diện (không phụ thuộc thẻ HTML, DOM hay HTTP request/response).<br>❌ Không viết câu lệnh SQL trực tiếp. |
| **DAL** *(Data Access)* | Toàn bộ các lớp **Entity**: `SoTietKiem`, `TaiKhoanThanhToan`, `KhachHang`, `GiaoDichTietKiem`... được đóng gói qua Repository/DAO. | • Thực hiện các thao tác CRUD và truy vấn với hệ quản trị CSDL MySQL.<br>• Thực thi lệnh Transaction (`BEGIN`, `COMMIT`, `ROLLBACK`) do BLL yêu cầu.<br>• Khóa dòng dữ liệu (`FOR UPDATE`) khi có tranh chấp số dư. | Nhận lệnh từ BLL, thực thi câu lệnh SQL có tham số (Parameterized Queries) trên CSDL. | ❌ Không chứa logic nghiệp vụ hay quy tắc tính toán của ngân hàng.<br>❌ Không gọi ngược lên tầng BLL hay GUI. |

---

## 4. Ánh xạ Kiến trúc 3 Tầng vào Dự án (Node.js + Vanilla JS + MySQL)

Cấu trúc thư mục của dự án phản ánh trực tiếp sự phân tách 3 tầng logic này:

```
Saving-Passbook_Management/
│
├── frontend/                               ── TẦNG GUI (Client-Side)
│   ├── index.html                          # Khung hiển thị SPA, liên kết CSS và JS
│   ├── css/style.css                       # Định dạng giao diện chuẩn Core Banking
│   └── js/main.js                          # Xử lý sự kiện DOM, format validation, gọi API
│
├── backend/                                ── TẦNG BLL & DAL (Server-Side)
│   ├── server.js                           # Khởi chạy Express server, cấu hình route
│   ├── config/db.config.example.js         # Cấu hình chuỗi kết nối MySQL
│   ├── database/schema.sql                 # Lược đồ 19 bảng và dữ liệu mẫu Core Banking
│   └── package.json                        # Thư viện phụ thuộc: express, mysql2, cors
│
└── docs/                                   ── TÀI LIỆU THIẾT KẾ (Software Design Docs)
    ├── UseCase/Use case.docx               # Đặc tả Use Case phân tích (Chương 4)
    ├── Class/Bao_cao_so_do_lop_phan_tich.docx # Sơ đồ lớp phân tích Boundary-Control-Entity (Chương 5)
    ├── Sequence/                           # 17 sơ đồ tuần tự phân tích (Chương 5)
    ├── Activity/                           # 17 sơ đồ hoạt động phân tích (Chương 4)
    └── design_documents/                   # 4 sơ đồ kiến trúc hệ thống (Chương 6)
        ├── 01_Prerequisites.md             # Tiền đề thiết kế (Tài liệu này)
        ├── 02_Component_Deployment.md      # Sơ đồ thành phần & Sơ đồ triển khai
        └── 03_Collaboration_Activity.md    # Sơ đồ cộng tác & Sơ đồ hoạt động mức thiết kế
```
