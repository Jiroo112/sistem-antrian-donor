import { app } from '../elements.js';
import { escapeHtml, toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { navigate } from '../router.js';
import { val } from '../ui.js';

/* FR-1.3: Atur Ulang Kata Sandi */
export function viewResetPassword() {
  const tokenDariLink = new URLSearchParams(location.search).get('token') || '';
  const devToken = sessionStorage.getItem('reset_token_dev') || '';
  const tokenAwal = tokenDariLink || devToken;
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:56px 24px 60px;">
      <p class="eyebrow">Pemulihan akun</p>
      <h1 style="font-size:1.8rem;">Atur Ulang Kata Sandi</h1>
      <p>${tokenDariLink ? 'Buat kata sandi baru untuk akunmu.' : 'Tempelkan token reset yang kamu terima lewat email, lalu buat kata sandi baru.'}</p>
      <div class="card" style="margin-top:18px;">
        <div id="alert-slot"></div>
        <form id="form-reset">
          <div class="field" style="${tokenDariLink ? 'display:none;' : ''}">
            <label for="rp-token">Token Reset</label>
            <input class="input mono" id="rp-token" required value="${escapeHtml(tokenAwal)}">
          </div>
          <div class="field">
            <label for="rp-pass">Kata Sandi Baru</label>
            <input class="input" id="rp-pass" type="password" required minlength="8">
          </div>
          <button class="btn btn-primary btn-block" type="submit" id="btn-reset">Simpan Kata Sandi Baru</button>
        </form>
      </div>
    </div>
  `;
  const alertSlot = document.getElementById('alert-slot');
  document.getElementById('form-reset').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-reset');
    setLoading(btn, true);
    try {
      await Api.resetPassword({ token: val('rp-token'), password_baru: val('rp-pass') });
      toast('Kata sandi berhasil diganti, silakan masuk kembali.', 'success');
      sessionStorage.removeItem('reset_token_dev');
      navigate('/masuk');
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Simpan Kata Sandi Baru');
    }
  });
}
