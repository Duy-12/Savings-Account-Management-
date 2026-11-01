# 🏦 Hệ thống Quản lý Sổ Tiết kiệm (Savings Account Management System)

> **Dự án môn học:** Phân tích Thiết kế Hệ thống Thông tin (PTTKHDT)  
> **Kiến trúc:** Client-Server (Node.js REST API + MySQL + Vanilla Web)

---

## 🎯 1. Mục tiêu Dự án

Dự án tập trung xây dựng giải pháp phần mềm mô phỏng và **số hóa quy trình Core Banking** trong quản lý tiền gửi tiết kiệm tại quầy giao dịch ngân hàng:
- **Mở sổ tiết kiệm:** Đăng ký thông tin khách hàng, chọn loại kỳ hạn (Không kỳ hạn, 3 tháng, 6 tháng), ràng buộc số tiền gửi ban đầu tối thiểu (>= 100.000 VNĐ).
- **Tính toán lãi suất chính xác:** Tự động tính toán lãi suất theo ngày gửi thực tế, kỳ hạn cam kết và biểu lãi suất quy định.
- **Tất toán / Rút gốc & Lãi:** Kiểm tra điều kiện rút trước hạn hoặc đúng hạn, sinh phiếu chi tất toán tài khoản an toàn.
- **Tái tục tự động (Auto-Rollover):** Khi sổ đến ngày đáo hạn mà khách hàng không đến rút, hệ thống tự động cộng dồn toàn bộ tiền lãi vào tiền gốc và chuyển tiếp sang kỳ hạn mới tương đương.
- **Báo cáo & Thống kê:** Báo cáo doanh số giao dịch ngày (Tổng thu gửi vào, Tổng chi rút ra) và báo cáo mở/đóng sổ định kỳ tháng.

---

## 👥 2. Nhóm Phát triển (3 Thành viên)

| STT | Thành viên | Vai trò chính | Trách nhiệm chuyên môn |
| :---: | :--- | :--- | :--- |
| **1** | **Thành viên 1** | **Frontend UI/UX** | • Xây dựng giao diện Responsive với HTML5/CSS3 chuẩn hiện đại.<br>• Viết mã Vanilla JavaScript xử lý tương tác DOM, validate biểu mẫu.<br>• Phân tích nghiệp vụ và xây dựng sơ đồ Hoạt động (Activity Diagram). |
| **2** | **Thành viên 2** | **DBA & Backend** | • Thiết kế lược đồ cơ sở dữ liệu quan hệ MySQL chuẩn 3NF.<br>• Xây dựng RESTful API bằng Node.js & Express để giao tiếp với DB.<br>• Thiết kế Sơ đồ Lớp (Class Diagram) và thuật toán tính lãi, tái tục. |
| **3** | **Thành viên 3** | **Integration & Git Master** | • Quản lý Git Repository, luồng phân nhánh (Git Flow) & Code Review.<br>• Đấu nối tích hợp Fetch API giữa Frontend và Backend.<br>• Phân tích đặc tả yêu cầu, khảo sát & xây dựng Sơ đồ Use Case. |

---

## 💻 3. Công nghệ Sử dụng (Tech Stack)

- **Backend:** Node.js, Express.js, thư viện `mysql2`, `cors`.
- **Frontend:** HTML5 Semantic, CSS3 hiện đại (Reset CSS, Flexbox/Grid, CSS Variables), Vanilla JavaScript (ES6+ native Fetch API, không dùng thư viện nặng).
- **Database:** MySQL Server 8.0+ (InnoDB, Foreign Key constraints).
- **Công cụ phân tích thiết kế:** Draw.io, StarUML, Postman / Thunder Client.

---

## 📁 4. Cấu trúc Thư mục Dự án

```
Saving-Passbook_Management/
│
├── .gitignore                # Cấu hình bỏ qua node_modules/, .env, *.log, .DS_Store
├── README.md                 # Tài liệu hướng dẫn dự án chi tiết
│
├── frontend/                 # Giao diện người dùng (Client-side)
│   ├── index.html            # Trang chủ và bảng điều khiển Core Banking
│   ├── css/
│   │   └── style.css         # Reset CSS, design tokens và giao diện hệ thống
│   ├── js/
│   │   └── main.js           # Xử lý logic sự kiện giao diện (Vanilla JS)
│   └── assets/               # Hình ảnh, biểu tượng icon, font chữ
│
├── backend/                  # Máy chủ API và cơ sở dữ liệu (Server-side)
│   ├── server.js             # File khởi chạy máy chủ Express kết nối MySQL
│   ├── package.json          # Quản lý phụ thuộc Node.js (express, mysql2, cors)
│   ├── config/               # Cấu hình chuỗi kết nối MySQL (db.config.example.js)
│   └── database/             # Kịch bản tạo cơ sở dữ liệu mẫu (schema.sql)
│
└── docs/                     # Lưu trữ tài liệu phân tích thiết kế hệ thống (UML)
    ├── README.md             # Hướng dẫn chi tiết tài liệu PTTKHDT
    ├── UseCase/              # Sơ đồ Use Case phân rã yêu cầu chức năng
    ├── Activity/             # Sơ đồ Hoạt động mô tả quy trình nghiệp vụ gửi/rút/tái tục
    └── Class/                # Sơ đồ Lớp mô tả kiến trúc thực thể và quan hệ
```

### Ý nghĩa các thư mục trọng tâm:
* **`frontend/`:** Toàn bộ mã nguồn giao diện phía người dùng. Được tổ chức độc lập để có thể chạy độc lập với Live Server hoặc thông qua máy chủ Node.js.
* **`backend/`:** Quản trị toàn bộ logic kết nối cơ sở dữ liệu MySQL, bảo mật thông tin và cung cấp các endpoint API chuẩn JSON cho frontend.
* **`docs/`:** Thư mục đặc biệt dành cho đồ án môn **Phân tích Thiết kế Hệ thống Thông tin**. Lưu trữ toàn bộ các sơ đồ đặc tả UML (Use Case, Activity, Class Diagram) phản ánh đúng nghiệp vụ ngân hàng trước và trong khi lập trình.

---

## 🚀 5. Hướng dẫn Cài đặt & Chạy Dự án (Setup Instructions)

### Yêu cầu tiên quyết:
- Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản `>= 18.x`).
- Đã cài đặt và khởi động dịch vụ **MySQL Server** (qua XAMPP, Laragon, hoặc MySQL Workbench).
- Đã cài đặt [Git](https://git-scm.com/).

---

### Bước 1: Clone kho mã nguồn về máy cục bộ
```bash
git clone https://github.com/<your-team-repository>/Saving-Passbook_Management.git
cd Saving-Passbook_Management
```

---

### Bước 2: Thiết lập Cơ sở dữ liệu MySQL
1. Khởi động MySQL Server (port mặc định `3306`).
2. Mở trình quản lý MySQL (phpMyAdmin hoặc MySQL Workbench) hoặc dùng terminal.
3. Chạy file script SQL tại `backend/database/schema.sql` để tạo database `quan_ly_so_tiet_kiem` và nạp dữ liệu mẫu:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```
   *(Hoặc copy toàn bộ nội dung file `backend/database/schema.sql` và Execute trong phpMyAdmin / Workbench).*

---

### Bước 3: Cài đặt Dependencies cho Backend
Di chuyển vào thư mục `backend` và cài đặt các package npm:
```bash
cd backend
npm install
```

---

### Bước 4: Cấu hình kết nối MySQL
1. Tạo file cấu hình từ file mẫu:
   ```bash
   # Trên Windows PowerShell / Command Prompt:
   copy config\db.config.example.js config\db.config.js
   ```
2. Mở file `backend/config/db.config.js` và kiểm tra lại `user` (mặc định `root`) và `password` MySQL tương ứng với máy tính của bạn.

---

### Bước 5: Khởi chạy ứng dụng (Local Development)

1. **Khởi chạy Backend Server:**
   Tại thư mục `backend/`, chạy lệnh:
   ```bash
   npm start
   ```
   *Màn hình hiển thị: `🚀 Server đang chạy tại: http://localhost:3000`*

2. **Truy cập Giao diện Frontend:**
   - **Cách 1 (Qua Backend Server):** Mở trình duyệt web và truy cập:  
     👉 **`http://localhost:3000/index.html`**
   - **Cách 2 (Mở độc lập với Live Server):** Mở thư mục dự án trên VS Code, nhấp chuột phải vào file `frontend/index.html` chọn **Open with Live Server**.

---

## 🌿 6. Quy ước Git & Phối hợp Nhóm

- **Nhánh chính (`main`):** Nhánh triển khai ổn định, chỉ tích hợp mã nguồn sau khi đã kiểm thử.
- **Nhánh tính năng (`feature/*`):** 
  - `feature/open-passbook` (Mở sổ)
  - `feature/interest-calc` (Tính lãi & Rút tiền)
  - `feature/auto-rollover` (Tái tục tự động)
- **Quy tắc Commit Message:** Tuân thủ chuẩn Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`).
- Mọi nhánh tính năng đều phải tạo **Pull Request (PR)** để các thành viên khác review trước khi merge vào `main`.
