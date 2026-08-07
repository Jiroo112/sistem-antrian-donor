import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { pageHeader, emptyState, paginateList, paginationHtml, bindPagination } from '../ui.js';
import { requireRole } from '../guards.js';

/* FR-7.1: Kelola Jadwal & Kuota Donor */
export async function viewJadwal() {
  if (!requireRole('/jadwal')) return;
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
      <div id="jadwal-pagination-slot" style="margin-top:14px;"></div>
    </div>
  `;

  const tbody = document.querySelector('#tbl-jadwal tbody');
  const paginasiSlot = document.getElementById('jadwal-pagination-slot');
  let lokasiCache = [];
  let halamanJadwal = 1;
  let daftarJadwalTerakhir = [];

  async function loadLokasiCache() {
    try {
      const res = await Api.adminLokasiList();
      lokasiCache = res.data || [];
    } catch (_) { lokasiCache = []; }
  }

  async function load(filter = {}) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="skeleton" style="height:20px;"></div></td></tr>`;
    paginasiSlot.innerHTML = '';
    try {
      const res = await Api.adminJadwalList(filter);
      daftarJadwalTerakhir = res.data || [];
      halamanJadwal = 1;
      renderTabelJadwal();
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
    }
  }

  function renderTabelJadwal() {
    const list = daftarJadwalTerakhir;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7">${emptyState('Belum ada jadwal.')}</td></tr>`;
      paginasiSlot.innerHTML = '';
      return;
    }

    const { items, page, totalPages } = paginateList(list, halamanJadwal);
    halamanJadwal = page;

    tbody.innerHTML = items.map((j) => `
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
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openModal(list.find((x) => String(x.id_jadwal) === b.dataset.edit))));
    tbody.querySelectorAll('[data-hapus]').forEach((b) => b.addEventListener('click', () => hapus(b.dataset.hapus)));

    paginasiSlot.innerHTML = paginationHtml(page, totalPages);
    bindPagination(paginasiSlot, (delta) => {
      halamanJadwal += delta;
      renderTabelJadwal();
    });
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
