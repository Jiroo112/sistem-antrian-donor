import { app } from '../elements.js';
import { escapeHtml, toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { val } from '../ui.js';

/* FR-1.3: Lupa Kata Sandi */
export function viewLupaPassword() {
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:56px 24px 60px;">
      <p class="eyebrow">Pemulihan akun</p>
      <h1 style="font-size:1.8rem;">Lupa Kata Sandi</h1>
      <p>Masukkan email akunmu. Jika terdaftar, link atur ulang kata sandi akan dikirim ke email tersebut.</p>
      <div class="card" style="margin-top:18px;">
        <div id="alert-slot"></div>
        <form id="form-lupa">
          <div class="field">
            <label for="fp-email">Email</label>
            <input class="input" id="fp-email" type="email" required>
          </div>
          <button class="btn btn-primary btn-block" type="submit" id="btn-lupa">Kirim Instruksi Reset</button>
        </form>
      </div>
    </div>
  `;
  const alertSlot = document.getElementById('alert-slot');
  document.getElementById('form-lupa').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-lupa');
    setLoading(btn, true);
    try {
      const res = await Api.forgotPassword({ email: val('fp-email') });
      alertSlot.innerHTML = `<div class="alert alert-success">${escapeHtml(res.message)}</div>`;
      if (res.data && res.data.reset_token_DEV_ONLY) {
        toast('Mode uji: token reset = ' + res.data.reset_token_DEV_ONLY, 'info');
        sessionStorage.setItem('reset_token_dev', res.data.reset_token_DEV_ONLY);
      }
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Kirim Instruksi Reset');
    }
  });
}
