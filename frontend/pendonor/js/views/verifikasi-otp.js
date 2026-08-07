import { app } from '../elements.js';
import { escapeHtml, toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { navigate } from '../router.js';
import { val } from '../ui.js';

/* FR-1.1: Verifikasi OTP */
export function viewVerifikasiOtp() {
  const email = sessionStorage.getItem('pendaftaran_email') || '';
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:44px 24px 60px;">
      <p class="eyebrow">Langkah 2 dari 2</p>
      <h1 class="auth-title">Verifikasi Kode OTP</h1>
      <p>Masukkan 6 digit kode yang dikirim lewat email ke alamat yang kamu daftarkan.</p>
      <div class="card" style="margin-top:18px;">
        <div id="alert-slot"></div>
        <form id="form-otp">
          <div class="field">
            <label for="o-email">Email</label>
            <input class="input" id="o-email" type="email" required value="${escapeHtml(email)}">
          </div>
          <div class="field">
            <label for="o-kode">Kode OTP</label>
            <input class="input mono" id="o-kode" required pattern="\\d{6}" maxlength="6" placeholder="123456" style="letter-spacing:.3em;font-size:1.2rem;text-align:center;">
          </div>
          <button class="btn btn-primary btn-block" type="submit" id="btn-otp">Verifikasi</button>
        </form>
        <p class="muted" style="text-align:center;margin-top:16px;">Tidak menerima kode? <button class="btn-link" id="btn-resend" style="background:none;border:none;color:var(--crimson);font-weight:700;cursor:pointer;padding:0;">Kirim ulang</button></p>
      </div>
    </div>
  `;

  const alertSlot = document.getElementById('alert-slot');
  const resendBtn = document.getElementById('btn-resend');
  const RESEND_COOLDOWN_SECONDS = 60;
  let resendTimer = null;

  function startResendCooldown(seconds) {
    clearInterval(resendTimer);
    let sisa = seconds;
    resendBtn.disabled = true;
    resendBtn.textContent = `Kirim ulang (${sisa}d)`;
    resendTimer = setInterval(() => {
      sisa -= 1;
      if (sisa <= 0) {
        clearInterval(resendTimer);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Kirim ulang';
      } else {
        resendBtn.textContent = `Kirim ulang (${sisa}d)`;
      }
    }, 1000);
  }

  document.getElementById('form-otp').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-otp');
    setLoading(btn, true);
    try {
      await Api.verifyOtp({ email: val('o-email'), otp: val('o-kode') });
      toast('Akun berhasil diverifikasi. Silakan masuk.', 'success');
      navigate('/masuk');
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Verifikasi');
    }
  });

  resendBtn.addEventListener('click', async () => {
    const email2 = val('o-email');
    if (!email2) { toast('Isi email dulu.', 'error'); return; }
    try {
      const res = await Api.resendOtp({ email: email2 });
      toast('Kode OTP baru sudah dikirim.', 'success');
      if (res.data && res.data.otp_code_DEV_ONLY) toast('Mode uji: kode OTP = ' + res.data.otp_code_DEV_ONLY, 'info');
      startResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast(err.message, 'error');
      // Kalau backend nolak karena cooldown masih jalan (mis. setelah refresh
      // halaman ini), sinkronkan hitung mundur dari pesan errornya supaya
      // tombol tidak "nganggur" kelihatan aktif padahal masih akan ditolak.
      const cocok = /tunggu (\d+) detik/i.exec(err.message || '');
      if (cocok) startResendCooldown(parseInt(cocok[1], 10));
    }
  });

  // Registrasi baru saja mengirim OTP pertama, jadi cooldown resend juga
  // langsung berlaku begitu halaman ini dibuka.
  startResendCooldown(RESEND_COOLDOWN_SECONDS);
}
