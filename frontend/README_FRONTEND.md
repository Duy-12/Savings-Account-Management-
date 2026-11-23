# Frontend - Thành viên 1 (UI/UX)

## Phạm vi đã triển khai
- Responsive UI bằng HTML5/CSS3 và Vanilla JavaScript ES6, không dùng framework.
- Đăng nhập bằng tài khoản riêng cho Khách hàng / Nhân viên giao dịch / Quản lý (Kiểm soát viên); có thêm tài khoản Admin demo. Vai trò được xác định từ tài khoản, không có chức năng tự đổi vai trò sau đăng nhập. Menu và dữ liệu sổ được lọc theo vai trò.
- FR-01: giao diện đăng nhập, kiểm tra tên đăng nhập demo và hiển thị giao diện theo vai trò. Luồng khóa tài khoản sau 5 lần sai cần Backend xử lý thật.
- FR-02: xem/cập nhật thông tin cá nhân, kiểm tra email và số điện thoại.
- FR-03: mở sổ online, chọn sản phẩm/kỳ hạn/số tiền/tái tục, kiểm tra số tiền tối thiểu và số dư tài khoản thanh toán demo.
- FR-04: mở sổ tại quầy, kiểm tra CCCD đã có hồ sơ khách hàng trước khi ghi nhận.
- FR-05: tra cứu sổ theo mã sổ/CCCD/tên.
- FR-06: form tính lãi, kiểm tra tham số; công thức hiện tại chỉ là mô phỏng lãi đơn theo ngày.
- FR-07: tất toán, cảnh báo trước hạn và xác nhận giao dịch.
- FR-08: thêm/cập nhật hồ sơ khách hàng.
- FR-09: thay đổi trạng thái sổ.
- FR-10: lọc và xuất báo cáo CSV.
- FR-11: tạo tài khoản, gán vai trò và xem ma trận quyền.
- FR-12: quản lý kỳ hạn và biểu lãi suất.
- FR-13: rà soát mô phỏng và ghi nhận thông báo đáo hạn.
- FR-14: rà soát mô phỏng tái tục tự động.
- Ngoại lệ: thông báo nhập sai/không đủ điều kiện, gửi thông báo lỗi mô phỏng, cảnh báo tất toán trước hạn.

## Chạy giao diện
1. Mở thư mục dự án trong VS Code.
2. Mở `frontend/index.html` bằng Live Server; hoặc chạy Backend theo hướng dẫn README gốc và truy cập `http://localhost:3000/index.html`.
3. Dùng một trong các tài khoản demo riêng biệt sau (phân biệt chữ hoa/thường):
   - Khách hàng: `kh_mai` / `Khachhang@123`
   - Nhân viên: `teller01` / `Nhanvien@123`
   - Quản lý: `supervisor01` / `Quanly@123`
   - Quản trị hệ thống: `admin` / `Admin@123`
4. Đăng xuất rồi đăng nhập tài khoản khác để kiểm tra giao diện và menu tương ứng. Không thể đổi vai trò bằng hộp chọn sau khi đăng nhập.
5. Tài khoản demo bị khóa tạm thời trong trình duyệt sau 5 lần nhập sai. Đây chỉ là mô phỏng Frontend.

## Lưu ý tích hợp
Giao diện Frontend đã được tách thành các ES6 Modules chuẩn (`js/main.js`, `js/state/store.js`, `js/api/*.api.js`, `js/utils/*.js`, `js/pages/*.page.js`) và kết nối trực tiếp với Backend REST API (`/api/*`) cùng cơ sở dữ liệu MySQL 19 bảng. Mọi xử lý xác thực mật khẩu băm (`bcryptjs`), khóa tài khoản 5 lần sai, kiểm tra phân quyền RBAC, trừ/cộng số dư tài khoản thanh toán trong ACID Transaction và tính toán lãi suất đều được thực hiện tại máy chủ Backend.

## Các tệp thành viên 1 chỉnh sửa
- `frontend/index.html`
- `frontend/css/style.css`
- `frontend/js/main.js`
- `frontend/README_FRONTEND.md`

## Đối chiếu Activity Diagram
Xem `../docs/Activity/README_ACTIVITY_FRONTEND.md` để biết bảng đối chiếu FR-01–FR-14, EX-01–EX-03 và checklist kiểm thử theo luồng.

## Đăng ký trực tuyến dành cho khách hàng
Màn hình đăng nhập có liên kết **Đăng ký online**. Khách hàng có thể nhập họ tên, CCCD, số điện thoại, email, tên đăng nhập và mật khẩu; giao diện kiểm tra định dạng, mật khẩu xác nhận và trùng lặp thông tin cơ bản. Tài khoản tự động được gán vai trò `KHACH_HANG`; người đăng ký không thể tự chọn vai trò nhân viên/quản lý. Bản demo lưu thông tin vào LocalStorage của trình duyệt. Đây chưa phải đăng ký thật: cần Backend xác minh danh tính/liên hệ, băm mật khẩu, kiểm tra trùng lặp trong CSDL và triển khai quy trình xác thực phù hợp trước khi dùng thực tế.
