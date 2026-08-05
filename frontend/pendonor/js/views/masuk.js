import { app } from '../elements.js';
import { toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Auth, Api } from '../../../js/api.js';
import { routeHref, navigate } from '../router.js';
import { renderNav } from '../nav.js';
import { val } from '../ui.js';

/* FR-1.2: Login Multi-Platform */
export function viewMasuk() {
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:56px 24px 60px;">
      <p class="eyebrow">Selamat datang kembali</p>
      <h1 style="font-size:1.8rem;">Masuk ke Akun Pendonor</h1>
      <div class="card" style="margin-top:18px;">
        <div id="alert-slot"></div>
        <form id="form-masuk">
          <div class="field">
            <label for="l-email">Email</label>
            <input class="input" id="l-email" type="email" required>
          </div>
          <div class="field">
            <label for="l-pass">Kata Sandi</label>
            <input class="input" id="l-pass" type="password" required>
          </div>
          <button class="btn btn-primary btn-block" type="submit" id="btn-masuk">Masuk</button>
        </form>
        <p class="muted" style="text-align:center;margin-top:14px;"><a href="${routeHref('/lupa-password')}" data-route="/lupa-password">Lupa kata sandi?</a></p>
        <p class="muted" style="text-align:center;margin-top:6px;">Belum punya akun? <a href="${routeHref('/daftar')}" data-route="/daftar">Daftar di sini</a></p>
      </div>
    </div>
  `;

  const alertSlot = document.getElementById('alert-slot');
  document.getElementById('form-masuk').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-masuk');
    setLoading(btn, true);
    try {
      const res = await Api.login({ email: val('l-email'), password: val('l-pass') });
      Auth.setToken(res.data.token, 'pendonor');
      toast(`Selamat datang, ${res.data.nama}!`, 'success');
      renderNav();
      navigate('/dashboard');
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Masuk');
    }
  });
}
