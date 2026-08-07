import { app } from '../elements.js';
import { toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Auth, Api } from '../../../js/api.js';
import { renderNav } from '../nav.js';
import { setCurrentUser } from '../session.js';
import { defaultRouteFor } from '../permissions.js';
import { navigate, BASE_PATH } from '../router.js';

/* Login internal (Petugas Loket / Admin UDD / Super Admin) */
export function viewMasuk() {
  // BASE_PATH selalu berakhiran "/admin" (lihat router.js), jadi root situs
  // pendonor didapat dengan membuang akhiran itu -- dipakai buat tautan
  // "Ke situs pendonor" di bawah. Sengaja dihitung DI DALAM fungsi (bukan
  // di top-level modul) supaya tidak diakses lebih awal dari router.js
  // sempat menetapkan nilainya -- router.js meng-import viewMasuk (buat
  // tabel rute) SEBELUM baris `export const BASE_PATH = ...` di router.js
  // sendiri sempat jalan, jadi akses di top-level modul ini akan kena TDZ
  // ("Cannot access 'BASE_PATH' before initialization").
  const pendonorRoot = BASE_PATH.replace(/\/admin$/, '') || '/';

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
      navigate(defaultRouteFor(res.data.peran));
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Masuk');
    }
  });
}
