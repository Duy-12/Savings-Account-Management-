/**
 * Màn hình Tra cứu sổ (FR-05), Tính tiền lãi (FR-06) & Tất toán (FR-07, EX-03)
 * File: frontend/js/pages/savingsOps.page.js
 */
import * as savingsApi from '../api/savings.api.js';
import * as adminApi from '../api/admin.api.js';
import { $, $$, escapeHtml, toast, withButtonLoading } from '../utils/ui.js';
import { fmtDate, money, rolloverLabel, statusBadge, termLabel, today } from '../utils/format.js';

function renderSearchTable(list) {
    if (!list.length) {
        return '<div class="empty">Không tìm thấy sổ tiết kiệm phù hợp.</div>';
    }
    return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mã sổ / Chủ sổ</th>
            <th>Kỳ hạn</th>
            <th>Tiền gốc</th>
            <th>Lãi suất</th>
            <th>Lãi tạm tính</th>
            <th>Đáo hạn</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${list
              .map(
                  (b) => `
            <tr>
              <td>
                <span class="strong">${escapeHtml(b.ma_so)}</span>
                <span class="sub">${escapeHtml(b.ten_khach_hang)} · ${escapeHtml(b.so_cccd || '—')}</span>
              </td>
              <td>${escapeHtml(termLabel(b.thoi_han, b.don_vi_thoi_han, b.loai_ky_han))}</td>
              <td>${money(b.so_tien_goc)}</td>
              <td>${Number(b.lai_suat_ap_dung)}%</td>
              <td class="positive"><b>${money(b.tienLaiTamTinh)}</b></td>
              <td>${fmtDate(b.ngay_dao_han)}</td>
              <td>${statusBadge(b.trang_thai)}</td>
              <td><button class="btn btn-light btn-sm" data-detail="${escapeHtml(b.ma_so)}">Chi tiết</button></td>
            </tr>`
              )
              .join('')}
        </tbody>
      </table>
    </div>`;
}

export async function renderSearchPage(container) {
    container.innerHTML = `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h3>Tra cứu thông tin sổ tiết kiệm (FR-05)</h3>
          <p>Tìm theo mã sổ, số CCCD hoặc tên khách hàng (kèm tiền lãi tạm tính đến hôm nay).</p>
        </div>
      </div>
      <div class="toolbar">
        <input class="searchbox" id="book-search" placeholder="Nhập mã sổ / CCCD / tên khách hàng">
        <button class="btn btn-primary" id="search-btn">⌕ Tra cứu</button>
        <button class="btn btn-light" id="clear-search">Xóa lọc</button>
      </div>
      <div id="search-results" style="margin-top:16px"><div class="empty">Đang tải danh sách sổ...</div></div>
    </section>
    <section class="panel" id="book-detail-panel" hidden></section>`;

    const resultsEl = $('#search-results', container);
    const detailPanel = $('#book-detail-panel', container);

    async function loadList(q = '') {
        try {
            const list = await savingsApi.listPassbooks({ q });
            resultsEl.innerHTML = renderSearchTable(list);
            if (q && !list.length) toast('Không tìm thấy dữ liệu phù hợp.', 'error');
            $$('[data-detail]', resultsEl).forEach((btn) => {
                btn.onclick = () => showDetail(btn.dataset.detail);
            });
        } catch (err) {
            resultsEl.innerHTML = `<div class="notice error">${escapeHtml(err.message)}</div>`;
        }
    }

    async function showDetail(maSo) {
        detailPanel.hidden = false;
        detailPanel.innerHTML = '<div class="empty">Đang tải chi tiết sổ...</div>';
        try {
            const d = await savingsApi.getPassbookDetail(maSo);
            detailPanel.innerHTML = `
            <div class="panel-head">
              <div>
                <h3>Chi tiết sổ ${escapeHtml(d.ma_so)}</h3>
                <p>${escapeHtml(d.ten_san_pham)} · Chỉ thị: ${escapeHtml(rolloverLabel(d.chi_thi_dao_han))}</p>
              </div>
              ${statusBadge(d.trang_thai)}
            </div>
            <div class="grid-2">
              <div>
                <div class="metric-line"><span>Chủ sổ</span><b>${escapeHtml(d.ten_khach_hang)} (${escapeHtml(d.so_cccd || '—')})</b></div>
                <div class="metric-line"><span>Tiền gốc hiện tại</span><b>${money(d.so_tien_goc)}</b></div>
                <div class="metric-line"><span>Lãi suất áp dụng</span><b>${Number(d.lai_suat_ap_dung)}%/năm</b></div>
                <div class="metric-line"><span>Lãi tạm tính</span><b class="positive">${money(d.tienLaiTamTinh)}</b></div>
                <div class="metric-line"><span>Ngày bắt đầu / Đáo hạn</span><b>${fmtDate(d.ngay_bat_dau)} → ${fmtDate(d.ngay_dao_han)}</b></div>
              </div>
              <div>
                <h4 style="margin:0 0 10px">Lịch sử thay đổi trạng thái</h4>
                <div class="timeline">
                  ${(d.statusHistory || [])
                      .map(
                          (h) => `
                    <div class="timeline-item">
                      <span class="dot"></span>
                      <div>
                        <b>${escapeHtml(h.trang_thai_moi)}</b> (${escapeHtml(h.nguoi_thay_doi)})
                        <small>${escapeHtml(h.ly_do || '—')} · ${fmtDate(h.thoi_diem_thay_doi)}</small>
                      </div>
                    </div>`
                      )
                      .join('') || '<div class="empty">Chưa có lịch sử.</div>'}
                </div>
              </div>
            </div>`;
        } catch (err) {
            detailPanel.innerHTML = `<div class="notice error">${escapeHtml(err.message)}</div>`;
        }
    }

    $('#search-btn', container).onclick = () => loadList($('#book-search', container).value.trim());
    $('#book-search', container).onkeydown = (e) => {
        if (e.key === 'Enter') loadList($('#book-search', container).value.trim());
    };
    $('#clear-search', container).onclick = () => {
        $('#book-search', container).value = '';
        detailPanel.hidden = true;
        loadList('');
    };

    await loadList('');
}

export async function renderInterestPage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải biểu lãi suất...</div></div>';

    try {
        const rates = await adminApi.listRates();
        container.innerHTML = `
        <div class="grid-2">
          <section class="panel">
            <div class="panel-head">
              <div><h3>Tính và tra cứu tiền lãi (FR-06)</h3><p>Tính toán chính xác tại Backend theo công thức Core Banking (365 ngày/năm).</p></div>
            </div>
            <form id="interest-form" class="form-grid">
              <div class="field full">
                <label>Số tiền gốc (VNĐ)</label>
                <input name="soTienGoc" type="number" min="1" value="50000000" required>
              </div>
              <div class="field">
                <label>Kỳ hạn tham chiếu</label>
                <select name="kyHanId" id="interest-term">
                  ${rates
                      .map(
                          (r) =>
                              `<option value="${r.ky_han_id}" data-rate="${Number(r.lai_suat_nam)}">${escapeHtml(
                                  termLabel(r.thoi_han, r.don_vi_thoi_han, r.loai_ky_han)
                              )} (${Number(r.lai_suat_nam)}%)</option>`
                      )
                      .join('')}
                </select>
              </div>
              <div class="field">
                <label>Lãi suất (%/năm)</label>
                <input name="laiSuatNam" id="interest-rate-input" type="number" min="0" step="0.01" value="${
                    rates[0] ? Number(rates[0].lai_suat_nam) : 3.5
                }" required>
              </div>
              <div class="field">
                <label>Ngày bắt đầu</label>
                <input name="ngayBatDau" type="date" value="2026-08-01" required>
              </div>
              <div class="field">
                <label>Ngày tính đến</label>
                <input name="ngayTinhDen" type="date" value="${today()}" required>
              </div>
              <div class="field full">
                <button class="btn btn-primary" type="submit">Tính tiền lãi</button>
              </div>
            </form>
          </section>

          <section class="panel">
            <h3>Kết quả tính toán</h3>
            <div id="interest-result" class="empty">Nhập tham số hợp lệ và chọn “Tính tiền lãi”.</div>
            <div class="notice" style="margin-top:12px">Kết quả được tính trực tiếp từ API <code>/api/interest/calculate</code>.</div>
          </section>
        </div>`;

        const termSelect = $('#interest-term', container);
        const rateInput = $('#interest-rate-input', container);
        termSelect.onchange = () => {
            const opt = termSelect.selectedOptions[0];
            if (opt && opt.dataset.rate) rateInput.value = opt.dataset.rate;
        };

        const form = $('#interest-form', container);
        form.onsubmit = async (e) => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form));
            const btn = form.querySelector('button[type="submit"]');
            await withButtonLoading(btn, 'Đang tính...', async () => {
                try {
                    const res = await savingsApi.calculateInterest({
                        soTienGoc: Number(d.soTienGoc),
                        kyHanId: Number(d.kyHanId),
                        laiSuatNam: Number(d.laiSuatNam),
                        ngayBatDau: d.ngayBatDau,
                        ngayTinhDen: d.ngayTinhDen
                    });
                    $('#interest-result', container).innerHTML = `
                    <div class="calc-result">
                      <div class="sub">Tiền lãi dự kiến (${res.soNgayGui} ngày thực gửi)</div>
                      <div class="amount">${money(res.tienLaiDuKien)}</div>
                      <div class="metric-line"><span>Tiền gốc</span><b>${money(res.soTienGoc)}</b></div>
                      <div class="metric-line"><span>Lãi suất áp dụng</span><b>${res.laiSuatApDung}%/năm</b></div>
                      <div class="metric-line"><span>Tổng gốc + lãi</span><b>${money(res.tongGocVaLai)}</b></div>
                    </div>`;
                } catch (err) {
                    toast(err.message, 'error');
                }
            });
        };
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}

export async function renderSettlementPage(container, go) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải danh sách sổ...</div></div>';

    try {
        const books = await savingsApi.listPassbooks({ status: 'DANG_HOAT_DONG' });
        if (!books.length) {
            container.innerHTML =
                '<section class="panel"><div class="empty">Hiện không có sổ nào ở trạng thái Đang hoạt động để tất toán.</div></section>';
            return;
        }

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Tất toán / Rút trước hạn (FR-07 &amp; EX-03)</h3>
              <p>Quy trình 2 bước: Kiểm tra điều kiện &amp; cảnh báo mất lãi (nếu trước hạn) → Xác nhận hạch toán Transaction.</p>
            </div>
          </div>
          <form id="settle-form" class="form-grid">
            <div class="field full">
              <label>Chọn sổ tiết kiệm</label>
              <select name="maSo" required>
                ${books
                    .map(
                        (b) =>
                            `<option value="${escapeHtml(b.ma_so)}">${escapeHtml(b.ma_so)} — ${escapeHtml(
                                b.ten_khach_hang
                            )} — ${money(b.so_tien_goc)} (${fmtDate(b.ngay_dao_han)})</option>`
                    )
                    .join('')}
              </select>
            </div>
            <div class="field">
              <label>Ngày tất toán</label>
              <input name="ngayTatToan" type="date" value="${today()}" required>
            </div>
            <div class="field">
              <label>Hình thức nhận tiền</label>
              <select name="hinhThucNhan">
                <option value="CHUYEN_KHOAN">Chuyển khoản vào tài khoản thanh toán</option>
                <option value="TAI_QUAY">Nhận tiền mặt tại quầy</option>
              </select>
            </div>
            <div class="field full">
              <div id="settle-preview" class="notice">Đang tính dự kiến tất toán...</div>
            </div>
            <div class="field full form-actions">
              <button type="submit" class="btn btn-primary">Tiếp tục kiểm tra &amp; xác nhận</button>
            </div>
          </form>
        </section>
        <section class="panel" id="settle-confirm" hidden></section>`;

        const form = $('#settle-form', container);
        const previewEl = $('#settle-preview', container);
        const confirmPanel = $('#settle-confirm', container);

        let latestPreview = null;

        async function refreshPreview() {
            const maSo = form.maSo.value;
            const ngayTatToan = form.ngayTatToan.value;
            previewEl.className = 'notice';
            previewEl.textContent = 'Đang tính toán số tiền thực nhận từ máy chủ...';
            try {
                const p = await savingsApi.previewSettlement(maSo, ngayTatToan);
                latestPreview = p;
                previewEl.className = `notice ${p.isBeforeMaturity ? 'warn' : 'success'}`;
                previewEl.innerHTML = `
                  <b>${escapeHtml(p.maSo)}</b> — ${
                    p.isBeforeMaturity
                        ? `⚠️ ${escapeHtml(p.canhBao)}`
                        : 'Đủ điều kiện tất toán đúng hạn / không kỳ hạn.'
                }<br>
                  Số ngày thực gửi: <b>${p.soNgayThucGui} ngày</b> · Gốc: <b>${money(p.tienGoc)}</b> ·
                  Lãi (${p.laiSuatApDung}%): <b>${money(p.tienLai)}</b> ·
                  Tổng thực nhận: <b>${money(p.tongTienNhan)}</b>`;
            } catch (err) {
                latestPreview = null;
                previewEl.className = 'notice error';
                previewEl.textContent = err.message;
            }
        }

        form.maSo.onchange = () => {
            confirmPanel.hidden = true;
            refreshPreview();
        };
        form.ngayTatToan.onchange = () => {
            confirmPanel.hidden = true;
            refreshPreview();
        };

        await refreshPreview();

        form.onsubmit = async (e) => {
            e.preventDefault();
            await refreshPreview();
            if (!latestPreview) return;

            const p = latestPreview;
            confirmPanel.hidden = false;
            confirmPanel.innerHTML = `
            <h3>Xác nhận thực hiện tất toán</h3>
            <p class="sub">${
                p.isBeforeMaturity
                    ? 'Cảnh báo EX-03: Bạn đang rút trước ngày đáo hạn, lãi suất bị tính lại theo mức Không kỳ hạn.'
                    : 'Xác nhận tất toán đúng hạn / không kỳ hạn.'
            }</p>
            <div class="notice ${p.isBeforeMaturity ? 'warn' : ''}">
              Mã sổ: <b>${escapeHtml(p.maSo)}</b><br>
              Ngày tất toán: <b>${fmtDate(p.ngayTatToan)}</b> (${p.soNgayThucGui} ngày)<br>
              Tiền gốc: <b>${money(p.tienGoc)}</b> · Tiền lãi: <b>${money(p.tienLai)}</b><br>
              Tổng số tiền thực nhận: <b>${money(p.tongTienNhan)}</b>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-light" id="cancel-settle">Hủy giao dịch</button>
              <button type="button" class="btn btn-primary" id="confirm-settle">Đồng ý tất toán</button>
            </div>`;

            $('#cancel-settle', confirmPanel).onclick = () => {
                confirmPanel.hidden = true;
                toast('Đã hủy giao dịch tất toán.', 'error');
            };

            const confirmBtn = $('#confirm-settle', confirmPanel);
            confirmBtn.onclick = async () => {
                await withButtonLoading(confirmBtn, 'Đang tất toán...', async () => {
                    try {
                        const res = await savingsApi.confirmSettlement(p.maSo, {
                            ngayTatToan: form.ngayTatToan.value,
                            hinhThucNhan: form.hinhThucNhan.value
                        });
                        toast(
                            `Tất toán ${res.maSo} thành công! Tổng thực nhận: ${money(
                                res.tongTienThucNhan
                            )} (Mã GD: #${res.giaoDichId}).`
                        );
                        go('search');
                    } catch (err) {
                        toast(err.message, 'error');
                    }
                });
            };
        };
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}
