# ⚙️ Hướng dẫn thiết lập Backend & Cơ sở dữ liệu MySQL

Thư mục này quản lý mã nguồn phía máy chủ chịu trách nhiệm kết nối và truy vấn dữ liệu từ MySQL, cung cấp API JSON cho giao diện Frontend.

---

## 1. Cấu trúc thư mục Backend
```
backend/
├── config/
│   ├── db.config.example.js  # File cấu hình mẫu kết nối MySQL
│   └── db.config.js          # File cấu hình thực tế (đã đưa vào .gitignore)
├── database/
│   └── schema.sql            # Script tạo Database 19 bảng Core Banking & Dữ liệu mẫu
├── package.json              # Khai báo thư viện (Express, MySQL2, CORS)
├── server.js                 # File khởi chạy máy chủ Express
└── README.md                 # Hướng dẫn chi tiết
```

---

## 2. Danh mục 19 Bảng Core Banking (`schema.sql`)

| Phân hệ | Tên Bảng | Vai trò & Mục đích nghiệp vụ |
| :--- | :--- | :--- |
| **Xác thực & Người dùng** | `NGUOI_DUNG` | Thông tin định danh chung (Họ tên, email, SĐT). |
| | `KHACH_HANG` | Phân loại người dùng là khách hàng ngân hàng. |
| | `HO_SO_KHACH_HANG` | CCCD, ngày sinh, địa chỉ thường trú của khách hàng. |
| | `NHAN_VIEN` | Danh mục nhân viên nội bộ (Mã nhân viên, trạng thái). |
| | `TAI_KHOAN_DANG_NHAP` | Xác thực người dùng, mật khẩu băm, đếm đăng nhập sai. |
| **Phân quyền (RBAC)** | `VAI_TRO` | Danh mục vai trò (Admin, Giao dịch viên, Kiểm soát viên, Khách hàng). |
| | `QUYEN_TRUY_CAP` | Quyền cụ thể (Mở sổ, Tất toán, Duyệt lệnh, Xem báo cáo). |
| | `TAI_KHOAN_VAI_TRO` | Liên kết N-N giữa Tài khoản và Vai trò. |
| | `VAI_TRO_QUYEN` | Phân quyền N-N cho từng vai trò. |
| **Tài khoản thanh toán** | `TAI_KHOAN_THANH_TOAN`| Tài khoản CASA liên kết nhận gốc/lãi khi đáo hạn. |
| **Sản phẩm & Lãi suất** | `SAN_PHAM_TIET_KIEM` | Danh mục sản phẩm (Tiết kiệm thường, Tích lũy). |
| | `KY_HAN_TIET_KIEM` | Kỳ hạn gửi (Không kỳ hạn, 3 tháng, 6 tháng, 12 tháng). |
| | `BIEU_LAI_SUAT` | Quản lý lịch sử hiệu lực của lãi suất (%/năm). |
| **Sổ tiết kiệm & Chu kỳ** | `SO_TIET_KIEM` | Thông tin định danh sổ tiết kiệm (Mã sổ, nhân viên mở). |
| | `CHU_KY_SO_TIET_KIEM` | Quản lý từng chu kỳ gửi, số tiền gốc, tái tục tự động. |
| **Giao dịch & Tất toán** | `GIAO_DICH_TIET_KIEM` | Sổ cái hạch toán dòng tiền (Mở sổ, Gửi thêm, Trả lãi). |
| | `YEU_CAU_TAT_TOAN` | Quy trình Maker-Checker phê duyệt tất toán trước/đúng hạn. |
| **Kiểm toán & Truyền thông**| `LICH_SU_TRANG_THAI_SO`| Audit trail ghi nhận lịch sử thay đổi trạng thái của sổ. |
| | `THONG_BAO` | Quản lý gửi tin nhắn SMS/Email nhắc hạn sổ tiết kiệm. |

---

## 3. Các bước triển khai cho thành viên phụ trách Backend

### Bước 1: Cài đặt và nhập Database vào MySQL
1. Khởi động MySQL Server (bằng XAMPP, Laragon, MySQL Workbench hoặc Docker).
2. Mở terminal hoặc trình quản lý MySQL (phpMyAdmin/HeidiSQL/Workbench).
3. Chạy script tạo cơ sở dữ liệu từ file `backend/database/schema.sql`:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

### Bước 2: Cài đặt Dependencies cho Node.js
Di chuyển vào thư mục `backend` và cài đặt các package:
```bash
cd backend
npm install
```

### Bước 3: Cấu hình thông tin kết nối
1. Sao chép file cấu hình mẫu:
   ```bash
   # Windows PowerShell / CMD:
   copy config\db.config.example.js config\db.config.js
   ```
2. Mở file `config/db.config.js` và điền `user`, `password` MySQL của máy bạn.

### Bước 4: Khởi chạy Server
- Chạy thông thường:
  ```bash
  npm start
  ```
- Hoặc chạy chế độ dev (tự reload khi sửa code):
  ```bash
  npm run dev
  ```
- Truy cập kiểm tra API tại: `http://localhost:3000/api/health`
