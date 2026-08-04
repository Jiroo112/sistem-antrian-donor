/* app.js — SPA untuk sisi Pendonor (publik + area login) menggunakan hash-router sederhana. */

const app = document.getElementById('app');
const navSlot = document.getElementById('nav-slot');

/* ---------------------------- helpers ---------------------------- */

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function toast(message, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  const node = el(`<div class="toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}">${escapeHtml(message)}</div>`);
  wrap.appendChild(node);
  setTimeout(() => node.remove(), 4200);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtTanggal(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (_) { return iso; }
}

function fmtTanggalWaktu(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) { return iso; }
}

function statusBadgeClass(status) {
  const map = {
    aktif: 'aktif', dibuka: 'aktif', tersedia: 'aktif',
    menunggu: 'menunggu', menunggu_verifikasi: 'menunggu', pending: 'menunggu',
    selesai: 'selesai', lolos_screening_awal: 'lolos',
    perlu_pemeriksaan_lanjutan: 'risiko', nonaktif: 'nonaktif', dibatalkan: 'gagal',
  };
  return 'badge--' + (map[status] || 'info');
}

function setLoading(buttonEl, loading, labelWhenIdle) {
  if (!buttonEl) return;
  buttonEl.disabled = loading;
  buttonEl.innerHTML = loading
    ? '<span class="spinner"></span> Memproses…'
    : labelWhenIdle;
}

function requireAuth() {
  if (!Auth.isLoggedIn('pendonor')) {
    toast('Silakan masuk terlebih dahulu untuk mengakses halaman ini.', 'error');
    location.hash = '#/masuk';
    return false;
  }
  return true;
}

/* ---------------------------- top navigation ---------------------------- */

function renderNav() {
  const loggedIn = Auth.isLoggedIn('pendonor');
  navSlot.innerHTML = '';
  const links = loggedIn
    ? [
        ['#/jadwal', 'Cari Jadwal'],
        ['#/lokasi', 'Lokasi'],
        ['#/dashboard', 'Dasbor Saya'],
      ]
    : [
        ['#/jadwal', 'Cari Jadwal'],
        ['#/lokasi', 'Lokasi'],
      ];
  links.forEach(([href, label]) => {
    const a = el(`<a class="nav__link" href="${href}">${label}</a>`);
    navSlot.appendChild(a);
  });
  if (loggedIn) {
    navSlot.appendChild(el(`<button class="nav__link" id="btn-logout">Keluar</button>`));
  } else {
    navSlot.appendChild(el(`<a class="nav__link" href="#/masuk">Masuk</a>`));
    navSlot.appendChild(el(`<a class="btn btn-primary btn-sm" href="#/daftar">Daftar Pendonor</a>`));
  }
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await Api.logout(); } catch (_) { /* token mungkin sudah kedaluwarsa, tetap logout lokal */ }
      Auth.clearToken('pendonor');
      toast('Berhasil keluar.', 'success');
      location.hash = '#/';
    });
  }
}

/* ---------------------------- shell partials ---------------------------- */

function pageHeader(eyebrow, title, subtitle) {
  return `
    <div class="shell" style="padding-top:40px;">
      <p class="eyebrow">${eyebrow}</p>
      <h1 style="font-size:2rem;max-width:620px;">${title}</h1>
      ${subtitle ? `<p style="max-width:620px;">${subtitle}</p>` : ''}
    </div>`;
}

/* ============================================================
   VIEW: Home
   ============================================================ */
function viewHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="shell grid-2" style="align-items:center;">
        <div>
          <p class="eyebrow">Sistem Antrian Online Donor Darah</p>
          <h1 style="font-size:2.6rem;line-height:1.05;margin-bottom:16px;">Ambil nomor antrian donor darah dari mana saja.</h1>
          <p style="font-size:1.05rem;max-width:480px;">Cari jadwal dan lokasi donor terdekat, isi kuesioner kesehatan pra-donor, lalu pantau posisi antrianmu secara langsung — tanpa perlu mengantre fisik dari awal.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;">
            <a href="#/jadwal" class="btn btn-primary">Cari Jadwal Donor</a>
            <a href="#/daftar" class="btn btn-ghost">Daftar Sebagai Pendonor</a>
          </div>
        </div>
        <div class="ticket">
          <div class="ticket__main">
            <p class="ticket__eyebrow">Contoh e-ticket</p>
            <h3 class="ticket__title">UDD PMI Kota — Sesi Pagi</h3>
            <div class="ticket__meta">
              <span>📅 Sabtu, 08 Agustus 2026</span>
              <span>⏰ 08.00 – 10.00</span>
            </div>
            <div class="ticket__meta">
              <span class="badge badge--aktif"><i class="badge-dot"></i>Kuota tersedia</span>
            </div>
          </div>
          <div class="ticket__divider"></div>
          <div class="ticket__stub">
            <div class="ticket__stub-label">Nomor Antrian</div>
            <div class="ticket__stub-value">A-014</div>
          </div>
        </div>
      </div>
    </section>

    <section class="shell" style="padding:20px 24px 60px;">
      <div class="grid-2">
        <div class="card">
          <p class="eyebrow">Alur singkat</p>
          <h2 style="font-size:1.3rem;">Bagaimana cara kerjanya</h2>
          <div class="stack" style="margin-top:14px;">
            ${[
              ['1', 'Daftar / masuk', 'Buat akun dengan NIK, verifikasi OTP lewat WhatsApp/SMS.'],
              ['2', 'Cari jadwal & lokasi', 'Pilih lokasi UDD tetap atau unit donor bergerak terdekat.'],
              ['3', 'Isi kuesioner kesehatan', 'Self-assessment singkat sebelum mengambil nomor antrian.'],
              ['4', 'Pantau antrian real-time', 'Lihat posisi antrianmu dan dapat notifikasi saat giliran mendekati.'],
            ].map(([n, t, d]) => `
              <div style="display:flex;gap:14px;">
                <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:var(--crimson-tint);color:var(--crimson-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-family:var(--font-mono);font-size:.85rem;">${n}</div>
                <div><strong>${t}</strong><p style="margin:2px 0 0;">${d}</p></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card" style="background:var(--ink);color:#fff;">
          <p class="eyebrow" style="color:#E9B9BE;">Perlu diketahui</p>
          <h2 style="font-size:1.3rem;color:#fff;">Aturan dasar donor darah</h2>
          <ul style="padding-left:18px;color:#EDE6E1;font-size:.9rem;line-height:1.8;">
            <li>Usia pendonor 17–65 tahun saat pendaftaran.</li>
            <li>Jarak minimal antar donor adalah 3 bulan (12 minggu).</li>
            <li>Satu akun hanya bisa punya satu nomor antrian aktif.</li>
            <li>Keputusan akhir kelayakan tetap di tangan petugas medis di lokasi.</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

/* ============================================================
   VIEW: Cari Jadwal (FR-3.1 / FR-3.3)
   ============================================================ */
async function viewJadwal() {
  app.innerHTML = `
    ${pageHeader('Cari jadwal', 'Jadwal & Kuota Donor Darah', 'Cari kegiatan donor darah berdasarkan lokasi dan tanggal, lengkap dengan sisa kuota sebelum kamu mendaftar.')}
    <div class="shell" style="padding:24px 24px 60px;">
      <div class="card" style="margin-bottom:22px;">
        <form id="form-cari-jadwal" class="field-row" style="align-items:end;">
          <div class="field" style="margin-bottom:0;">
            <label for="f-tanggal">Tanggal</label>
            <input class="input" type="date" id="f-tanggal" name="tanggal">
          </div>
          <div class="field" style="margin-bottom:0;">
            <label for="f-id-lokasi">ID Lokasi <span class="muted">(opsional)</span></label>
            <input class="input" type="number" id="f-id-lokasi" name="id_lokasi" placeholder="mis. 1">
          </div>
          <div class="field" style="margin-bottom:0;grid-column:1/-1;">
            <button class="btn btn-primary" type="submit" id="btn-cari">Cari Jadwal</button>
          </div>
        </form>
      </div>
      <div id="hasil-jadwal" class="stack"></div>
    </div>
  `;

  const hasil = document.getElementById('hasil-jadwal');
  const form = document.getElementById('form-cari-jadwal');

  async function loadJadwal(filter = {}) {
    hasil.innerHTML = `<div class="skeleton" style="height:110px;"></div><div class="skeleton" style="height:110px;"></div>`;
    try {
      const res = await Api.cariJadwal(filter);
      renderJadwalList(res.data);
    } catch (e) {
      hasil.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderJadwalList(list) {
    if (!list || list.length === 0) {
      hasil.innerHTML = `<div class="empty">Tidak ada jadwal yang cocok. Coba ubah tanggal atau ID lokasi.</div>`;
      return;
    }
    hasil.innerHTML = '';
    list.forEach((j) => {
      const sisa = j.kuota_tersisa ?? j.sisa_kuota ?? j.kuota_total;
      const habis = Number(sisa) <= 0;
      hasil.appendChild(el(`
        <div class="ticket">
          <div class="ticket__main">
            <p class="ticket__eyebrow">Jadwal #${j.id_jadwal ?? '-'}</p>
            <h3 class="ticket__title">${escapeHtml(j.nama_lokasi || 'Lokasi Donor')}</h3>
            <p class="muted" style="margin:2px 0 8px;">${escapeHtml(j.alamat || '')}</p>
            <div class="ticket__meta">
              <span>📅 ${fmtTanggal(j.tanggal)}</span>
              <span>⏰ ${escapeHtml(j.slot_waktu || '-')}</span>
              <span class="badge ${habis ? 'badge--nonaktif' : 'badge--aktif'}"><i class="badge-dot"></i>${habis ? 'Kuota penuh' : `Sisa kuota: ${sisa}`}</span>
            </div>
          </div>
          <div class="ticket__divider"></div>
          <div class="ticket__stub">
            <div class="ticket__stub-label">Kuota total</div>
            <div class="ticket__stub-value">${j.kuota_total ?? '-'}</div>
          </div>
        </div>
      `));
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadJadwal({
      tanggal: document.getElementById('f-tanggal').value,
      id_lokasi: document.getElementById('f-id-lokasi').value,
    });
  });

  loadJadwal();
}

/* ============================================================
   VIEW: Peta / Daftar Lokasi (FR-3.2)
   ============================================================ */
async function viewLokasi() {
  app.innerHTML = `
    ${pageHeader('Lokasi donor', 'Lokasi UDD Tetap & Unit Donor Bergerak', 'Daftar titik lokasi donor darah aktif, lengkap dengan koordinat untuk dibuka di aplikasi peta pilihanmu.')}
    <div class="shell" style="padding:24px 24px 60px;">
      <div class="radio-group" id="filter-jenis" style="margin-bottom:20px;">
        <label class="radio-pill is-checked" data-val=""><input type="radio" name="jenis" value="">Semua</label>
        <label class="radio-pill" data-val="tetap"><input type="radio" name="jenis" value="tetap">UDD Tetap</label>
        <label class="radio-pill" data-val="mobile_unit"><input type="radio" name="jenis" value="mobile_unit">Unit Bergerak</label>
      </div>
      <div id="hasil-lokasi" class="stack"></div>
    </div>
  `;

  const hasil = document.getElementById('hasil-lokasi');
  const pills = document.querySelectorAll('#filter-jenis .radio-pill');

  async function load(jenis) {
    hasil.innerHTML = `<div class="skeleton" style="height:90px;"></div>`;
    try {
      const res = await Api.petaLokasi(jenis);
      renderList(res.data);
    } catch (e) {
      hasil.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderList(list) {
    if (!list || list.length === 0) {
      hasil.innerHTML = `<div class="empty">Belum ada lokasi aktif untuk filter ini.</div>`;
      return;
    }
    hasil.innerHTML = '';
    list.forEach((lok) => {
      const mapsUrl = (lok.latitude && lok.longitude)
        ? `https://www.google.com/maps?q=${lok.latitude},${lok.longitude}`
        : null;
      hasil.appendChild(el(`
        <div class="card" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <span class="badge ${lok.jenis === 'mobile_unit' ? 'badge--info' : 'badge--aktif'}">${lok.jenis === 'mobile_unit' ? 'Unit Bergerak' : 'UDD Tetap'}</span>
            <h3 style="font-size:1.1rem;margin:8px 0 4px;">${escapeHtml(lok.nama_lokasi)}</h3>
            <p class="muted" style="margin:0;">${escapeHtml(lok.alamat || '')}</p>
          </div>
          <div style="display:flex;align-items:center;">
            ${mapsUrl ? `<a class="btn btn-ghost btn-sm" href="${mapsUrl}" target="_blank" rel="noopener">Buka di Peta ↗</a>` : `<span class="muted">Koordinat belum tersedia</span>`}
          </div>
        </div>
      `));
    });
  }

  pills.forEach((p) => {
    p.addEventListener('click', () => {
      pills.forEach((x) => x.classList.remove('is-checked'));
      p.classList.add('is-checked');
      load(p.dataset.val);
    });
  });

  load('');
}

/* ============================================================
   VIEW: Registrasi (FR-1.1)
   ============================================================ */
function viewDaftar() {
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:44px 24px 60px;">
      <p class="eyebrow">Langkah 1 dari 2</p>
      <h1 style="font-size:1.8rem;">Daftar Sebagai Pendonor</h1>
      <p>Data ini dipakai untuk verifikasi identitas &amp; kelayakan dasar sesuai SPO PMI. Setelah daftar, kode OTP akan dikirim ke WhatsApp/SMS kamu.</p>
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
              <label for="r-telp">No. Telepon (WhatsApp)</label>
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
        <p class="muted" style="text-align:center;margin-top:16px;">Sudah punya akun? <a href="#/masuk">Masuk di sini</a></p>
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
      location.hash = '#/verifikasi-otp';
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Daftar &amp; Kirim OTP');
    }
  });
}

function val(id) { return document.getElementById(id).value.trim(); }

function renderAlertError(err) {
  let details = '';
  if (err.fieldErrors) {
    details = '<ul style="margin:6px 0 0 18px;padding:0;">' +
      Object.values(err.fieldErrors).map((m) => `<li>${escapeHtml(m)}</li>`).join('') + '</ul>';
  }
  return `<div class="alert alert-error"><div><strong>${escapeHtml(err.message)}</strong>${details}</div></div>`;
}

/* ============================================================
   VIEW: Verifikasi OTP (FR-1.1)
   ============================================================ */
function viewVerifikasiOtp() {
  const email = sessionStorage.getItem('pendaftaran_email') || '';
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:44px 24px 60px;">
      <p class="eyebrow">Langkah 2 dari 2</p>
      <h1 style="font-size:1.8rem;">Verifikasi Kode OTP</h1>
      <p>Masukkan 6 digit kode yang dikirim lewat WhatsApp/SMS ke nomor yang kamu daftarkan.</p>
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

  document.getElementById('form-otp').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-otp');
    setLoading(btn, true);
    try {
      await Api.verifyOtp({ email: val('o-email'), otp: val('o-kode') });
      toast('Akun berhasil diverifikasi. Silakan masuk.', 'success');
      location.hash = '#/masuk';
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Verifikasi');
    }
  });

  document.getElementById('btn-resend').addEventListener('click', async () => {
    const email2 = val('o-email');
    if (!email2) { toast('Isi email dulu.', 'error'); return; }
    try {
      const res = await Api.resendOtp({ email: email2 });
      toast('Kode OTP baru sudah dikirim.', 'success');
      if (res.data && res.data.otp_code_DEV_ONLY) toast('Mode uji: kode OTP = ' + res.data.otp_code_DEV_ONLY, 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

/* ============================================================
   VIEW: Masuk (FR-1.2)
   ============================================================ */
function viewMasuk() {
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
        <p class="muted" style="text-align:center;margin-top:14px;"><a href="#/lupa-password">Lupa kata sandi?</a></p>
        <p class="muted" style="text-align:center;margin-top:6px;">Belum punya akun? <a href="#/daftar">Daftar di sini</a></p>
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
      location.hash = '#/dashboard';
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Masuk');
    }
  });
}

/* ============================================================
   VIEW: Lupa & Reset Password (FR-1.3)
   ============================================================ */
function viewLupaPassword() {
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:56px 24px 60px;">
      <p class="eyebrow">Pemulihan akun</p>
      <h1 style="font-size:1.8rem;">Lupa Kata Sandi</h1>
      <p>Masukkan email akunmu. Jika terdaftar, instruksi reset akan dikirim.</p>
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

function viewResetPassword() {
  const devToken = sessionStorage.getItem('reset_token_dev') || '';
  app.innerHTML = `
    <div class="shell shell--narrow" style="padding:56px 24px 60px;">
      <p class="eyebrow">Pemulihan akun</p>
      <h1 style="font-size:1.8rem;">Atur Ulang Kata Sandi</h1>
      <p>Tempelkan token reset yang kamu terima, lalu buat kata sandi baru.</p>
      <div class="card" style="margin-top:18px;">
        <div id="alert-slot"></div>
        <form id="form-reset">
          <div class="field">
            <label for="rp-token">Token Reset</label>
            <input class="input mono" id="rp-token" required value="${escapeHtml(devToken)}">
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
      location.hash = '#/masuk';
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Simpan Kata Sandi Baru');
    }
  });
}

/* ============================================================
   VIEW: Dashboard Pendonor
   ============================================================ */
async function viewDashboard() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Dasbor Saya', '')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div id="dash-content" class="grid-2"></div>
    </div>
  `;
  const wrap = document.getElementById('dash-content');
  wrap.innerHTML = `<div class="skeleton" style="height:200px;"></div><div class="skeleton" style="height:200px;"></div>`;
  try {
    const res = await Api.getProfil();
    const { akun, riwayat_kesehatan } = res.data;
    wrap.innerHTML = `
      <div class="card">
        <p class="eyebrow">Profil</p>
        <h2 style="font-size:1.2rem;">${escapeHtml(akun.nama)}</h2>
        <div class="stack" style="margin-top:10px;font-size:.9rem;">
          <div><span class="muted">Email</span><br>${escapeHtml(akun.email)}</div>
          <div><span class="muted">Golongan darah</span><br>${escapeHtml(akun.golongan_darah)}</div>
          <div><span class="muted">Status akun</span><br><span class="badge ${statusBadgeClass(akun.status_akun)}"><i class="badge-dot"></i>${escapeHtml(akun.status_akun)}</span></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
          <a class="btn btn-quiet btn-sm" href="#/profil">Lengkapi / Ubah Profil</a>
          <a class="btn btn-ghost btn-sm" href="#/perangkat">Kelola Perangkat</a>
        </div>
      </div>
      <div class="card">
        <p class="eyebrow">Kesehatan</p>
        <h2 style="font-size:1.2rem;">Status Kuesioner Pra-Donor</h2>
        ${riwayat_kesehatan && riwayat_kesehatan.hasil_screening_awal
          ? `<p style="margin-top:8px;">Hasil terakhir:
              <span class="badge ${statusBadgeClass(riwayat_kesehatan.hasil_screening_awal)}"><i class="badge-dot"></i>${riwayat_kesehatan.hasil_screening_awal === 'lolos_screening_awal' ? 'Lolos self-assessment' : 'Perlu pemeriksaan lanjutan'}</span></p>`
          : `<p style="margin-top:8px;">Kamu belum mengisi kuesioner kesehatan pra-donor.</p>`}
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
          <a class="btn btn-primary btn-sm" href="#/kuesioner">Isi / Perbarui Kuesioner</a>
          <a class="btn btn-ghost btn-sm" href="#/kartu-donor">Lihat Kartu Donor Digital</a>
        </div>
      </div>
    `;
  } catch (e) {
    wrap.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
  }
}

/* ============================================================
   VIEW: Profil (FR-2.1)
   ============================================================ */
async function viewProfil() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Profil & Data Kesehatan Dasar', 'Lengkapi data ini supaya petugas skrining di lokasi bisa memverifikasi kelayakanmu lebih cepat.')}
    <div class="shell shell--narrow" style="padding:16px 24px 60px;">
      <div class="card" id="profil-card"><div class="skeleton" style="height:320px;"></div></div>
    </div>
  `;
  const card = document.getElementById('profil-card');
  let current = null;
  try {
    const res = await Api.getProfil();
    current = res.data;
  } catch (e) {
    card.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    return;
  }

  const akun = current.akun;
  const riw = current.riwayat_kesehatan || {};

  card.innerHTML = `
    <div id="alert-slot"></div>
    <form id="form-profil">
      <div class="field-row">
        <div class="field">
          <label for="p-golongan">Golongan Darah</label>
          <select class="input" id="p-golongan">
            <option value="">— Belum diketahui —</option>
            ${['A', 'B', 'AB', 'O'].map((g) => `<option value="${g}" ${akun.golongan_darah === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="p-berat">Berat Badan (kg)</label>
          <input class="input" id="p-berat" type="number" step="0.1" min="0" value="${riw.berat_badan ?? ''}">
        </div>
      </div>
      <div class="field">
        <label for="p-alamat">Alamat</label>
        <textarea class="input" id="p-alamat" rows="2" maxlength="500">${escapeHtml(akun.alamat || '')}</textarea>
      </div>
      <div class="field">
        <label for="p-tekanan">Tekanan Darah</label>
        <input class="input" id="p-tekanan" placeholder="mis. 120/80" value="${escapeHtml(riw.tekanan_darah || '')}">
      </div>
      <div class="field">
        <label for="p-penyakit">Penyakit Bawaan</label>
        <textarea class="input" id="p-penyakit" rows="2" maxlength="500">${escapeHtml(riw.penyakit_bawaan || '')}</textarea>
      </div>
      <div class="field">
        <label for="p-riwayat">Riwayat Donor Sebelumnya</label>
        <textarea class="input" id="p-riwayat" rows="2" maxlength="500">${escapeHtml(riw.riwayat_donor_sebelumnya || '')}</textarea>
      </div>
      <button class="btn btn-primary btn-block" type="submit" id="btn-simpan-profil">Simpan Perubahan</button>
    </form>
  `;

  document.getElementById('form-profil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertSlot = document.getElementById('alert-slot');
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-simpan-profil');
    setLoading(btn, true);
    try {
      await Api.updateProfil({
        golongan_darah: val('p-golongan'),
        alamat: val('p-alamat'),
        berat_badan: val('p-berat'),
        tekanan_darah: val('p-tekanan'),
        penyakit_bawaan: val('p-penyakit'),
        riwayat_donor_sebelumnya: val('p-riwayat'),
      });
      alertSlot.innerHTML = `<div class="alert alert-success">Profil berhasil diperbarui.</div>`;
      toast('Profil berhasil diperbarui.', 'success');
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Simpan Perubahan');
    }
  });
}

/* ============================================================
   VIEW: Kuesioner Kesehatan Pra-Donor (FR-2.2)
   ============================================================ */
async function viewKuesioner() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Kuesioner Kesehatan Pra-Donor', 'Jawab dengan jujur. Ini hanya self-assessment awal — keputusan akhir tetap ditentukan petugas medis di lokasi.')}
    <div class="shell shell--narrow" style="padding:16px 24px 60px;">
      <div class="card" id="kuesioner-card"><div class="skeleton" style="height:260px;"></div></div>
    </div>
  `;
  const card = document.getElementById('kuesioner-card');
  try {
    const res = await Api.getKuesioner();
    const pertanyaan = res.data.pertanyaan || [];
    if (pertanyaan.length === 0) {
      card.innerHTML = `<div class="empty">Belum ada pertanyaan kuesioner yang dikonfigurasi.</div>`;
      return;
    }
    card.innerHTML = `
      <div id="alert-slot"></div>
      <form id="form-kuesioner" class="stack">
        ${pertanyaan.map((p) => `
          <div class="field" style="margin-bottom:0;">
            <label>${escapeHtml(p.teks)}</label>
            <div class="radio-group">
              <label class="radio-pill" data-kode="${p.kode}" data-val="ya"><input type="radio" name="q_${p.kode}" value="ya">Ya</label>
              <label class="radio-pill" data-kode="${p.kode}" data-val="tidak"><input type="radio" name="q_${p.kode}" value="tidak">Tidak</label>
            </div>
          </div>
        `).join('<hr class="hr">')}
        <button class="btn btn-primary btn-block" type="submit" id="btn-kuesioner">Kirim Jawaban</button>
      </form>
    `;

    card.querySelectorAll('.radio-pill').forEach((p) => {
      p.addEventListener('click', () => {
        const kode = p.dataset.kode;
        card.querySelectorAll(`.radio-pill[data-kode="${kode}"]`).forEach((x) => x.classList.remove('is-checked'));
        p.classList.add('is-checked');
      });
    });

    document.getElementById('form-kuesioner').addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertSlot = document.getElementById('alert-slot');
      alertSlot.innerHTML = '';
      const jawaban = {};
      let lengkap = true;
      pertanyaan.forEach((p) => {
        const checked = card.querySelector(`input[name="q_${p.kode}"]:checked`);
        if (!checked) lengkap = false; else jawaban[p.kode] = checked.value;
      });
      if (!lengkap) {
        alertSlot.innerHTML = `<div class="alert alert-error">Mohon jawab semua pertanyaan.</div>`;
        return;
      }
      const btn = document.getElementById('btn-kuesioner');
      setLoading(btn, true);
      try {
        const res2 = await Api.submitKuesioner(jawaban);
        const lolos = res2.data.hasil_screening_awal === 'lolos_screening_awal';
        alertSlot.innerHTML = `<div class="alert ${lolos ? 'alert-success' : 'alert-info'}">
          <div><strong>${lolos ? 'Lolos self-assessment awal.' : 'Perlu pemeriksaan lanjutan oleh petugas.'}</strong>
          <p style="margin:6px 0 0;">${escapeHtml(res2.data.catatan)}</p></div>
        </div>`;
        toast('Kuesioner berhasil disimpan.', 'success');
      } catch (err) {
        alertSlot.innerHTML = renderAlertError(err);
      } finally {
        setLoading(btn, false, 'Kirim Jawaban');
      }
    });
  } catch (e) {
    card.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
  }
}

/* ============================================================
   VIEW: Kartu Donor Digital (FR-2.3)
   ============================================================ */
async function viewKartuDonor() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Kartu Donor Digital', 'Tunjukkan kartu ini ke petugas sebagai identitas pendonor di lokasi.')}
    <div class="shell shell--narrow" style="padding:16px 24px 60px;">
      <div id="kartu-slot"><div class="skeleton" style="height:180px;"></div></div>
    </div>
  `;
  const slot = document.getElementById('kartu-slot');
  try {
    const res = await Api.kartuDonor();
    const d = res.data;
    slot.innerHTML = `
      <div class="ticket">
        <div class="ticket__main">
          <p class="ticket__eyebrow">Kartu Donor Digital</p>
          <h3 class="ticket__title">${escapeHtml(d.nama)}</h3>
          <div class="ticket__meta">
            <span class="mono">${escapeHtml(d.id_unik_pendonor)}</span>
            <span class="badge ${statusBadgeClass(d.status_akun)}"><i class="badge-dot"></i>${escapeHtml(d.status_akun)}</span>
          </div>
          <p class="muted" style="margin-top:10px;">Berlaku sejak ${fmtTanggal(d.berlaku_sejak)}</p>
          ${!d.golongan_darah_terverifikasi ? `<p style="margin-top:8px;font-size:.82rem;color:var(--amber);">Golongan darah belum terverifikasi petugas.</p>` : ''}
        </div>
        <div class="ticket__divider"></div>
        <div class="ticket__stub">
          <div class="ticket__stub-label">Gol. Darah</div>
          <div class="ticket__stub-value">${escapeHtml(d.golongan_darah)}</div>
        </div>
      </div>
    `;
  } catch (e) {
    slot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
  }
}

/* ============================================================
   VIEW: Perangkat / Sesi (FR-1.4)
   ============================================================ */
async function viewPerangkat() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Keamanan akun', 'Perangkat yang Sedang Masuk', 'Kalau ada perangkat yang tidak kamu kenali, keluarkan dari sini.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div style="margin-bottom:16px;"><button class="btn btn-danger btn-sm" id="btn-logout-others">Keluar dari Semua Perangkat Lain</button></div>
      <div class="card" style="padding:0;overflow:auto;">
        <table class="data" id="tbl-sesi">
          <thead><tr><th>Perangkat</th><th>Alamat IP</th><th>Terakhir Aktif</th><th>Status</th></tr></thead>
          <tbody><tr><td colspan="4"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  `;
  const tbody = document.querySelector('#tbl-sesi tbody');
  try {
    const res = await Api.sessions();
    const list = res.data || [];
    tbody.innerHTML = list.length ? list.map((s) => `
      <tr>
        <td>${escapeHtml(s.device_info || '-')}</td>
        <td class="mono">${escapeHtml(s.ip_address || '-')}</td>
        <td>${fmtTanggalWaktu(s.last_active_at || s.created_at)}</td>
        <td><span class="badge ${statusBadgeClass(s.status)}"><i class="badge-dot"></i>${escapeHtml(s.status)}</span></td>
      </tr>`).join('') : `<tr><td colspan="4" class="muted">Belum ada data sesi.</td></tr>`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
  }

  document.getElementById('btn-logout-others').addEventListener('click', async () => {
    try {
      await Api.logoutOthers();
      toast('Berhasil keluar dari perangkat lain.', 'success');
      viewPerangkat();
    } catch (e) {
      toast(e.message, 'error');
    }
  });
}

/* ---------------------------- router ---------------------------- */

const routes = {
  '/': viewHome,
  '/jadwal': viewJadwal,
  '/lokasi': viewLokasi,
  '/daftar': viewDaftar,
  '/verifikasi-otp': viewVerifikasiOtp,
  '/masuk': viewMasuk,
  '/lupa-password': viewLupaPassword,
  '/reset-password': viewResetPassword,
  '/dashboard': viewDashboard,
  '/profil': viewProfil,
  '/kuesioner': viewKuesioner,
  '/kartu-donor': viewKartuDonor,
  '/perangkat': viewPerangkat,
};

function router() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const view = routes[hash] || viewHome;
  window.scrollTo(0, 0);
  renderNav();
  document.querySelectorAll('.nav__link').forEach((l) => {
    l.classList.toggle('is-active', l.getAttribute('href') === '#' + hash);
  });
  view();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
