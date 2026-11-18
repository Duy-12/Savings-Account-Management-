/**
 * Entry Point & Router SPA cho CoreSavings (Vanilla JS ES6 Modules)
 * Đã hoán đổi vị trí theo yêu cầu:
 *   - Góc trên bên phải (.top-actions): Nút Tài khoản (#topbar-account -> mở Hồ sơ cá nhân)
 *   - Đáy thanh bên trái (.side-bottom): Nút Đăng xuất (#logout)
 * File: frontend/js/main.js
 */
import * as authApi from './api/auth.api.js';
import { clearAuthSession, restoreSession, store } from './state/store.js';
import { $, $$, escapeHtml, toast } from './utils/ui.js';
import { roleNames } from './utils/format.js';
import { renderAuthScreen } from './pages/auth.page.js';
import { renderDashboardPage, renderProfilePage } from './pages/dashboard.page.js';
import { renderOpenBookPage } from './pages/openBook.page.js';
import { renderInterestPage, renderSearchPage, renderSettlementPage } from './pages/savingsOps.page.js';
import { renderBookStatusPage, renderCustomersPage } from './pages/staffMgmt.page.js';
import {
    renderAccountsPage,
    renderNotificationsPage,
    renderRatesPage,
    renderRolloverPage,
    renderReportsPage
} from './pages/adminMgmt.page.js';

const navItems = [
    ['dashboard', '▦', 'Tổng quan', 'all'],
    ['profile', '◉', 'Thông tin cá nhân', 'all'],
    ['open-online', '＋', 'Mở sổ online', 'KHACH_HANG'],
    ['open-counter', '▣', 'Mở sổ tại quầy', 'teller_or_admin'],
    ['search', '⌕', 'Tra cứu sổ', 'all'],
    ['interest', '％', 'Tính & tra cứu lãi', 'all'],
    ['settlement', '↗', 'Tất toán sổ', 'all'],
    ['customers', '♙', 'Quản lý khách hàng', 'staff'],
    ['book-status', '◈', 'Trạng thái sổ', 'staff'],
    ['reports', '▤', 'Báo cáo & thống kê', 'staff'],
    ['accounts', '⚙', 'Tài khoản & phân quyền', 'manager'],
    ['rates', '％', 'Danh mục & lãi suất', 'manager'],
    ['notifications', '♧', 'Thông báo đáo hạn', 'all'],
    ['rollover', '↻', 'Tái tục tự động', 'manager']
];

function canSee(item) {
    const [, , , who] = item;
    if (who === 'all') return true;
    if (who === 'teller_or_admin') return ['ADMIN', 'GIAO_DICH_VIEN'].includes(store.role);
    if (who === 'staff') return ['ADMIN', 'GIAO_DICH_VIEN', 'KIEM_SOAT_VIEN'].includes(store.role);
    if (who === 'manager') return ['ADMIN', 'KIEM_SOAT_VIEN'].includes(store.role);
    return who === store.role;
}

function pageTitle() {
    return (navItems.find((x) => x[0] === store.page) || [])[2] || 'Tổng quan';
}

function go(pageId) {
    store.page = pageId;
    render();
}

async function renderPageView(container) {
    switch (store.page) {
        case 'dashboard':
            return renderDashboardPage(container, go);
        case 'profile':
            return renderProfilePage(container);
        case 'open-online':
            return renderOpenBookPage(container, true, go);
        case 'open-counter':
            return renderOpenBookPage(container, false, go);
        case 'search':
            return renderSearchPage(container);
        case 'interest':
            return renderInterestPage(container);
        case 'settlement':
            return renderSettlementPage(container, go);
        case 'customers':
            return renderCustomersPage(container);
        case 'book-status':
            return renderBookStatusPage(container);
        case 'reports':
            return renderReportsPage(container);
        case 'accounts':
            return renderAccountsPage(container);
        case 'rates':
            return renderRatesPage(container);
        case 'notifications':
            return renderNotificationsPage(container);
        case 'rollover':
            return renderRolloverPage(container);
        default:
            return renderDashboardPage(container, go);
    }
}

async function render() {
    if (!store.user) {
        renderAuthScreen(() => {
            store.page = 'dashboard';
            render();
        });
        return;
    }

    const items = navItems.filter(canSee);
    if (!items.some((x) => x[0] === store.page)) {
        store.page = 'dashboard';
    }

    const displayName = store.user.hoTen || store.user.tenDangNhap || 'Người dùng';
    const avatarChar = displayName.slice(0, 1).toUpperCase();
    const roleLabel = roleNames[store.role] || store.role;

    $('#app').innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">🏦</div>
          <div><strong>CoreSavings</strong><small>SAVINGS MANAGEMENT</small></div>
        </div>
        <div class="nav-label">Không gian làm việc</div>
        <div class="nav-menu">
          <nav class="nav">
            ${items
                .map(
                    ([id, ic, label]) =>
                        `<button type="button" data-page="${id}" class="${
                            store.page === id ? 'active' : ''
                        }"><span class="ico">${ic}</span>${label}</button>`
                )
                .join('')}
          </nav>
        </div>
        <div class="side-bottom">
          <div class="role-pill">Đang sử dụng: <b>${escapeHtml(roleLabel)}</b></div>
          <button type="button" class="btn btn-danger sidebar-logout" id="logout">↪ Đăng xuất</button>
        </div>
      </aside>

      <main class="main">
        <header class="topbar">
          <div>
            <div class="eyebrow">CORE BANKING / SAVINGS</div>
            <h1 id="page-title">${escapeHtml(pageTitle())}</h1>
          </div>
          <div class="top-actions">
            <button
              type="button"
              class="topbar-account ${store.page === 'profile' ? 'active' : ''}"
              id="topbar-account"
              title="Xem & cập nhật thông tin tài khoản"
            >
              <span class="avatar">${escapeHtml(avatarChar)}</span>
              <span class="topbar-account-meta">
                <b>${escapeHtml(displayName)}</b>
                <small>${escapeHtml(store.user.tenDangNhap)} · ${escapeHtml(roleLabel)}</small>
              </span>
            </button>
          </div>
        </header>
        <section class="content" id="view"></section>
      </main>
    </div>`;

    $$('[data-page]').forEach((b) => {
        b.onclick = () => go(b.dataset.page);
    });

    $('#topbar-account').onclick = () => go('profile');

    $('#logout').onclick = () => {
        authApi.logout();
        clearAuthSession();
        toast('Đã đăng xuất khỏi hệ thống.');
        render();
    };

    const viewContainer = $('#view');
    await renderPageView(viewContainer);
}

window.addEventListener('auth:expired', () => {
    clearAuthSession();
    toast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
    render();
});

document.addEventListener('DOMContentLoaded', async () => {
    await restoreSession();
    await render();
});
