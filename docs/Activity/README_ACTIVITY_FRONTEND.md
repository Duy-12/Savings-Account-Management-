# Đối chiếu nhiệm vụ Thành viên 1 – Frontend UI/UX

## 1. HTML5/CSS3 Responsive
- `frontend/index.html`: điểm vào giao diện, HTML5 và viewport.
- `frontend/css/style.css`: reset, biến thiết kế, bố cục, component và breakpoint responsive.
- Kiểm tra thủ công trên desktop, tablet và mobile trước khi nghiệm thu.

## 2. Vanilla JavaScript
- `frontend/js/main.js`: JavaScript thuần, thao tác DOM và render các màn hình.
- Có xử lý tương tác, form submit, validate dữ liệu đầu vào, thông báo, dữ liệu demo và LocalStorage.
- Đây là mô phỏng phía trình duyệt. Các điều kiện bảo mật, số dư, quyền giao dịch và hạch toán phải được Backend xác minh lại.
- Tích hợp Fetch API thuộc phần phối hợp với Thành viên 3 theo README dự án.

## 3. Phân tích nghiệp vụ và Activity Diagram
Các sơ đồ hoạt động đã được nhóm cung cấp và được giữ trong `docs/Activity/`:
- FR-01 đến FR-14.
- EX-01 đến EX-03.
- Bản tài liệu tổng hợp: `Activity_Diagram_Nhom_8.docx`.

Thành viên 1 sử dụng các sơ đồ này để xác định màn hình, bước thao tác, nhánh điều kiện, trạng thái lỗi và kết quả hiển thị. Không tự ý thay đổi quy tắc nghiệp vụ trong sơ đồ; điểm chưa rõ cần xác nhận với nhóm.

## 4. Bảng kiểm thử giao diện theo luồng
| Mã | Nội dung cần kiểm thử |
|---|---|
| FR-01 | Đăng nhập đúng/sai, tài khoản khóa, trạng thái không hoạt động, chuyển giao diện theo vai trò |
| FR-02 | Tải hồ sơ, sửa email/SĐT/CCCD, từ chối dữ liệu sai |
| FR-03 | Chọn sản phẩm/kỳ hạn, số tiền tối thiểu, số dư, xác nhận mở sổ |
| FR-04 | Tìm khách hàng bằng CCCD, yêu cầu bổ sung hồ sơ, kiểm tra tham số và ghi nhận sổ |
| FR-05 | Tra cứu theo mã sổ/CCCD, không tìm thấy, hiển thị chi tiết và tiền lãi |
| FR-06 | Kiểm tra gốc, kỳ hạn, lãi suất, thời gian và kết quả tính |
| FR-07 | Kiểm tra điều kiện, rút trước hạn, xác nhận/hủy, hiển thị biên nhận |
| FR-08 | Tra cứu, thêm/sửa khách hàng, validate dữ liệu |
| FR-09 | Chọn trạng thái mới, kiểm tra điều kiện, từ chối hoặc lưu trạng thái |
| FR-10 | Chọn loại báo cáo, khoảng thời gian, bộ lọc, dữ liệu rỗng và xuất CSV |
| FR-11 | Tạo tài khoản, phát hiện username trùng, gán vai trò và trạng thái |
| FR-12 | Thêm/sửa kỳ hạn, lãi suất dương, phát hiện kỳ hạn trùng |
| FR-13 | Danh sách sổ sắp đáo hạn, trạng thái gửi và tình huống gửi lỗi (mô phỏng) |
| FR-14 | Sổ đến hạn, điều kiện tái tục, cập nhật chu kỳ (mô phỏng) |
| EX-01 | Sai mật khẩu nhiều lần và trạng thái khóa |
| EX-02 | Gửi thông báo thành công/thất bại (mô phỏng) |
| EX-03 | Tất toán trước hạn, cảnh báo lãi và xác nhận/hủy |

## 5. Giới hạn bản demo
Backend trong repository hiện chưa cung cấp API nghiệp vụ cho toàn bộ FR. Vì vậy Frontend dùng dữ liệu mẫu/LocalStorage; không thực hiện giao dịch ngân hàng thật, không gửi SMS/Email thật và không thay thế tính toán Core Banking.
