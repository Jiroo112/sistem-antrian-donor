import { app } from '../elements.js';
import { toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { routeHref, navigate } from '../router.js';
import { val } from '../ui.js';

/* FR-1.1: Registrasi Akun */
export function viewDaftar() {
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:44px 24px 60px;">
      <p class="eyebrow">Langkah 1 dari 2</p>
      <h1 class="auth-title">Daftar Sebagai Pendonor</h1>
      <p>Data ini dipakai untuk verifikasi identitas &amp; kelayakan dasar sesuai SPO PMI. Setelah daftar, kode OTP akan dikirim ke email kamu.</p>
      <div class="card" style="margin-top:18px;">
        <div id="alert-slot"></div>
        <form id="form-daftar">
          <div class="field-row">
            <div class="field">
              <label for="r-nama">Nama Lengkap</label>
              <input class="input" id="r-nama" required minlength="3" maxlength="150" placeholder="Sesuai KTP">
            </div>
            <div class="field">
              <label for="r-nik">NIK</label>
              <input class="input" id="r-nik" required pattern="\\d{16}" maxlength="16" placeholder="16 digit">
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="r-tgl">Tanggal Lahir</label>
              <input class="input" id="r-tgl" type="date" required>
            </div>
            <div class="field">
              <label>Jenis Kelamin</label>
              <div class="radio-group">
                <label class="radio-pill is-checked" data-val="L"><input type="radio" name="jk" value="L" checked>Laki-laki</label>
                <label class="radio-pill" data-val="P"><input type="radio" name="jk" value="P">Perempuan</label>
              </div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="r-telp">No. Telepon</label>
              <input class="input" id="r-telp" required minlength="9" maxlength="20" placeholder="08xxxxxxxxxx">
            </div>
            <div class="field">
              <label for="r-email">Email</label>
              <input class="input" id="r-email" type="email" required>
            </div>
          </div>
          <div class="field">
            <label for="r-pass">Kata Sandi</label>
            <input class="input" id="r-pass" type="password" required minlength="8">
            <div class="hint">Minimal 8 karakter.</div>
          </div>
          <button class="btn btn-primary btn-block" type="submit" id="btn-daftar">Daftar &amp; Kirim OTP</button>
        </form>
        <p class="muted" style="text-align:center;margin-top:16px;">Sudah punya akun? <a href="${routeHref('/masuk')}" data-route="/masuk">Masuk di sini</a></p>
      </div>
    </div>
  `;

  document.querySelectorAll('.radio-pill').forEach((p) => {
    p.addEventListener('click', () => {
      const group = p.parentElement;
      group.querySelectorAll('.radio-pill').forEach((x) => x.classList.remove('is-checked'));
      p.classList.add('is-checked');
    });
  });

  const alertSlot = document.getElementById('alert-slot');
  document.getElementById('form-daftar').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-daftar');
    const payload = {
      nama: val('r-nama'),
      nik: val('r-nik'),
      tanggal_lahir: val('r-tgl'),
      jenis_kelamin: document.querySelector('input[name="jk"]:checked').value,
      no_telp: val('r-telp'),
      email: val('r-email'),
      password: val('r-pass'),
    };
    setLoading(btn, true);
    try {
      const res = await Api.register(payload);
      sessionStorage.setItem('pendaftaran_email', payload.email);
      toast('Registrasi berhasil! Kode OTP sudah dikirim.', 'success');
      if (res.data && res.data.otp_code_DEV_ONLY) {
        toast('Mode uji: kode OTP kamu adalah ' + res.data.otp_code_DEV_ONLY, 'info');
      }
      navigate('/verifikasi-otp');
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Daftar &amp; Kirim OTP');
    }
  });
}
