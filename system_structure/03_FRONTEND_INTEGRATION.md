# 🎨 Thiết kế Refactor & Tích hợp Frontend (Chuyển từ Demo sang Real API)

> Tài liệu này hướng dẫn chi tiết cách nâng cấp code Frontend hiện tại ([`frontend/index.html`](../frontend/index.html), [`frontend/js/main.js`](../frontend/js/main.js)) từ bản mô phỏng `localStorage` sang ứng dụng giao tiếp REST API thật với Backend, **vẫn giữ nguyên 100% Vanilla JS + CSS hiện có** (không cài thêm framework hay bundler).

---

## 1. Các Vấn đề Cần Khắc phục ở `frontend/js/main.js` Hiện tại

1. **Bảo mật & Dữ liệu giả (`lines 4–5`, `11–16`):**
   - Mảng `state.accounts` chứa sẵn mật khẩu plaintext (`Admin@123`, `Nhanvien@123`...) ngay trong code trình duyệt.
   - Đếm số lần đăng nhập sai `cs_login_fail_*` lưu ở `localStorage` (người dùng xóa storage là mở khóa được).
   - Đăng ký khách hàng mới (`showRegister`) chỉ lưu vào `cs_registered_accounts` trên trình duyệt.
2. **Hardcode tên người dùng ở Dashboard (`line 23`, `26`):**
   - `dashboard()` đang lọc `b.name === 'Trần Thị Mai'` thay vì lấy sổ từ API của đúng tài khoản đang đăng nhập.
   - `openForm(true)` đang điền sẵn `'Trần Thị Mai'` và tài khoản nguồn giả `'1019283746'`.
3. **Tính toán & Hạch toán nằm ở Client (`lines 39`, `41`, `42`):**
   - Số dư tối đa khi mở online đang check cứng `> 150000000` thay vì kiểm tra `so_du` thực trong `TAI_KHOAN_THANH_TOAN`.
   - Khi tách module, Client chỉ validate định dạng UX; mọi quyết định số dư, lãi suất, transaction đều do Backend trả về.
4. **Cấu trúc file đơn khối:** Toàn bộ ~55 dòng nén dài trong `main.js` khó chia 3 người làm song song hoặc review PR.

---

## 2. Cấu trúc Module Vanilla JS Mục tiêu (`frontend/js/`)

Chỉ cần đổi `<script src="js/main.js"></script>` trong `frontend/index.html` thành:
```html
<script type="module" src="js/main.js"></script>
```
*(Trình duyệt hiện đại hỗ trợ ES6 Modules native khi chạy qua Express `http://localhost:3000` hoặc VS Code Live Server).*

### Phân chia các file trong `frontend/js/`:
- **`state/store.js`:**
  - Chỉ lưu `{ token, user, role, rates, selectedPage }` (lấy `token` từ `sessionStorage` hoặc `localStorage` kèm API `GET /api/auth/me` khi F5 reload trang).
  - Xóa bỏ hoàn toàn `seedBooks`, `state.accounts` (có password), `cs_books`, `cs_registered_accounts`.
- **`api/client.js` (Lớp lõi giao tiếp HTTP):**
  ```javascript
  const API_BASE = '/api'; // Tự động cùng origin với Express :3000 (hoặc cấu hình biến nếu chạy Live Server)

  export async function apiRequest(path, options = {}) {
    const token = localStorage.getItem('cs_token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));

    if (res.status === 401 && !path.startsWith('/auth/login')) {
      // Token hết hạn -> đăng xuất về màn hình Login
      localStorage.removeItem('cs_token');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Lỗi hệ thống (${res.status})`);
    }
    return json;
  }
  ```
- **`api/auth.api.js`, `api/savings.api.js`, `api/customer.api.js`, `api/admin.api.js`:** Mỗi file xuất các hàm `async` gọn nhẹ (`login()`, `register()`, `openOnline()`, `previewSettlement()`, `confirmSettlement()`...).
- **`pages/*.page.js`:** Giữ nguyên toàn bộ cấu trúc HTML + class CSS trong `style.css` hiện tại (giao diện không bị phá vỡ), chỉ chuyển các hàm sự kiện `onsubmit`/`onclick` sang `async/await` gọi API + hiển thị loading trên nút bấm tránh double-click!

---

## 3. Bảng Ánh xạ Chuyển đổi Từng Chức năng (`main.js` Cũ → API Mới)

| Chức năng trong `main.js` cũ | Hành vi Demo hiện tại | Thay thế bằng API Thật | Ghi chú UX khi tích hợp |
| :--- | :--- | :--- | :--- |
| `handleLogin` | Tìm trong `state.accounts`, đếm `cs_login_fail_*` | `POST /api/auth/login` | Lưu `token` + `user`, điều hướng theo `user.roles[0]` từ Server trả về. |
| `showRegister` | Push vào `cs_registered_accounts` | `POST /api/auth/register` | Server báo lỗi `409` nếu trùng CCCD/Email/Username. |
| `profile` (`#profile-form`) | Sửa trực tiếp `state.customers` | `GET /api/profile` & `PUT /api/profile` | Dùng dữ liệu thật từ `NGUOI_DUNG` + `HO_SO_KHACH_HANG`. |
| `openForm(true)` (`FR-03`) | Check `> 150000000` giả lập | `GET /api/savings/payment-accounts` + `POST /api/savings/open-online` | Dropdown tài khoản thanh toán hiển thị `so_tai_khoan` + `so_du` thật từ DB; disable nút submit trong lúc chờ Transaction. |
| `openForm(false)` (`FR-04`) | Check `state.customers.some(cccd)` | `GET /api/customers?cccd=...` + `POST /api/savings/open-counter` | Nhân viên gõ CCCD nhấn tìm trước để tự điền tên KH; nếu chưa có hồ sơ thì gợi ý sang tab Thêm khách hàng. |
| `dashboard` & `searchView` (`FR-05`) | Lọc mảng `state.books` | `GET /api/savings?q=...` | Bỏ dòng lọc cứng `'Trần Thị Mai'`; Backend tự lọc sổ của `KHACH_HANG` dựa trên JWT và trả kèm lãi tạm tính. |
| `interestView` (`FR-06`) | Tính đơn giản trên JS | `POST /api/interest/calculate` | Hiển thị bảng tính chuẩn theo quy định từ Backend. |
| `settlementView` (`FR-07` & `EX-03`) | Tính preview trên JS & đổi `status` trên RAM | Bước 1: `POST /api/savings/:maSo/settlement-preview`<br>Bước 2: `POST /api/savings/:maSo/settlement-confirm` | Khi đổi sổ hoặc ngày tất toán $\rightarrow$ gọi `/settlement-preview` để hiện cảnh báo mất lãi (nếu trước hạn) do Backend tính chính xác. |
| `customersView` (`FR-08`) | Sửa mảng `state.customers` | `GET /api/customers`, `POST /api/customers`, `PUT /api/customers/:id` | Đồng bộ ngay xuống `NGUOI_DUNG` & `HO_SO_KHACH_HANG`. |
| `statusView` (`FR-09`) | Ghi đè `b.status = d.status` | `PATCH /api/savings/:maSo/status` | Bắt buộc gửi kèm `lyDo`, Server ghi `LICH_SU_TRANG_THAI_SO` và chặn chuyển trạng thái sai (VD: sổ `DA_TAT_TOAN`). |
| `reportsView` (`FR-10`) | Lọc `state.books` + `downloadCSV` | `GET /api/reports?type=...&from=...&to=...` | Backend tổng hợp số liệu từ SQL; giữ nguyên hàm `downloadCSV()` trên FE để xuất file `.csv`. |
| `accountsView` (`FR-11`) | Sửa `state.accounts` | `GET /api/accounts`, `POST /api/accounts`, `PATCH /api/accounts/:id` | Ẩn nút/route ở cả UI lẫn RBAC API nếu không phải `ADMIN`. |
| `ratesView` (`FR-12`) | Sửa `state.rates` | `GET /api/rates`, `POST /api/rates`, `PUT /api/rates/:kyHanId` | Khi mở app hoặc vào form mở sổ đều fetch `/api/rates` để luôn khớp lãi suất hiện hành trong DB. |
| `notificationsView` (`FR-13`) & `rolloverView` (`FR-14`) | Lọc giả lập + toast | `GET /api/notifications`, `POST /api/jobs/maturity-scan`, `POST /api/jobs/rollover-run` | Cho phép Admin/Kiểm soát viên xem log thông báo thật trong `THONG_BAO` và bấm kích hoạt chạy job trực tiếp khi demo. |
