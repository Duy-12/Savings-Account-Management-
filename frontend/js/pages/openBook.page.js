/**
 * Màn hình Mở sổ tiết kiệm Online (FR-03) & Mở sổ tại quầy (FR-04)
 * File: frontend/js/pages/openBook.page.js
 */
import * as savingsApi from '../api/savings.api.js';
import * as customerApi from '../api/customer.api.js';
import * as adminApi from '../api/admin.api.js';
import { store } from '../state/store.js';
import { $, escapeHtml, toast, withButtonLoading } from '../utils/ui.js';
import { fmtDate, money, rolloverLabel, statusBadge, termLabel } from '../utils/format.js';
import { isValidCccd } from '../utils/validators.js';

export async function renderOpenBookPage(container, isOnline, go) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải biểu lãi suất và tài khoản...</div></div>';

    try {
        const [rates, paymentAccounts] = await Promise.all([
            adminApi.listRates(),
            isOnline ? savingsApi.getPaymentAccounts() : Promise.resolve([])
        ]);
        store.rates = rates;

        const rateOptionsHtml = rates
            .map(
                (r) =>
                    `<option value="${r.ky_han_id}">${escapeHtml(r.ten_san_pham)} — ${escapeHtml(
                        termLabel(r.thoi_han, r.don_vi_thoi_han, r.loai_ky_han)
                    )} (${Number(r.lai_suat_nam)}%/năm · tối thiểu ${money(r.so_tien_toi_thieu)})</option>`
            )
            .join('');

        const payOptionsHtml = paymentAccounts.length
            ? paymentAccounts
                  .map(
                      (a) =>
                          `<option value="${a.tai_khoan_thanh_toan_id}">${escapeHtml(a.so_tai_khoan)} — Số dư: ${money(
                              a.so_du
                          )}</option>`
                  )
                  .join('')
            : '<option value="">Chưa có tài khoản thanh toán hoạt động</option>';

        container.innerHTML = `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>${isOnline ? 'Mở sổ tiết kiệm trực tuyến' : 'Mở sổ tiết kiệm tại quầy'}</h3>
              <p>${
                  isOnline
                      ? 'Chọn kỳ hạn, số tiền gửi và tài khoản thanh toán nguồn để trừ tiền tự động.'
                      : 'Nhập CCCD để tra cứu hồ sơ khách hàng trước khi ghi nhận sổ tại quầy.'
              }</p>
            </div>
            ${statusBadge(isOnline ? 'Online' : 'Tại quầy')}
          </div>

          ${
              isOnline
                  ? `<div class="notice">Điều kiện mở sổ online: số dư tài khoản thanh toán phải đủ số tiền gửi và không thấp hơn mức tối thiểu của sản phẩm.</div>`
                  : `<div class="toolbar" style="margin-bottom:14px">
                       <input class="searchbox" id="counter-cccd-lookup" placeholder="Nhập nhanh CCCD để kiểm tra hồ sơ...">
                       <button type="button" class="btn btn-light" id="counter-lookup-btn">⌕ Kiểm tra hồ sơ CCCD</button>
                     </div>
                     <div id="counter-customer-preview" class="notice" hidden></div>`
          }

          <form id="open-form" class="form-grid" style="margin-top:16px">
            ${
                isOnline
                    ? `<div class="field"><label>Chủ sở hữu</label><input value="${escapeHtml(
                          store.user.hoTen
                      )}" readonly></div>
                       <div class="field"><label>Tài khoản thanh toán nguồn</label><select name="taiKhoanNguonId" required>${payOptionsHtml}</select></div>`
                    : `<div class="field"><label>Số CCCD khách hàng</label><input name="soCccd" required pattern="[0-9]{9,12}" placeholder="Nhập 9–12 chữ số CCCD"></div>
                       <div class="field"><label>Họ tên khách hàng (tự điền khi tra cứu)</label><input id="counter-customer-name" readonly placeholder="Chưa kiểm tra CCCD"></div>`
            }

            <div class="field full">
              <label>Sản phẩm &amp; Kỳ hạn gửi</label>
              <select name="kyHanId" required>${rateOptionsHtml}</select>
            </div>

            <div class="field">
              <label>Số tiền gửi (VNĐ)</label>
              <input name="soTienGui" type="number" min="100000" step="1000" required placeholder="Tối thiểu 100.000">
            </div>

            <div class="field">
              <label>Chỉ thị khi đáo hạn</label>
              <select name="chiThiDaoHan">
                <option value="TAI_TUC_GOC_VA_LAI">Tự động tái tục gốc và lãi</option>
                <option value="TAI_TUC_GOC_CHUYEN_LAI">Tái tục gốc, chuyển lãi</option>
                <option value="KHONG_TAI_TUC">Không tái tục</option>
              </select>
            </div>

            ${
                isOnline
                    ? `<div class="field">
                         <label>Kênh nhận thông báo giao dịch</label>
                         <select name="kenhThongBao">
                           <option value="EMAIL">Email</option>
                           <option value="SMS">SMS</option>
                         </select>
                       </div>`
                    : `<div class="field">
                         <label>Giao dịch viên xử lý</label>
                         <input value="${escapeHtml(store.user.hoTen)}" readonly>
                       </div>`
            }

            <div class="field full">
              <div class="hint">Số tiền gửi và lãi suất áp dụng sẽ được hệ thống kiểm tra và xác nhận an toàn khi bạn bấm hoàn tất.</div>
            </div>

            <div class="field full form-actions">
              <button type="reset" class="btn btn-light">Nhập lại</button>
              <button type="submit" class="btn btn-primary">${
                  isOnline ? 'Xác nhận mở sổ online' : 'Ghi nhận mở sổ tại quầy'
              }</button>
            </div>
          </form>
        </section>
        <section class="panel receipt-card" id="counter-receipt" hidden></section>`;

        if (!isOnline) {
            const lookupInput = $('#counter-cccd-lookup', container);
            const lookupBtn = $('#counter-lookup-btn', container);
            const previewBox = $('#counter-customer-preview', container);
            const cccdField = $('#open-form [name="soCccd"]', container);
            const nameField = $('#counter-customer-name', container);

            lookupBtn.onclick = async () => {
                const cccd = lookupInput.value.trim();
                if (!isValidCccd(cccd)) {
                    toast('Số CCCD phải gồm 9–12 chữ số.', 'error');
                    return;
                }
                await withButtonLoading(lookupBtn, 'Đang tìm...', async () => {
                    try {
                        const found = await customerApi.listCustomers({ cccd });
                        if (!found.length) {
                            previewBox.hidden = false;
                            previewBox.className = 'notice warn';
                            previewBox.textContent =
                                'Không tìm thấy hồ sơ khách hàng theo CCCD này. Vui lòng tạo hồ sơ ở mục Quản lý khách hàng trước.';
                            nameField.value = '';
                            return;
                        }
                        const kh = found[0];
                        cccdField.value = kh.so_cccd;
                        nameField.value = kh.ho_ten;
                        previewBox.hidden = false;
                        previewBox.className = 'notice success';
                        previewBox.textContent = `Đã xác minh hồ sơ: ${kh.ho_ten} · SĐT: ${kh.so_dien_thoai || '—'} · Email: ${kh.email || '—'}`;
                    } catch (err) {
                        toast(err.message, 'error');
                    }
                });
            };
        }

        const form = $('#open-form', container);
        form.onsubmit = async (e) => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form));
            const submitBtn = form.querySelector('button[type="submit"]');

            await withButtonLoading(submitBtn, 'Đang xử lý giao dịch...', async () => {
                try {
                    if (isOnline) {
                        const res = await savingsApi.openOnline({
                            kyHanId: Number(d.kyHanId),
                            taiKhoanNguonId: d.taiKhoanNguonId ? Number(d.taiKhoanNguonId) : undefined,
                            soTienGui: Number(d.soTienGui),
                            chiThiDaoHan: d.chiThiDaoHan,
                            kenhThongBao: d.kenhThongBao
                        });
                        toast(
                            `Mở sổ ${res.maSo} thành công! Số dư còn lại: ${money(res.soDuConLai)}${
                                res.ngayDaoHan ? ` (Đáo hạn: ${fmtDate(res.ngayDaoHan)})` : ''
                            }`
                        );
                        go('search');
                    } else {
                        const res = await savingsApi.openCounter({
                            soCccd: String(d.soCccd).trim(),
                            kyHanId: Number(d.kyHanId),
                            soTienGui: Number(d.soTienGui),
                            chiThiDaoHan: d.chiThiDaoHan
                        });
                        toast(`Mở sổ tại quầy ${res.maSo} thành công (Chứng từ: ${res.chungTuId}).`);
                        const selectedTermText = form.kyHanId?.selectedOptions?.[0]?.textContent || '';
                        const receiptEl = $('#counter-receipt', container);
                        receiptEl.hidden = false;
                        receiptEl.innerHTML = `
                        <div class="panel-head">
                          <div>
                            <h3>Phiếu Xác nhận Mở Sổ Tiết Kiệm tại Quầy</h3>
                            <p>Mã chứng từ: <b>${escapeHtml(res.chungTuId)}</b> · Ngày lập: ${fmtDate(res.ngayMo)}</p>
                          </div>
                          ${statusBadge('DANG_HOAT_DONG')}
                        </div>
                        <div class="grid-2">
                          <div>
                            <div class="metric-line"><span>Mã sổ tiết kiệm</span><b>${escapeHtml(res.maSo)}</b></div>
                            <div class="metric-line"><span>Khách hàng (Chủ sổ)</span><b>${escapeHtml(res.chuSo)}</b></div>
                            <div class="metric-line"><span>Số CCCD định danh</span><b>${escapeHtml(res.soCccd)}</b></div>
                            <div class="metric-line"><span>Giao dịch viên lập phiếu</span><b>${escapeHtml(store.user.hoTen)}</b></div>
                          </div>
                          <div>
                            <div class="metric-line"><span>Sản phẩm &amp; kỳ hạn</span><b>${escapeHtml(selectedTermText)}</b></div>
                            <div class="metric-line"><span>Số tiền gửi gốc</span><b class="positive">${money(res.soTienGoc)}</b></div>
                            <div class="metric-line"><span>Lãi suất áp dụng</span><b>${Number(res.laiSuatApDung)}%/năm</b></div>
                            <div class="metric-line"><span>Ngày đáo hạn / Chỉ thị</span><b>${fmtDate(res.ngayDaoHan)} · ${escapeHtml(rolloverLabel(d.chiThiDaoHan))}</b></div>
                          </div>
                        </div>
                        <div class="form-actions no-print">
                          <button type="button" class="btn btn-light" id="receipt-new-btn">＋ Mở thêm sổ mới</button>
                          <button type="button" class="btn btn-light" id="receipt-list-btn">Xem danh sách sổ</button>
                          <button type="button" class="btn btn-primary" id="receipt-print-btn">🖨️ In chứng từ</button>
                        </div>`;
                        $('#receipt-print-btn', receiptEl).onclick = () => window.print();
                        $('#receipt-list-btn', receiptEl).onclick = () => go('search');
                        $('#receipt-new-btn', receiptEl).onclick = () => renderOpenBookPage(container, false, go);
                        receiptEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } catch (err) {
                    toast(err.message, 'error');
                }
            });
        };
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}
