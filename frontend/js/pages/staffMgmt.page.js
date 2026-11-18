/**
 * Màn hình Quản lý khách hàng (FR-08) & Trạng thái sổ (FR-09)
 * File: frontend/js/pages/staffMgmt.page.js
 */
import * as customerApi from '../api/customer.api.js';
import * as savingsApi from '../api/savings.api.js';
import { $, $$, escapeHtml, toast, withButtonLoading } from '../utils/ui.js';
import { fmtDate, statusBadge } from '../utils/format.js';
import { buildPassbooksTableHtml } from './dashboard.page.js';
import { isValidCccd, isValidEmail, isValidPhone } from '../utils/validators.js';

export async function renderCustomersPage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải danh sách khách hàng...</div></div>';

    try {
        const customers = await customerApi.listCustomers();

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div><h3>Hồ sơ khách hàng (FR-08)</h3><p>Tra cứu, thêm mới và cập nhật thông tin định danh CCCD.</p></div>
            <button class="btn btn-primary btn-sm" id="add-customer">＋ Thêm khách hàng</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Họ tên</th><th>CCCD</th><th>Ngày sinh</th><th>Điện thoại</th><th>Email</th><th>Trạng thái</th><th></th></tr>
              </thead>
              <tbody>
                ${
                    customers.length
                        ? customers
                              .map(
                                  (c) => `
                          <tr>
                            <td class="strong">${escapeHtml(c.ho_ten)}</td>
                            <td>${escapeHtml(c.so_cccd || '—')}</td>
                            <td>${fmtDate(c.ngay_sinh)}</td>
                            <td>${escapeHtml(c.so_dien_thoai || '—')}</td>
                            <td>${escapeHtml(c.email || '—')}</td>
                            <td>${statusBadge(c.trang_thai)}</td>
                            <td><button class="btn btn-light btn-sm" data-edit-kh="${c.khach_hang_id}">Chỉnh sửa</button></td>
                          </tr>`
                              )
                              .join('')
                        : '<tr><td colspan="7"><div class="empty">Chưa có khách hàng.</div></td></tr>'
                }
              </tbody>
            </table>
          </div>
        </section>
        <section class="panel" id="customer-editor" hidden></section>`;

        const editor = $('#customer-editor', container);

        function openEditor(customer = null) {
            const isEdit = Boolean(customer);
            const dob = customer && customer.ngay_sinh ? String(customer.ngay_sinh).slice(0, 10) : '1990-01-01';
            editor.hidden = false;
            editor.innerHTML = `
            <h3>${isEdit ? 'Cập nhật hồ sơ khách hàng' : 'Thêm mới khách hàng'}</h3>
            <form id="customer-form" class="form-grid" style="margin-top:14px">
              <div class="field"><label>Họ tên</label><input name="hoTen" value="${escapeHtml(customer?.ho_ten || '')}" required></div>
              <div class="field"><label>Số CCCD</label><input name="soCccd" value="${escapeHtml(customer?.so_cccd || '')}" pattern="[0-9]{9,12}" required></div>
              <div class="field"><label>Ngày sinh</label><input name="ngaySinh" type="date" value="${dob}" required></div>
              <div class="field"><label>Số điện thoại</label><input name="soDienThoai" value="${escapeHtml(customer?.so_dien_thoai || '')}" pattern="0[0-9]{9,10}" required></div>
              <div class="field"><label>Email</label><input name="email" type="email" value="${escapeHtml(customer?.email || '')}" required></div>
              <div class="field"><label>Địa chỉ</label><input name="diaChi" value="${escapeHtml(customer?.dia_chi || '')}" placeholder="Địa chỉ thường trú"></div>
              <div class="field full form-actions">
                <button type="button" class="btn btn-light" id="cancel-customer-edit">Đóng</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Lưu cập nhật' : 'Tạo khách hàng'}</button>
              </div>
            </form>`;

            $('#cancel-customer-edit', editor).onclick = () => {
                editor.hidden = true;
            };

            const form = $('#customer-form', editor);
            form.onsubmit = async (e) => {
                e.preventDefault();
                const d = Object.fromEntries(new FormData(form));
                if (!isValidCccd(d.soCccd) || !isValidPhone(d.soDienThoai) || !isValidEmail(d.email)) {
                    toast('Vui lòng kiểm tra lại định dạng CCCD, SĐT hoặc Email.', 'error');
                    return;
                }
                const btn = form.querySelector('button[type="submit"]');
                await withButtonLoading(btn, 'Đang lưu...', async () => {
                    try {
                        if (isEdit) {
                            await customerApi.updateCustomer(customer.khach_hang_id, d);
                            toast('Cập nhật hồ sơ khách hàng thành công.');
                        } else {
                            await customerApi.createCustomer(d);
                            toast('Tạo hồ sơ khách hàng mới thành công.');
                        }
                        await renderCustomersPage(container);
                    } catch (err) {
                        toast(err.message, 'error');
                    }
                });
            };
        }

        $('#add-customer', container).onclick = () => openEditor(null);
        $$('[data-edit-kh]', container).forEach((btn) => {
            btn.onclick = () => {
                const found = customers.find((c) => Number(c.khach_hang_id) === Number(btn.dataset.editKh));
                openEditor(found || null);
            };
        });
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}

export async function renderBookStatusPage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải danh sách sổ...</div></div>';

    try {
        const books = await savingsApi.listPassbooks();
        const editableBooks = books.filter((b) => b.trang_thai !== 'DA_TAT_TOAN');

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Quản lý thông tin và trạng thái sổ (FR-09)</h3>
              <p>Chuyển đổi trạng thái theo State Machine (Phong tỏa, Báo mất, Giải tỏa) và ghi lịch sử Audit Trail.</p>
            </div>
          </div>
          ${buildPassbooksTableHtml(books)}
          <form id="status-form" class="form-grid" style="margin-top:16px">
            <div class="field">
              <label>Chọn mã sổ</label>
              <select name="maSo" required>
                ${editableBooks
                    .map(
                        (b) =>
                            `<option value="${escapeHtml(b.ma_so)}">${escapeHtml(b.ma_so)} (${escapeHtml(
                                b.trang_thai
                            )})</option>`
                    )
                    .join('') || '<option value="">Không còn sổ có thể đổi trạng thái</option>'}
              </select>
            </div>
            <div class="field">
              <label>Trạng thái mới</label>
              <select name="trangThaiMoi" required>
                <option value="PHONG_TOA">Phong tỏa (PHONG_TOA)</option>
                <option value="BAO_MAT">Báo mất (BAO_MAT)</option>
                <option value="DANG_HOAT_DONG">Giải tỏa / Kích hoạt lại (DANG_HOAT_DONG)</option>
              </select>
            </div>
            <div class="field full">
              <label>Lý do thay đổi (bắt buộc lưu Audit Log)</label>
              <input name="lyDo" required minlength="3" placeholder="Nhập lý do cập nhật trạng thái...">
            </div>
            <div class="field full form-actions">
              <button type="submit" class="btn btn-primary" ${
                  editableBooks.length ? '' : 'disabled'
              }>Cập nhật trạng thái</button>
            </div>
          </form>
        </section>`;

        const form = $('#status-form', container);
        form.onsubmit = async (e) => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form));
            const btn = form.querySelector('button[type="submit"]');
            await withButtonLoading(btn, 'Đang cập nhật...', async () => {
                try {
                    const res = await savingsApi.updatePassbookStatus(d.maSo, {
                        trangThaiMoi: d.trangThaiMoi,
                        lyDo: d.lyDo
                    });
                    toast(`Đã đổi trạng thái sổ ${res.maSo}: ${res.trangThaiCu} → ${res.trangThaiMoi}.`);
                    await renderBookStatusPage(container);
                } catch (err) {
                    toast(err.message, 'error');
                }
            });
        };
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}
