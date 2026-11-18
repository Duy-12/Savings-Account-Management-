/**
 * Màn hình Đăng nhập (FR-01, EX-01) & Đăng ký khách hàng online
 * File: frontend/js/pages/auth.page.js
 */
import * as authApi from '../api/auth.api.js';
import { setAuthSession } from '../state/store.js';
import { $, toast, withButtonLoading } from '../utils/ui.js';
import { isValidCccd, isValidEmail, isValidPhone } from '../utils/validators.js';

function renderLoginFormHtml() {
    return `
    <form id="login-form">
      <div class="field">
        <label>Tên đăng nhập</label>
        <input name="username" required autocomplete="username" placeholder="Nhập tên đăng nhập">
      </div>
      <div class="field">
        <label>Mật khẩu</label>
        <input name="password" type="password" required autocomplete="current-password" placeholder="Nhập mật khẩu">
      </div>
      <button class="btn btn-primary" type="submit">Đăng nhập hệ thống →</button>
    </form>
    <p class="auth-switch">
      Chưa có tài khoản khách hàng?
      <button type="button" class="link-button" id="show-register">Đăng ký online</button>
    </p>`;
}

function renderRegisterFormHtml() {
    return `
    <h3 class="auth-title">Đăng ký tài khoản khách hàng</h3>
    <p class="auth-description">Tạo tài khoản thực tế trên hệ thống MySQL để mở sổ và tra cứu trực tuyến.</p>
    <form id="register-form" class="auth-form">
      <div class="field">
        <label>Họ và tên</label>
        <input name="hoTen" required maxlength="100" autocomplete="name" placeholder="Nhập họ tên đầy đủ">
      </div>
      <div class="field">
        <label>Số CCCD</label>
        <input name="soCccd" required inputmode="numeric" pattern="[0-9]{9,12}" maxlength="12" placeholder="9–12 chữ số">
      </div>
      <div class="field">
        <label>Số điện thoại</label>
        <input name="soDienThoai" required inputmode="numeric" pattern="0[0-9]{9,10}" maxlength="11" placeholder="Ví dụ: 09xxxxxxxx">
      </div>
      <div class="field">
        <label>Email</label>
        <input name="email" type="email" required autocomplete="email" placeholder="name@example.com">
      </div>
      <div class="field">
        <label>Tên đăng nhập</label>
        <input name="tenDangNhap" required minlength="4" maxlength="30" autocomplete="username" placeholder="Ít nhất 4 ký tự">
      </div>
      <div class="field">
        <label>Mật khẩu</label>
        <input name="matKhau" type="password" required minlength="8" autocomplete="new-password" placeholder="Ít nhất 8 ký tự">
      </div>
      <div class="field">
        <label>Xác nhận mật khẩu</label>
        <input name="confirmPassword" type="password" required minlength="8" autocomplete="new-password" placeholder="Nhập lại mật khẩu">
      </div>
      <p class="form-hint">Vai trò được gán tự động tại máy chủ là <b>Khách hàng (KHACH_HANG)</b>.</p>
      <button class="btn btn-primary" type="submit">Tạo tài khoản khách hàng</button>
    </form>
    <p class="auth-switch">
      Đã có tài khoản?
      <button type="button" class="link-button" id="back-login">Quay lại đăng nhập</button>
    </p>`;
}

export function renderAuthScreen(onAuthenticated) {
    $('#app').innerHTML = `
    <main class="login-screen">
      <section class="login-card">
        <div class="login-brand">
          <div class="brand-mark">🏦</div>
          <h1>CoreSavings</h1>
          <p>Hệ thống quản lý sổ tiết kiệm</p>
        </div>
        <div id="auth-content">${renderLoginFormHtml()}</div>
        <div class="demo-accounts">
          <b>Xác thực thật qua Backend API &amp; MySQL:</b><br>
          • Tên đăng nhập mẫu: <b>kh_mai</b>, <b>teller01</b>, <b>supervisor01</b>, <b>admin</b><br>
          • Nhập sai mật khẩu <b>5 lần</b> sẽ tự động khóa tài khoản tạm thời theo quy tắc bảo mật (EX-01).
        </div>
      </section>
    </main>`;

    const authBox = $('#auth-content');

    function bindLogin() {
        $('#show-register').onclick = showRegister;
        const form = $('#login-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const tenDangNhap = String(fd.get('username') || '').trim();
            const matKhau = String(fd.get('password') || '');
            const submitBtn = form.querySelector('button[type="submit"]');

            await withButtonLoading(submitBtn, 'Đang xác thực...', async () => {
                try {
                    const data = await authApi.login(tenDangNhap, matKhau);
                    setAuthSession(data);
                    toast(`Xin chào, ${data.user.hoTen}!`);
                    await onAuthenticated();
                } catch (err) {
                    toast(err.message, 'error');
                }
            });
        };
    }

    function showLogin(prefillUsername = '') {
        authBox.innerHTML = renderLoginFormHtml();
        if (prefillUsername) {
            const input = $('#login-form [name="username"]');
            if (input) input.value = prefillUsername;
        }
        bindLogin();
    }

    function showRegister() {
        authBox.innerHTML = renderRegisterFormHtml();
        $('#back-login').onclick = () => showLogin();
        const form = $('#register-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form));
            if (d.matKhau !== d.confirmPassword) {
                toast('Mật khẩu xác nhận không khớp.', 'error');
                return;
            }
            if (!isValidCccd(d.soCccd) || !isValidPhone(d.soDienThoai) || !isValidEmail(d.email)) {
                toast('Vui lòng kiểm tra lại định dạng CCCD, số điện thoại hoặc email.', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            await withButtonLoading(submitBtn, 'Đang tạo tài khoản...', async () => {
                try {
                    await authApi.register({
                        hoTen: d.hoTen,
                        soCccd: d.soCccd,
                        soDienThoai: d.soDienThoai,
                        email: d.email,
                        tenDangNhap: d.tenDangNhap,
                        matKhau: d.matKhau
                    });
                    toast('Đăng ký thành công. Vui lòng đăng nhập bằng tài khoản vừa tạo.');
                    showLogin(String(d.tenDangNhap).trim());
                } catch (err) {
                    toast(err.message, 'error');
                }
            });
        };
    }

    bindLogin();
}
