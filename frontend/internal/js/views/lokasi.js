import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { pageHeader, emptyState, paginateList, paginationHtml, bindPagination } from '../ui.js';
import { requireRole } from '../guards.js';

/* FR-7.4: Kelola Lokasi Donor */
export async function viewLokasi() {
  if (!requireRole('/lokasi')) return;
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
      <div id="lokasi-pagination-slot" style="margin-top:14px;"></div>
    </div>
  `;

  const tbody = document.querySelector('#tbl-lokasi tbody');
  const paginasiSlot = document.getElementById('lokasi-pagination-slot');
  let halamanLokasi = 1;
  let daftarLokasiTerakhir = [];

  async function load() {
    tbody.innerHTML = `<tr><td colspan="6"><div class="skeleton" style="height:20px;"></div></td></tr>`;
    paginasiSlot.innerHTML = '';
    try {
      const res = await Api.adminLokasiList();
      daftarLokasiTerakhir = res.data || [];
      halamanLokasi = 1;
      renderTabelLokasi();
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
    }
  }

  function renderTabelLokasi() {
    const list = daftarLokasiTerakhir;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6">${emptyState('Belum ada lokasi.')}</td></tr>`;
      paginasiSlot.innerHTML = '';
      return;
    }

    const { items, page, totalPages } = paginateList(list, halamanLokasi);
    halamanLokasi = page;

    tbody.innerHTML = items.map((l) => `
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
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openModal(list.find((x) => String(x.id_lokasi) === b.dataset.edit))));
    tbody.querySelectorAll('[data-hapus]').forEach((b) => b.addEventListener('click', () => hapus(b.dataset.hapus)));

    paginasiSlot.innerHTML = paginationHtml(page, totalPages);
    bindPagination(paginasiSlot, (delta) => {
      halamanLokasi += delta;
      renderTabelLokasi();
    });
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
