import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { pageHeader } from '../ui.js';
import { requireRole } from '../guards.js';
import { getCurrentUser } from '../session.js';

const LABEL_PERAN = {
  petugas_loket: 'Petugas Loket',
  admin_udd: 'Admin UDD/Cabang',
  super_admin: 'Super Admin',
};

/* FR-9.3: Manajemen Hak Akses Pengguna Internal (khusus Super Admin) */
export async function viewPengguna() {
  if (!requireRole('/pengguna')) return;

  const idSaya = getCurrentUser()?.id_pengguna;

  app.innerHTML = `
    ${pageHeader('Pengguna internal', 'Manajemen Hak Akses Pengguna Internal', 'Kelola akun dan peran Petugas Loket, Admin UDD/Cabang, dan Super Admin.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div class="field-row" style="margin-bottom:0;">
          <select class="input" id="filter-peran" style="min-width:200px;">
            <option value="">Semua peran</option>
            <option value="petugas_loket">Petugas Loket</option>
            <option value="admin_udd">Admin UDD/Cabang</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-tambah">+ Tambah Pengguna</button>
      </div>
      <div class="card" style="padding:0;overflow:auto;">
        <table class="data" id="tbl-pengguna">
          <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Status</th><th></th></tr></thead>
          <tbody><tr><td colspan="5"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = document.querySelector('#tbl-pengguna tbody');
  const filterPeran = document.getElementById('filter-peran');

  async function load(filter = {}) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="skeleton" style="height:20px;"></div></td></tr>`;
    try {
      const res = await Api.adminPenggunaList(filter);
      const list = res.data || [];
      tbody.innerHTML = list.length ? list.map((u) => `
        <tr>
          <td>${escapeHtml(u.nama)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(LABEL_PERAN[u.peran] || u.peran)}</td>
          <td><span class="badge ${u.status_akun === 'aktif' ? 'badge--aktif' : 'badge--nonaktif'}"><i class="badge-dot"></i>${escapeHtml(u.status_akun)}</span></td>
          <td style="white-space:nowrap;">
            <button class="btn btn-ghost btn-sm" data-edit="${u.id_pengguna}">Ubah</button>
            ${String(u.id_pengguna) === String(idSaya) ? '' : `<button class="btn btn-danger btn-sm" data-nonaktifkan="${u.id_pengguna}">Nonaktifkan</button>`}
          </td>
        </tr>
      `).join('') : `<tr><td colspan="5" class="muted" style="padding:24px;">Belum ada pengguna internal.</td></tr>`;

      tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openModal(list.find((x) => String(x.id_pengguna) === b.dataset.edit))));
      tbody.querySelectorAll('[data-nonaktifkan]').forEach((b) => b.addEventListener('click', () => nonaktifkan(b.dataset.nonaktifkan)));
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
    }
  }

  async function nonaktifkan(id) {
    if (!confirm('Nonaktifkan pengguna ini? Akunnya tidak akan bisa dipakai login sampai diaktifkan kembali.')) return;
    try {
      await Api.adminPenggunaDelete(id);
      toast('Pengguna dinonaktifkan.', 'success');
      load({ peran: filterPeran.value });
    } catch (e) { toast(e.message, 'error'); }
  }

  function openModal(existing) {
    const isEdit = !!existing;
    const backdrop = el(`
      <div class="modal-backdrop">
        <div class="modal">
          <h3 style="margin-bottom:14px;">${isEdit ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}</h3>
          <div id="modal-alert"></div>
          <form id="form-modal">
            <div class="field">
              <label for="m-nama">Nama</label>
              <input class="input" id="m-nama" required value="${existing ? escapeHtml(existing.nama) : ''}">
            </div>
            <div class="field">
              <label for="m-email">Email</label>
              <input class="input" type="email" id="m-email" required value="${existing ? escapeHtml(existing.email) : ''}">
            </div>
            <div class="field">
              <label for="m-password">${isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
              <input class="input" type="password" id="m-password" minlength="8" placeholder="Minimal 8 karakter" ${isEdit ? '' : 'required'}>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="m-peran">Peran</label>
                <select class="input" id="m-peran" required>
                  <option value="petugas_loket" ${existing && existing.peran === 'petugas_loket' ? 'selected' : ''}>Petugas Loket</option>
                  <option value="admin_udd" ${existing && existing.peran === 'admin_udd' ? 'selected' : ''}>Admin UDD/Cabang</option>
                  <option value="super_admin" ${existing && existing.peran === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                </select>
              </div>
              ${isEdit ? `
              <div class="field">
                <label for="m-status">Status</label>
                <select class="input" id="m-status">
                  <option value="aktif" ${existing.status_akun === 'aktif' ? 'selected' : ''}>Aktif</option>
                  <option value="nonaktif" ${existing.status_akun === 'nonaktif' ? 'selected' : ''}>Nonaktif</option>
                </select>
              </div>` : ''}
            </div>
            <div style="display:flex;gap:10px;margin-top:8px;">
              <button type="button" class="btn btn-ghost btn-block" id="btn-batal-modal">Batal</button>
              <button type="submit" class="btn btn-primary btn-block" id="btn-simpan-modal">${isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}</button>
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

      const password = backdrop.querySelector('#m-password').value;
      const payload = {
        nama: backdrop.querySelector('#m-nama').value,
        email: backdrop.querySelector('#m-email').value,
        peran: backdrop.querySelector('#m-peran').value,
      };
      if (password) payload.password = password;
      if (isEdit) payload.status_akun = backdrop.querySelector('#m-status').value;

      try {
        if (isEdit) await Api.adminPenggunaUpdate(existing.id_pengguna, payload);
        else await Api.adminPenggunaCreate(payload);
        toast(isEdit ? 'Pengguna diperbarui.' : 'Pengguna dibuat.', 'success');
        backdrop.remove();
        load({ peran: filterPeran.value });
      } catch (err) {
        alertSlot.innerHTML = renderAlertError(err);
        setLoading(btn, false, isEdit ? 'Simpan Perubahan' : 'Buat Pengguna');
      }
    });
  }

  document.getElementById('btn-tambah').addEventListener('click', () => openModal(null));
  filterPeran.addEventListener('change', (e) => load({ peran: e.target.value }));

  load();
}
