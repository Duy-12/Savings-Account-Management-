# ⚡ Kế hoạch 7 Ngày Hoàn thiện Gấp & Kiểm thử Liên tục (1-Week Crash Sprint)

> **Chế độ thực thi:** AI kiêm toàn bộ phần việc (Backend + Database Integration + Frontend Modularization & API Integration + Automated Testing) theo đúng kiến trúc đã khóa trong `system_structure/` và `.agents/rules/project-structure-guard.md`.  
> **Nguyên tắc vàng:** **Code tới đâu $\rightarrow$ Chạy test tới đó** (không để dồn lỗi đến ngày cuối).

---

## 1. Phân chia Gói Tính năng (Ưu tiên Chạy được Sớm & Ổn định)

| Gói | Phạm vi Use Case | Mức độ ưu tiên | Cách kiểm thử liên tục |
| :--- | :--- | :---: | :--- |
| **Gói 0 (Đã xong ✅)** | `FR-01` (Đăng nhập), `EX-01` (Khóa 5 lần), Đăng ký online, `FR-02` (Hồ sơ), Hạ tầng `db.js` + JWT/RBAC | **P0 — Cốt lõi** | `node --check`, load module Express, test live với MySQL + `npm run seed`. |
| **Gói 1 (Ngày 1–2)** | `FR-12` (Danh mục & Lãi suất), `FR-06` (Tính lãi), `FR-08` (QL Khách hàng), `FR-11` (QL Tài khoản & Phân quyền) | **P0 — Nền tảng** | Unit test công thức lãi, test RBAC Admin/Teller/KH, test `node --test` sau khi viết. |
| **Gói 2 (Ngày 2–4)** | `FR-03` (Mở sổ online), `FR-04` (Mở sổ tại quầy), `FR-05` (Tra cứu sổ), `FR-07` + `EX-03` (Tất toán đúng/trước hạn 2 bước), `FR-09` (Đổi trạng thái sổ) | **P0 — Core Banking** | Unit test State Machine & ACID rollback; test E2E trừ tiền `TAI_KHOAN_THANH_TOAN`, tất toán 2 bước, chống double-submit. |
| **Gói 3 (Ngày 4–5)** | `FR-10` (Báo cáo & Xuất CSV), `EX-02` (Thông báo Email/SMS mock), `FR-13` (Quét nhắc đáo hạn), `FR-14` (Tái tục tự động + Cron + Trigger tay) | **P1 — Hoàn chỉnh** | Unit test logic tái tục chu kỳ mới `n+1`; test trigger tay `POST /api/jobs/*` trên dữ liệu mẫu `STK001090`. |
| **Gói 4 (Ngày 5–6)** | **Refactor Frontend hoàn chỉnh:** Tách `frontend/js/main.js` sang ES6 Modules, nối 14 màn hình với REST API thật, sửa hardcode `'Trần Thị Mai'`, thêm trạng thái loading. | **P0 — Giao diện thật** | Chạy toàn bộ 14 màn hình trên trình duyệt qua `http://localhost:3000`, đối chiếu 17 ca kiểm thử `README_ACTIVITY_FRONTEND.md`. |
| **Gói 5 (Ngày 6–7)** | **Kiểm thử Chịu tải, Bảo mật & Release:** Test MySQL thật end-to-end, kiểm tra chống âm tiền đồng thời, tạo script smoke test tổng hợp, rà soát checklist bàn giao. | **P0 — Release** | Chạy `npm test` toàn bộ suite + E2E test qua HTTP thật kết nối MySQL + đóng gói `.env` production. |

---

## 2. Cơ chế "Vừa Chạy Vừa Test Liên tục" (Continuous Verification Loop)

Sau **MỖI GÓI** hoàn thành, bắt buộc vượt qua **3 tầng kiểm tra** trước khi sang gói tiếp theo:
1. **Tầng 1 — Static & Syntax Check:** Chạy `node --check` trên 100% file `.js` ở cả `backend/` và `frontend/js/`.
2. **Tầng 2 — Automated Unit & Logic Tests (`node --test`):** Chạy bộ test tự động trong `backend/tests/` kiểm chứng thuật toán tính lãi, quy tắc State Machine, rẽ nhánh `EX-01`/`EX-03`, rollback Transaction và RBAC ngay cả khi không cần mạng.
3. **Tầng 3 — Live MySQL & HTTP Smoke Test (trên máy local có MySQL):** Chạy `npm run seed`, bật `npm run dev` và chạy script smoke test gọi trực tiếp `http://localhost:3000/api/*` cho cả 4 vai trò (`admin`, `teller01`, `supervisor01`, `kh_mai`).

---

## 3. Lịch trình 7 Ngày Cụ thể

- **Ngày 1:** Chạy MySQL + `npm run seed` kiểm tra đăng nhập thật (`Gói 0`). Hoàn thành & test xong **Gói 1** (`FR-12`, `FR-06`, `FR-08`, `FR-11`).
- **Ngày 2–3:** Hoàn thành & test xong **Gói 2** (`FR-03`, `FR-04`, `FR-05`, `FR-07`, `EX-03`, `FR-09`) — đây là trái tim Core Banking, ưu tiên test kỹ Transaction `FOR UPDATE`.
- **Ngày 4:** Hoàn thành & test xong **Gói 3** (`FR-10`, `EX-02`, `FR-13`, `FR-14`, `scheduler.js`).
- **Ngày 5:** Hoàn thành **Gói 4** — Nâng cấp toàn bộ `frontend/` từ `localStorage` sang gọi API thật, test từng màn hình song song với Backend.
- **Ngày 6:** Chạy trọn bộ **17 kịch bản UAT** (`FR-01` $\rightarrow$ `FR-14`, `EX-01` $\rightarrow$ `EX-03`) trên trình duyệt + sửa toàn bộ bug giao diện/validation phát sinh.
- **Ngày 7:** Chạy kiểm thử cuối cùng (Concurrency test, RBAC test, Backup DB mẫu), commit & tag release sẵn sàng thuyết trình/nộp đồ án.
