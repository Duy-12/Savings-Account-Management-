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
│   └── schema.sql            # Script tạo Database, Bảng và dữ liệu mẫu
├── package.json              # Khai báo thư viện (Express, MySQL2, CORS)
├── server.js                 # File khởi chạy máy chủ Express
└── README.md                 # Hướng dẫn chi tiết
```

---

## 2. Các bước triển khai cho thành viên phụ trách Backend

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
   cp config/db.config.example.js config/db.config.js
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
