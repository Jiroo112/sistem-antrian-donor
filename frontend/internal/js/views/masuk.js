import { app } from '../elements.js';
import { toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Auth, Api } from '../../../js/api.js';
import { renderNav } from '../nav.js';
import { setCurrentUser } from '../session.js';

/* Login internal (Petugas Loket / Admin UDD / Super Admin) */
export function viewMasuk() {
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:64px 24px 60px;">
      <p class="eyebrow">Panel Internal PMI / UDD</p>
      <h1 style="font-size:1.8rem;">Masuk sebagai Petugas / Admin</h1>
      <p>Khusus untuk Petugas Loket, Admin UDD/Cabang, dan Super Admin.</p>
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
      </div>
      <p class="muted" style="text-align:center;margin-top:18px;">Kamu pendonor? <a href="index.html">Ke situs pendonor →</a></p>
    </div>
  `;
  const alertSlot = document.getElementById('alert-slot');
  document.getElementById('form-masuk').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-masuk');
    setLoading(btn, true);
    try {
      const res = await Api.loginInternal({
        email: document.getElementById('l-email').value.trim(),
        password: document.getElementById('l-pass').value,
      });
      Auth.setToken(res.data.token, 'internal');
      setCurrentUser(res.data);
      toast(`Selamat datang, ${res.data.nama}!`, 'success');
      renderNav();
      location.hash = '#/jadwal';
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Masuk');
    }
  });
}
