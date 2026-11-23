/**
 * Màn hình Tổng quan (Dashboard) & Hồ sơ cá nhân (FR-02)
 * File: frontend/js/pages/dashboard.page.js
 */
import * as authApi from '../api/auth.api.js';
import * as savingsApi from '../api/savings.api.js';
import * as adminApi from '../api/admin.api.js';
import { store } from '../state/store.js';
import { $, $$, escapeHtml, toast, withButtonLoading } from '../utils/ui.js';
import { fmtDate, money, roleNames, statusBadge, termLabel } from '../utils/format.js';
import { isValidEmail, isValidPhone } from '../utils/validators.js';

export function buildPassbooksTableHtml(list) {
    if (!list || !list.length) {
        return '<div class="empty">Chưa có sổ tiết kiệm phù hợp.</div>';
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
            <th>Đáo hạn</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${list
              .map(
                  (b) => `
            <tr>
              <td>
                <span class="strong">${escapeHtml(b.ma_so)}</span>
                <span class="sub">${escapeHtml(b.ten_khach_hang)}</span>
              </td>
              <td>${escapeHtml(termLabel(b.thoi_han, b.don_vi_thoi_han, b.loai_ky_han))}</td>
              <td>${money(b.so_tien_goc)}</td>
              <td>${Number(b.lai_suat_ap_dung)}%</td>
              <td>${fmtDate(b.ngay_dao_han)}</td>
              <td>${statusBadge(b.trang_thai)}</td>
            </tr>`
              )
              .join('')}
        </tbody>
      </table>
    </div>`;
}

export async function renderDashboardPage(container, go) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải dữ liệu tổng quan từ máy chủ...</div></div>';

    try {
        const isCustomer = store.role === 'KHACH_HANG';
        const [books, rates, paymentAccounts] = await Promise.all([
            savingsApi.listPassbooks(),
            adminApi.listRates(),
            isCustomer ? savingsApi.getPaymentAccounts() : Promise.resolve([])
        ]);

        store.rates = rates;
        if (isCustomer) store.paymentAccounts = paymentAccounts;

        const totalPrincipal = books.reduce((sum, b) => sum + Number(b.so_tien_goc || 0), 0);
        const activeCount = books.filter((b) => b.trang_thai === 'DANG_HOAT_DONG').length;
        const todayIso = new Date().toISOString().slice(0, 10);
        const dueCount = books.filter(
            (b) => b.trang_thai === 'DANG_HOAT_DONG' && b.ngay_dao_han && b.ngay_dao_han <= todayIso
        ).length;

        const casaBalance = paymentAccounts.reduce((sum, a) => sum + Number(a.so_du || 0), 0);

        container.innerHTML = `
        <div class="welcome">
          <div>
            <h2>Xin chào, ${escapeHtml(store.user.hoTen)} 👋</h2>
            <p>
              ${
                  isCustomer
                      ? `Số dư tài khoản thanh toán khả dụng: <b>${money(casaBalance)}</b>`
                      : 'Theo dõi danh mục tiền gửi và hỗ trợ giao dịch tiết kiệm cho khách hàng.'
              }
            </p>
          </div>
          <div class="welcome-icon">🏦</div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-head">Tổng tiền gốc <span class="stat-icon">₫</span></div>
            <div class="stat-value">${money(totalPrincipal)}</div>
            <div class="stat-note">${books.length} sổ trong phạm vi hiển thị</div>
          </div>
          <div class="stat">
            <div class="stat-head">Sổ hoạt động <span class="stat-icon">▣</span></div>
            <div class="stat-value">${activeCount}</div>
            <div class="stat-note">Đang sinh lãi theo biểu quy định</div>
          </div>
          <div class="stat">
            <div class="stat-head">Sổ đến / quá hạn <span class="stat-icon">◷</span></div>
            <div class="stat-value">${dueCount}</div>
            <div class="stat-note">Cần xử lý tất toán / tái tục</div>
          </div>
          <div class="stat">
            <div class="stat-head">Kỳ hạn tiết kiệm <span class="stat-icon">％</span></div>
            <div class="stat-value">${rates.length}</div>
            <div class="stat-note">Đang áp dụng theo biểu hiện hành</div>
          </div>
        </div>

        <div class="grid-2">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h3>${isCustomer ? 'Sổ tiết kiệm của tôi' : 'Sổ tiết kiệm gần đây'}</h3>
                <p>Số liệu được cập nhật theo thời gian thực</p>
              </div>
              <button class="btn btn-light btn-sm" data-goto="search">Xem tất cả →</button>
            </div>
            ${buildPassbooksTableHtml(books.slice(0, 5))}
          </section>

          <section class="panel">
            <div class="panel-head">
              <div><h3>Truy cập nhanh</h3><p>Các nghiệp vụ thường dùng</p></div>
            </div>
            <div class="quick-grid">
              <button class="quick" data-goto="${isCustomer ? 'open-online' : 'open-counter'}">
                <span>＋</span><b>Mở sổ tiết kiệm</b><small>Tạo sổ mới</small>
              </button>
              <button class="quick" data-goto="search">
                <span>⌕</span><b>Tra cứu sổ</b><small>Xem số dư, kỳ hạn</small>
              </button>
              <button class="quick" data-goto="interest">
                <span>％</span><b>Tính tiền lãi</b><small>Ước tính lãi nhận</small>
              </button>
              <button class="quick" data-goto="settlement">
                <span>↗</span><b>Tất toán sổ</b><small>Kiểm tra tiền thực nhận</small>
              </button>
            </div>
            <div class="notice success" style="margin-top:13px">
              Mọi giao dịch mở sổ, tính lãi và tất toán đều được kiểm tra và ghi nhận tức thì.
            </div>
          </section>
        </div>`;

        $$('[data-goto]', container).forEach((btn) => {
            btn.onclick = () => go(btn.dataset.goto);
        });
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}

export async function renderProfilePage(container) {
    container.innerHTML = '<div class="panel"><div class="empty">Đang tải hồ sơ cá nhân...</div></div>';

    try {
        const profile = await authApi.getProfile();
        container.innerHTML = `
        <section class="panel">
          <div class="profile-row">
            <div class="profile-avatar">👤</div>
            <div>
              <h3>${escapeHtml(profile.ho_ten)}</h3>
              <span class="badge blue">${escapeHtml(roleNames[store.role] || store.role)}</span>
            </div>
          </div>
          <form id="profile-form" class="form-grid">
            <div class="field">
              <label>Họ và tên</label>
              <input name="hoTen" value="${escapeHtml(profile.ho_ten)}" required>
            </div>
            <div class="field">
              <label>Số CCCD / Mã nhân viên</label>
              <input value="${escapeHtml(profile.so_cccd || profile.ma_nhan_vien || '—')}" readonly>
            </div>
            <div class="field">
              <label>Số điện thoại</label>
              <input name="soDienThoai" value="${escapeHtml(profile.so_dien_thoai || '')}" pattern="0[0-9]{9,10}" required>
            </div>
            <div class="field">
              <label>Email</label>
              <input name="email" type="email" value="${escapeHtml(profile.email || '')}" required>
            </div>
            <div class="field full">
              <label>Địa chỉ</label>
              <input name="diaChi" value="${escapeHtml(profile.dia_chi || '')}" placeholder="Nhập địa chỉ liên hệ">
            </div>
            <div class="field full">
              <div class="hint">Số CCCD và Vai trò được khóa tại máy chủ. Kiểm tra định dạng email và SĐT trước khi lưu.</div>
            </div>
            <div class="field full form-actions">
              <button class="btn btn-primary" type="submit">Lưu thay đổi</button>
            </div>
          </form>
        </section>`;

        const form = $('#profile-form', container);
        form.onsubmit = async (e) => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form));
            if (!isValidPhone(d.soDienThoai) || !isValidEmail(d.email)) {
                toast('Email hoặc số điện thoại không đúng định dạng.', 'error');
                return;
            }
            const btn = form.querySelector('button[type="submit"]');
            await withButtonLoading(btn, 'Đang lưu...', async () => {
                try {
                    const updated = await authApi.updateProfile(d);
                    store.user.hoTen = updated.ho_ten;
                    toast('Cập nhật thông tin cá nhân thành công.');
                    const topName = $('#topbar-account b');
                    if (topName) topName.textContent = updated.ho_ten;
                } catch (err) {
                    toast(err.message, 'error');
                }
            });
        };
    } catch (err) {
        container.innerHTML = `<div class="panel"><div class="notice error">${escapeHtml(err.message)}</div></div>`;
    }
}
