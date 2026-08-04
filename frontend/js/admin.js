/* admin.js — SPA untuk Panel Petugas / Admin UDD / Super Admin. */

const app = document.getElementById('app');
const navSlot = document.getElementById('nav-slot');
const USER_KEY = 'antrian_donor_internal_user';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(message, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  const node = el(`<div class="toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}">${escapeHtml(message)}</div>`);
  wrap.appendChild(node);
  setTimeout(() => node.remove(), 4200);
}
function setLoading(buttonEl, loading, labelWhenIdle) {
  if (!buttonEl) return;
  buttonEl.disabled = loading;
  buttonEl.innerHTML = loading ? '<span class="spinner"></span> Memproses…' : labelWhenIdle;
}
function renderAlertError(err) {
  let details = '';
  if (err.fieldErrors) {
    details = '<ul style="margin:6px 0 0 18px;padding:0;">' +
      Object.values(err.fieldErrors).map((m) => `<li>${escapeHtml(m)}</li>`).join('') + '</ul>';
  }
  return `<div class="alert alert-error"><div><strong>${escapeHtml(err.message)}</strong>${details}</div></div>`;
}
function currentUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch (_) { return null; }
}
function requireAuth() {
  if (!Auth.isLoggedIn('internal')) {
    toast('Silakan masuk sebagai petugas/admin terlebih dahulu.', 'error');
    location.hash = '#/masuk';
    return false;
  }
  return true;
}
function pageHeader(eyebrow, title, subtitle) {
  return `
    <div class="shell" style="padding-top:36px;">
      <p class="eyebrow">${eyebrow}</p>
      <h1 style="font-size:1.7rem;max-width:640px;">${title}</h1>
      ${subtitle ? `<p style="max-width:620px;">${subtitle}</p>` : ''}
    </div>`;
}

/* ---------------------------- nav ---------------------------- */
function renderNav() {
  const loggedIn = Auth.isLoggedIn('internal');
  const user = currentUser();
  navSlot.innerHTML = '';
  if (loggedIn) {
    navSlot.appendChild(el(`<a class="nav__link" href="#/jadwal">Kelola Jadwal</a>`));
    navSlot.appendChild(el(`<a class="nav__link" href="#/lokasi">Kelola Lokasi</a>`));
    navSlot.appendChild(el(`<span class="badge badge--info" style="margin:0 6px;">${escapeHtml(user?.peran || '')}</span>`));
    navSlot.appendChild(el(`<button class="nav__link" id="btn-logout">Keluar</button>`));
  } else {
    navSlot.appendChild(el(`<a class="nav__link" href="#/masuk">Masuk</a>`));
  }
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clearToken('internal');
      sessionStorage.removeItem(USER_KEY);
      toast('Berhasil keluar.', 'success');
      location.hash = '#/masuk';
    });
  }
}

/* ============================================================
   VIEW: Login internal
   ============================================================ */
function viewMasuk() {
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
      sessionStorage.setItem(USER_KEY, JSON.stringify(res.data));
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

/* ============================================================
   VIEW: Kelola Jadwal (FR-7.1)
   ============================================================ */
async function viewJadwal() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Manajemen jadwal', 'Kelola Jadwal & Kuota Donor', 'Buat, ubah, atau batalkan jadwal kegiatan donor darah beserta kuota per slot waktu.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div class="field-row" style="margin-bottom:0;">
          <input class="input" type="date" id="filter-tanggal" style="min-width:160px;">
        </div>
        <button class="btn btn-primary" id="btn-tambah-jadwal">+ Tambah Jadwal</button>
      </div>
      <div class="card" style="padding:0;overflow:auto;">
        <table class="data" id="tbl-jadwal">
          <thead><tr><th>ID</th><th>Lokasi</th><th>Tanggal</th><th>Slot</th><th>Kuota</th><th>Status</th><th></th></tr></thead>
          <tbody><tr><td colspan="7"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = document.querySelector('#tbl-jadwal tbody');
  let lokasiCache = [];

  async function loadLokasiCache() {
    try {
      const res = await Api.adminLokasiList();
      lokasiCache = res.data || [];
    } catch (_) { lokasiCache = []; }
  }

  async function load(filter = {}) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="skeleton" style="height:20px;"></div></td></tr>`;
    try {
      const res = await Api.adminJadwalList(filter);
      const list = res.data || [];
      tbody.innerHTML = list.length ? list.map((j) => `
        <tr>
          <td class="mono">#${j.id_jadwal}</td>
          <td>${escapeHtml(j.nama_lokasi || ('Lokasi #' + j.id_lokasi))}</td>
          <td>${escapeHtml(j.tanggal)}</td>
          <td>${escapeHtml(j.slot_waktu)}</td>
          <td>${j.kuota_tersisa ?? '-'} / ${j.kuota_total}</td>
          <td><span class="badge ${j.status === 'aktif' || !j.status ? 'badge--aktif' : 'badge--nonaktif'}"><i class="badge-dot"></i>${escapeHtml(j.status || 'aktif')}</span></td>
          <td style="white-space:nowrap;">
            <button class="btn btn-ghost btn-sm" data-edit="${j.id_jadwal}">Ubah</button>
            <button class="btn btn-danger btn-sm" data-hapus="${j.id_jadwal}">Batalkan</button>
          </td>
        </tr>
      `).join('') : `<tr><td colspan="7" class="muted" style="padding:24px;">Belum ada jadwal.</td></tr>`;

      tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openModal(list.find((x) => String(x.id_jadwal) === b.dataset.edit))));
      tbody.querySelectorAll('[data-hapus]').forEach((b) => b.addEventListener('click', () => hapus(b.dataset.hapus)));
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
    }
  }

  async function hapus(id) {
    if (!confirm('Batalkan jadwal ini? Slot yang sudah terisi tidak akan otomatis dikembalikan ke pendonor.')) return;
    try {
      await Api.adminJadwalDelete(id);
      toast('Jadwal dibatalkan.', 'success');
      load({ tanggal: document.getElementById('filter-tanggal').value });
    } catch (e) { toast(e.message, 'error'); }
  }

  function openModal(existing) {
    const isEdit = !!existing;
    const backdrop = el(`
      <div class="modal-backdrop">
        <div class="modal">
          <h3 style="margin-bottom:14px;">${isEdit ? 'Ubah Jadwal' : 'Tambah Jadwal Baru'}</h3>
          <div id="modal-alert"></div>
          <form id="form-modal">
            <div class="field">
              <label for="m-lokasi">Lokasi</label>
              <select class="input" id="m-lokasi" required>
                <option value="">— Pilih lokasi —</option>
                ${lokasiCache.map((l) => `<option value="${l.id_lokasi}" ${existing && existing.id_lokasi == l.id_lokasi ? 'selected' : ''}>${escapeHtml(l.nama_lokasi)}</option>`).join('')}
              </select>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="m-tanggal">Tanggal</label>
                <input class="input" type="date" id="m-tanggal" required value="${existing ? existing.tanggal : ''}">
              </div>
              <div class="field">
                <label for="m-slot">Slot Waktu</label>
                <input class="input" id="m-slot" placeholder="08:00-10:00" required value="${existing ? escapeHtml(existing.slot_waktu) : ''}">
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="m-kuota">Kuota Total</label>
                <input class="input" type="number" id="m-kuota" min="1" required value="${existing ? existing.kuota_total : ''}">
              </div>
              ${isEdit ? `
              <div class="field">
                <label for="m-status">Status</label>
                <select class="input" id="m-status">
                  <option value="aktif" ${existing.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                  <option value="nonaktif" ${existing.status === 'nonaktif' ? 'selected' : ''}>Nonaktif</option>
                </select>
              </div>` : ''}
            </div>
            <div style="display:flex;gap:10px;margin-top:8px;">
              <button type="button" class="btn btn-ghost btn-block" id="btn-batal-modal">Batal</button>
              <button type="submit" class="btn btn-primary btn-block" id="btn-simpan-modal">${isEdit ? 'Simpan Perubahan' : 'Buat Jadwal'}</button>
            </div>
          </form>
        </div>
      </div>
    `);
    document.body.appendChild(backdrop);
    backdrop.querySelector('#btn-batal-modal').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

    backdrop.querySelector('#form-modal').addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertSlot = backdrop.querySelector('#modal-alert');
      alertSlot.innerHTML = '';
      const btn = backdrop.querySelector('#btn-simpan-modal');
      setLoading(btn, true);
      const payload = {
        id_lokasi: backdrop.querySelector('#m-lokasi').value,
        tanggal: backdrop.querySelector('#m-tanggal').value,
        slot_waktu: backdrop.querySelector('#m-slot').value,
        kuota_total: backdrop.querySelector('#m-kuota').value,
      };
      if (isEdit) payload.status = backdrop.querySelector('#m-status').value;
      try {
        if (isEdit) await Api.adminJadwalUpdate(existing.id_jadwal, payload);
        else await Api.adminJadwalCreate(payload);
        toast(isEdit ? 'Jadwal diperbarui.' : 'Jadwal dibuat.', 'success');
        backdrop.remove();
        load({ tanggal: document.getElementById('filter-tanggal').value });
      } catch (err) {
        alertSlot.innerHTML = renderAlertError(err);
        setLoading(btn, false, isEdit ? 'Simpan Perubahan' : 'Buat Jadwal');
      }
    });
  }

  document.getElementById('btn-tambah-jadwal').addEventListener('click', () => openModal(null));
  document.getElementById('filter-tanggal').addEventListener('change', (e) => load({ tanggal: e.target.value }));

  await loadLokasiCache();
  load();
}

/* ============================================================
   VIEW: Kelola Lokasi (FR-7.4)
   ============================================================ */
async function viewLokasi() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Manajemen lokasi', 'Kelola Lokasi Donor', 'Tambah atau ubah data lokasi UDD tetap maupun unit donor bergerak beserta titik koordinat.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
        <button class="btn btn-primary" id="btn-tambah-lokasi">+ Tambah Lokasi</button>
      </div>
      <div class="card" style="padding:0;overflow:auto;">
        <table class="data" id="tbl-lokasi">
          <thead><tr><th>Nama</th><th>Jenis</th><th>Alamat</th><th>Koordinat</th><th>Status</th><th></th></tr></thead>
          <tbody><tr><td colspan="6"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = document.querySelector('#tbl-lokasi tbody');

  async function load() {
    tbody.innerHTML = `<tr><td colspan="6"><div class="skeleton" style="height:20px;"></div></td></tr>`;
    try {
      const res = await Api.adminLokasiList();
      const list = res.data || [];
      tbody.innerHTML = list.length ? list.map((l) => `
        <tr>
          <td>${escapeHtml(l.nama_lokasi)}</td>
          <td><span class="badge ${l.jenis === 'mobile_unit' ? 'badge--info' : 'badge--aktif'}">${l.jenis === 'mobile_unit' ? 'Unit Bergerak' : 'UDD Tetap'}</span></td>
          <td>${escapeHtml(l.alamat)}</td>
          <td class="mono muted">${l.latitude && l.longitude ? `${l.latitude}, ${l.longitude}` : '-'}</td>
          <td><span class="badge ${l.status_lokasi === 'nonaktif' ? 'badge--nonaktif' : 'badge--aktif'}"><i class="badge-dot"></i>${escapeHtml(l.status_lokasi || 'aktif')}</span></td>
          <td style="white-space:nowrap;">
            <button class="btn btn-ghost btn-sm" data-edit="${l.id_lokasi}">Ubah</button>
            <button class="btn btn-danger btn-sm" data-hapus="${l.id_lokasi}">Nonaktifkan</button>
          </td>
        </tr>
      `).join('') : `<tr><td colspan="6" class="muted" style="padding:24px;">Belum ada lokasi.</td></tr>`;

      tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openModal(list.find((x) => String(x.id_lokasi) === b.dataset.edit))));
      tbody.querySelectorAll('[data-hapus]').forEach((b) => b.addEventListener('click', () => hapus(b.dataset.hapus)));
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
    }
  }

  async function hapus(id) {
    if (!confirm('Nonaktifkan lokasi ini? Lokasi tidak akan tampil lagi di pencarian pendonor.')) return;
    try {
      await Api.adminLokasiDelete(id);
      toast('Lokasi dinonaktifkan.', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  function openModal(existing) {
    const isEdit = !!existing;
    const backdrop = el(`
      <div class="modal-backdrop">
        <div class="modal">
          <h3 style="margin-bottom:14px;">${isEdit ? 'Ubah Lokasi' : 'Tambah Lokasi Baru'}</h3>
          <div id="modal-alert"></div>
          <form id="form-modal">
            <div class="field">
              <label for="m-nama">Nama Lokasi</label>
              <input class="input" id="m-nama" required value="${existing ? escapeHtml(existing.nama_lokasi) : ''}">
            </div>
            <div class="field">
              <label>Jenis</label>
              <div class="radio-group">
                <label class="radio-pill ${(!existing || existing.jenis === 'tetap') ? 'is-checked' : ''}" data-val="tetap"><input type="radio" name="jenis" value="tetap" ${(!existing || existing.jenis === 'tetap') ? 'checked' : ''}>UDD Tetap</label>
                <label class="radio-pill ${existing && existing.jenis === 'mobile_unit' ? 'is-checked' : ''}" data-val="mobile_unit"><input type="radio" name="jenis" value="mobile_unit" ${existing && existing.jenis === 'mobile_unit' ? 'checked' : ''}>Unit Bergerak</label>
              </div>
            </div>
            <div class="field">
              <label for="m-alamat">Alamat</label>
              <textarea class="input" id="m-alamat" rows="2" required>${existing ? escapeHtml(existing.alamat) : ''}</textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="m-lat">Latitude</label>
                <input class="input" id="m-lat" type="number" step="0.000001" value="${existing && existing.latitude ? existing.latitude : ''}">
              </div>
              <div class="field">
                <label for="m-lng">Longitude</label>
                <input class="input" id="m-lng" type="number" step="0.000001" value="${existing && existing.longitude ? existing.longitude : ''}">
              </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:8px;">
              <button type="button" class="btn btn-ghost btn-block" id="btn-batal-modal">Batal</button>
              <button type="submit" class="btn btn-primary btn-block" id="btn-simpan-modal">${isEdit ? 'Simpan Perubahan' : 'Tambah Lokasi'}</button>
            </div>
          </form>
        </div>
      </div>
    `);
    document.body.appendChild(backdrop);
    backdrop.querySelector('#btn-batal-modal').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    backdrop.querySelectorAll('.radio-pill').forEach((p) => {
      p.addEventListener('click', () => {
        backdrop.querySelectorAll('.radio-pill').forEach((x) => x.classList.remove('is-checked'));
        p.classList.add('is-checked');
      });
    });

    backdrop.querySelector('#form-modal').addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertSlot = backdrop.querySelector('#modal-alert');
      alertSlot.innerHTML = '';
      const btn = backdrop.querySelector('#btn-simpan-modal');
      setLoading(btn, true);
      const payload = {
        nama_lokasi: backdrop.querySelector('#m-nama').value,
        jenis: backdrop.querySelector('input[name="jenis"]:checked').value,
        alamat: backdrop.querySelector('#m-alamat').value,
        latitude: backdrop.querySelector('#m-lat').value,
        longitude: backdrop.querySelector('#m-lng').value,
      };
      try {
        if (isEdit) await Api.adminLokasiUpdate(existing.id_lokasi, payload);
        else await Api.adminLokasiCreate(payload);
        toast(isEdit ? 'Lokasi diperbarui.' : 'Lokasi ditambahkan.', 'success');
        backdrop.remove();
        load();
      } catch (err) {
        alertSlot.innerHTML = renderAlertError(err);
        setLoading(btn, false, isEdit ? 'Simpan Perubahan' : 'Tambah Lokasi');
      }
    });
  }

  document.getElementById('btn-tambah-lokasi').addEventListener('click', () => openModal(null));
  load();
}

/* ---------------------------- router ---------------------------- */
const routes = {
  '/masuk': viewMasuk,
  '/jadwal': viewJadwal,
  '/lokasi': viewLokasi,
};

function router() {
  const hash = location.hash.replace(/^#/, '') || (Auth.isLoggedIn('internal') ? '/jadwal' : '/masuk');
  const view = routes[hash] || (Auth.isLoggedIn('internal') ? viewJadwal : viewMasuk);
  window.scrollTo(0, 0);
  renderNav();
  document.querySelectorAll('.nav__link').forEach((l) => {
    l.classList.toggle('is-active', l.getAttribute('href') === '#' + hash);
  });
  view();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
