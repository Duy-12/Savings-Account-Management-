/**
 * Màn hình Quản trị & Tự động hóa: Báo cáo (FR-10), Tài khoản (FR-11), Lãi suất (FR-12), Thông báo (FR-13) & Tái tục (FR-14)
 * File: frontend/js/pages/adminMgmt.page.js
 */
import * as adminApi from '../api/admin.api.js';
import * as savingsApi from '../api/savings.api.js';
import { store } from '../state/store.js';
import { $, $$, escapeHtml, toast, withButtonLoading } from '../utils/ui.js';
import { downloadCSV, fmtDate, money, roleNames, statusBadge, termLabel, today } from '../utils/format.js';
import { buildPassbooksTableHtml } from './dashboard.page.js';

export async function renderReportsPage(container) {
    container.innerHTML = `
    <section class="panel">
      <div class="panel-head">
        <div><h3>Báo cáo &amp; thống kê (FR-10)</h3><p>Tổng hợp số liệu trực tiếp từ sổ cái giao dịch và sổ tiết kiệm trong MySQL.</p></div>
      </div>
      <form id="report-form" class="form-grid">
        <div class="field">
          <label>Loại báo cáo</label>
          <select name="type">
            <option value="TONG_HOP">Tổng hợp sổ tiết kiệm</option>
            <option value="SO_MO_MOI">Sổ mở mới trong kỳ</option>
            <option value="SO_DEN_HAN">Sổ đến hạn cần xử lý</option>
          </select>
        </div>
        <div class="field">
          <label>Lọc trạng thái</label>
          <select name="status">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DANG_HOAT_DONG">Đang hoạt động</option>
            <option value="PHONG_TOA">Phong tỏa</option>
            <option value="BAO_MAT">Báo mất</option>
            <option value="DA_TAT_TOAN">Đã tất toán</option>
          </select>
        </div>
        <div class="field"><label>Từ ngày</label><input name="from" type="date" value="2026-01-01" required></div>
        <div class="field"><label>Đến ngày</label><input name="to" type="date" value="${today()}" required></div>
        <div class="field full form-actions">
          <button type="submit" class="btn btn-primary">Tạo báo cáo</button>
        </div>
      </form>
    </section>
    <section class="panel" id="report-result"><div class="empty">Chọn khoảng thời gian và bấm “Tạo báo cáo”.</div></section>`;

    const form = $('#report-form', container);
    const resultEl = $('#report-result', container);

    async function runReport() {
        const d = Object.fromEntries(new FormData(form));
        const btn = form.querySelector('button[type="submit"]');
        await withButtonLoading(btn, 'Đang tổng hợp...', async () => {
            try {
                const data = await adminApi.getReports(d);
                const s = data.summary || {};
                const rows = data.rows || [];

                resultEl.innerHTML = `
                <div class="panel-head">
                  <div><h3>Kết quả báo cáo (${fmtDate(d.from)} → ${fmtDate(d.to)})</h3><p>${rows.length} sổ phù hợp</p></div>
                  <button type="button" class="btn btn-light btn-sm" id="export-report">Xuất CSV</button>
                </div>
                <div class="stats">
                  <div class="stat"><div class="stat-head">Số lượng sổ</div><div class="stat-value">${s.totalBooks || 0}</div></div>
                  <div class="stat"><div class="stat-head">Tổng gốc danh mục</div><div class="stat-value">${money(s.totalPrincipal)}</div></div>
                  <div class="stat"><div class="stat-head">Tổng thu gửi trong kỳ</div><div class="stat-value positive">${money(s.totalDeposits)}</div></div>
                  <div class="stat"><div class="stat-head">Tổng chi trả lãi</div><div class="stat-value">${money(s.totalInterestPaid)}</div></div>
                </div>
                <div style="margin-top:15px">${buildPassbooksTableHtml(rows)}</div>`;

                $('#export-report', resultEl).onclick = () => {
                    downloadCSV('bao-cao-so-tiet-kiem.csv', [
                        ['Mã sổ', 'Khách hàng', 'CCCD', 'Kỳ hạn', 'Tiền gốc', 'Lãi suất (%)', 'Ngày mở', 'Đáo hạn', 'Trạng thái'],
                        ...rows.map((r) => [
                            r.ma_so,
                            r.ten_khach_hang,
                            r.so_cccd || '',
                            termLabel(r.thoi_han, r.don_vi_thoi_han, r.loai_ky_han),
                            r.so_tien_goc,
                            r.lai_suat_ap_dung,
                            r.ngay_mo,
                            r.ngay_dao_han || '',
                            r.trang_thai
                        ])
                    ]);
                };
            } catch (err) {
                toast(err.message, 'error');
            }
        });
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        runReport();
    };
    await runReport();
}

export async function renderAccountsPage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải danh sách tài khoản...</div></div>';

    try {
        const accounts = await adminApi.listAccounts();
        const isAdmin = store.role === 'ADMIN';

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div><h3>Tài khoản người dùng &amp; phân quyền (FR-11)</h3><p>Quản lý vai trò RBAC và trạng thái khóa tài khoản.</p></div>
            ${isAdmin ? '<button class="btn btn-primary btn-sm" id="new-account">＋ Tạo tài khoản</button>' : ''}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Tên đăng nhập</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr>
              </thead>
              <tbody>
                ${accounts
                    .map((a) => {
                        const roleCode = (a.roles && a.roles[0]) || 'KHACH_HANG';
                        return `
                        <tr>
                          <td class="strong">${escapeHtml(a.ten_dang_nhap)}</td>
                          <td>${escapeHtml(a.ho_ten)}</td>
                          <td>${escapeHtml(a.email)}</td>
                          <td>${escapeHtml(roleNames[roleCode] || roleCode)}</td>
                          <td>${statusBadge(a.trang_thai)}</td>
                          <td>${
                              isAdmin
                                  ? `<button class="btn btn-light btn-sm" data-acc-id="${a.tai_khoan_id}">Phân quyền</button>`
                                  : ''
                          }</td>
                        </tr>`;
                    })
                    .join('')}
              </tbody>
            </table>
          </div>
        </section>
        <section class="panel" id="account-editor" hidden></section>
        <section class="panel">
          <h3>Ma trận quyền theo vai trò (RBAC)</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Chức năng</th><th>Khách hàng</th><th>Giao dịch viên</th><th>Kiểm soát viên</th><th>Admin</th></tr></thead>
              <tbody>
                ${[
                    ['Xem sổ cá nhân', '✓', '✓', '✓', '✓'],
                    ['Mở sổ online', '✓', '—', '—', '—'],
                    ['Mở sổ tại quầy', '—', '✓', '—', '✓'],
                    ['Tất toán sổ', '✓ (chính chủ)', '✓', '✓', '✓'],
                    ['Quản lý khách hàng', '—', '✓', '✓', '✓'],
                    ['Báo cáo & thống kê', '—', '✓', '✓', '✓'],
                    ['Cấu hình lãi suất & Jobs', '—', '—', '✓', '✓'],
                    ['Tài khoản & phân quyền', '—', '—', 'Chỉ xem', '✓']
                ]
                    .map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`)
                    .join('')}
              </tbody>
            </table>
          </div>
        </section>`;

        if (isAdmin) {
            const editor = $('#account-editor', container);

            function openAccountEditor(account = null) {
                const isEdit = Boolean(account);
                const currentRole = (account?.roles && account.roles[0]) || 'GIAO_DICH_VIEN';
                editor.hidden = false;
                editor.innerHTML = `
                <h3>${isEdit ? `Cập nhật quyền & trạng thái: ${escapeHtml(account.ten_dang_nhap)}` : 'Tạo tài khoản nội bộ mới'}</h3>
                <form id="account-form" class="form-grid" style="margin-top:14px">
                  ${
                      isEdit
                          ? ''
                          : `<div class="field"><label>Tên đăng nhập</label><input name="tenDangNhap" required minlength="4"></div>
                             <div class="field"><label>Họ tên</label><input name="hoTen" required></div>
                             <div class="field"><label>Email</label><input name="email" type="email" required></div>
                             <div class="field"><label>Mật khẩu khởi tạo</label><input name="matKhau" type="password" minlength="8" required></div>`
                  }
                  <div class="field">
                    <label>Vai trò</label>
                    <select name="vaiTro">
                      ${Object.entries(roleNames)
                          .map(
                              ([k, v]) =>
                                  `<option value="${k}" ${k === currentRole ? 'selected' : ''}>${escapeHtml(v)}</option>`
                          )
                          .join('')}
                    </select>
                  </div>
                  ${
                      isEdit
                          ? `<div class="field">
                               <label>Trạng thái tài khoản</label>
                               <select name="trangThai">
                                 <option value="HOAT_DONG" ${account.trang_thai === 'HOAT_DONG' ? 'selected' : ''}>Hoạt động</option>
                                 <option value="KHOA_TAM_THOI" ${account.trang_thai === 'KHOA_TAM_THOI' ? 'selected' : ''}>Khóa tạm thời</option>
                                 <option value="NGUNG_HOAT_DONG" ${account.trang_thai === 'NGUNG_HOAT_DONG' ? 'selected' : ''}>Ngừng hoạt động</option>
                               </select>
                             </div>`
                          : ''
                  }
                  <div class="field full form-actions">
                    <button type="button" class="btn btn-light" id="cancel-acc-edit">Đóng</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button>
                  </div>
                </form>`;

                $('#cancel-acc-edit', editor).onclick = () => {
                    editor.hidden = true;
                };

                const form = $('#account-form', editor);
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const d = Object.fromEntries(new FormData(form));
                    const btn = form.querySelector('button[type="submit"]');
                    await withButtonLoading(btn, 'Đang lưu...', async () => {
                        try {
                            if (isEdit) {
                                await adminApi.updateAccount(account.tai_khoan_id, d);
                                toast('Cập nhật tài khoản & phân quyền thành công.');
                            } else {
                                await adminApi.createAccount(d);
                                toast('Tạo tài khoản mới thành công.');
                            }
                            await renderAccountsPage(container);
                        } catch (err) {
                            toast(err.message, 'error');
                        }
                    });
                };
            }

            $('#new-account', container).onclick = () => openAccountEditor(null);
            $$('[data-acc-id]', container).forEach((btn) => {
                btn.onclick = () => {
                    const acc = accounts.find((x) => Number(x.tai_khoan_id) === Number(btn.dataset.accId));
                    openAccountEditor(acc || null);
                };
            });
        }
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}

export async function renderRatesPage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải biểu lãi suất...</div></div>';

    try {
        const rates = await adminApi.listRates();
        store.rates = rates;
        const canEdit = ['ADMIN', 'KIEM_SOAT_VIEN'].includes(store.role);

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div><h3>Danh mục sản phẩm &amp; biểu lãi suất (FR-12)</h3><p>Lưu lịch sử hiệu lực biểu lãi suất khi thay đổi.</p></div>
            ${canEdit ? '<button class="btn btn-primary btn-sm" id="add-rate">＋ Thêm kỳ hạn</button>' : ''}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Sản phẩm</th><th>Kỳ hạn</th><th>Lãi suất (%/năm)</th><th>Số tiền tối thiểu</th><th>Hiệu lực từ</th><th></th></tr>
              </thead>
              <tbody>
                ${rates
                    .map(
                        (r) => `
                  <tr>
                    <td>${escapeHtml(r.ten_san_pham)}</td>
                    <td class="strong">${escapeHtml(termLabel(r.thoi_han, r.don_vi_thoi_han, r.loai_ky_han))}</td>
                    <td><b>${Number(r.lai_suat_nam)}%</b></td>
                    <td>${money(r.so_tien_toi_thieu)}</td>
                    <td>${fmtDate(r.hieu_luc_tu)}</td>
                    <td>${
                        canEdit
                            ? `<button class="btn btn-light btn-sm" data-rate-id="${r.ky_han_id}">Điều chỉnh</button>`
                            : ''
                    }</td>
                  </tr>`
                    )
                    .join('')}
              </tbody>
            </table>
          </div>
        </section>
        <section class="panel" id="rate-editor" hidden></section>`;

        if (canEdit) {
            const editor = $('#rate-editor', container);

            function openRateEditor(rate = null) {
                const isEdit = Boolean(rate);
                const productMap = new Map([
                    [1, 'Tiết kiệm Thông thường VND'],
                    [2, 'Tiết kiệm Tích lũy Tương lai']
                ]);
                rates.forEach((r) => productMap.set(Number(r.san_pham_id), r.ten_san_pham));

                editor.hidden = false;
                editor.innerHTML = `
                <h3>${
                    isEdit
                        ? `Cập nhật lãi suất: ${escapeHtml(termLabel(rate.thoi_han, rate.don_vi_thoi_han, rate.loai_ky_han))}`
                        : 'Thêm kỳ hạn tiết kiệm mới'
                }</h3>
                <form id="rate-form" class="form-grid" style="margin-top:14px">
                  ${
                      isEdit
                          ? ''
                          : `<div class="field">
                               <label>Sản phẩm tiết kiệm</label>
                               <select name="sanPhamId" required>
                                 ${[...productMap.entries()]
                                     .map(([id, name]) => `<option value="${id}">${escapeHtml(name)}</option>`)
                                     .join('')}
                               </select>
                             </div>
                             <div class="field"><label>Số kỳ hạn (tháng)</label><input name="thoiHan" type="number" min="0" required placeholder="VD: 9 hoặc 24"></div>`
                  }
                  <div class="field"><label>Lãi suất (%/năm)</label><input name="laiSuatNam" type="number" min="0.01" step="0.01" value="${
                      isEdit ? Number(rate.lai_suat_nam) : ''
                  }" required></div>
                  <div class="field"><label>Số tiền tối thiểu (VNĐ)</label><input name="soTienToiThieu" type="number" min="1000" value="${
                      isEdit ? Number(rate.so_tien_toi_thieu) : 100000
                  }" required></div>
                  <div class="field full form-actions">
                    <button type="button" class="btn btn-light" id="cancel-rate-edit">Đóng</button>
                    <button type="submit" class="btn btn-primary">Lưu cấu hình</button>
                  </div>
                </form>`;

                $('#cancel-rate-edit', editor).onclick = () => {
                    editor.hidden = true;
                };

                const form = $('#rate-form', editor);
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const d = Object.fromEntries(new FormData(form));
                    const btn = form.querySelector('button[type="submit"]');
                    await withButtonLoading(btn, 'Đang lưu...', async () => {
                        try {
                            if (isEdit) {
                                await adminApi.updateRate(rate.ky_han_id, {
                                    laiSuatNam: Number(d.laiSuatNam),
                                    soTienToiThieu: Number(d.soTienToiThieu)
                                });
                                toast('Cập nhật biểu lãi suất mới thành công.');
                            } else {
                                await adminApi.createRate({
                                    sanPhamId: Number(d.sanPhamId || 1),
                                    thoiHan: Number(d.thoiHan),
                                    laiSuatNam: Number(d.laiSuatNam),
                                    soTienToiThieu: Number(d.soTienToiThieu)
                                });
                                toast('Thêm kỳ hạn & biểu lãi suất mới thành công.');
                            }
                            await renderRatesPage(container);
                        } catch (err) {
                            toast(err.message, 'error');
                        }
                    });
                };
            }

            $('#add-rate', container).onclick = () => openRateEditor(null);
            $$('[data-rate-id]', container).forEach((btn) => {
                btn.onclick = () => {
                    const found = rates.find((r) => Number(r.ky_han_id) === Number(btn.dataset.rateId));
                    openRateEditor(found || null);
                };
            });
        }
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}

export async function renderNotificationsPage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải lịch sử thông báo...</div></div>';

    try {
        const logs = await adminApi.listNotifications();
        const canScan = ['ADMIN', 'KIEM_SOAT_VIEN'].includes(store.role);

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div><h3>Thông báo đáo hạn &amp; lịch sử gửi (FR-13 &amp; EX-02)</h3><p>Quét sổ hoạt động có ngày đáo hạn trong 3 ngày tới và gửi tin nhắn.</p></div>
            ${canScan ? '<button class="btn btn-primary btn-sm" id="scan-maturity">▶ Chạy quét đáo hạn ngay</button>' : ''}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Khách hàng</th><th>Loại</th><th>Nội dung</th><th>Kênh</th><th>Ngày tạo</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                ${
                    logs.length
                        ? logs
                              .map(
                                  (n) => `
                          <tr>
                            <td class="strong">${escapeHtml(n.ten_khach_hang)}</td>
                            <td>${escapeHtml(n.loai_thong_bao)}</td>
                            <td>${escapeHtml(n.noi_dung)}</td>
                            <td>${escapeHtml(n.kenh_gui)}</td>
                            <td>${fmtDate(n.ngay_tao)}</td>
                            <td>${statusBadge(n.trang_thai_gui)}</td>
                          </tr>`
                              )
                              .join('')
                        : '<tr><td colspan="6"><div class="empty">Chưa có log thông báo.</div></td></tr>'
                }
              </tbody>
            </table>
          </div>
        </section>`;

        if (canScan) {
            const btn = $('#scan-maturity', container);
            btn.onclick = async () => {
                await withButtonLoading(btn, 'Đang quét...', async () => {
                    try {
                        const res = await adminApi.triggerMaturityScan();
                        toast(`Đã quét ${res.scannedCount} sổ sắp đáo hạn (${res.sentCount} gửi thành công).`);
                        await renderNotificationsPage(container);
                    } catch (err) {
                        toast(err.message, 'error');
                    }
                });
            };
        }
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}

export async function renderRolloverPage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải danh sách sổ...</div></div>';

    try {
        const books = await savingsApi.listPassbooks({ status: 'DANG_HOAT_DONG' });
        const todayIso = today();
        const dueBooks = books.filter((b) => b.ngay_dao_han && b.ngay_dao_han <= todayIso);
        const canRun = ['ADMIN', 'KIEM_SOAT_VIEN'].includes(store.role);

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Xử lý tái tục sổ tự động cuối ngày (FR-14)</h3>
              <p>Tự động tính lãi thực tế kỳ cũ và tạo chu kỳ mới cho các sổ đến hạn có chỉ thị tái tục.</p>
            </div>
            ${canRun ? '<button class="btn btn-primary btn-sm" id="run-rollover">▶ Chạy tái tục tự động ngay</button>' : ''}
          </div>
          ${buildPassbooksTableHtml(dueBooks)}
          <div class="notice warn" style="margin-top:13px">
            Cron Job tự động chạy lúc 23:55 mỗi ngày. Nút trên cho phép Kiểm soát viên / Admin kích hoạt xử lý ngay trong Transaction ACID.
          </div>
          <div id="rollover-result"></div>
        </section>`;

        if (canRun) {
            const btn = $('#run-rollover', container);
            btn.onclick = async () => {
                await withButtonLoading(btn, 'Đang tái tục...', async () => {
                    try {
                        const res = await adminApi.triggerRollover();
                        toast(`Hoàn tất tái tục ${res.rolledOverCount}/${res.dueCount} sổ (bỏ qua ${res.skippedCount}).`);
                        await renderRolloverPage(container);
                    } catch (err) {
                        toast(err.message, 'error');
                    }
                });
            };
        }
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}
