import { app } from '../elements.js';
import { escapeHtml, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { fmtTanggal } from '../../../js/shared/format.js';
import { Api } from '../../../js/api.js';
import { pageHeader, emptyState, paginateList, paginationHtml, bindPagination } from '../ui.js';
import { requireRole } from '../guards.js';

/* FR-9.1: Dashboard Statistik Donor */
export async function viewDashboard() {
  if (!requireRole('/dashboard')) return;

  app.innerHTML = `
    ${pageHeader('Statistik', 'Dashboard Statistik Donor', 'Ringkasan jumlah pendaftar, kehadiran, dan tingkat pembatalan pada kegiatan donor darah.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div class="card" style="margin-bottom:20px;">
        <form id="form-filter" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;">
          <div class="field" style="margin-bottom:0;min-width:200px;">
            <label for="f-lokasi">Lokasi</label>
            <select class="input" id="f-lokasi"><option value="">Semua lokasi</option></select>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label for="f-mulai">Dari tanggal</label>
            <input class="input" type="date" id="f-mulai">
          </div>
          <div class="field" style="margin-bottom:0;">
            <label for="f-akhir">Sampai tanggal</label>
            <input class="input" type="date" id="f-akhir">
          </div>
          <button type="submit" class="btn btn-primary" id="btn-terapkan">Terapkan</button>
        </form>
      </div>

      <div id="alert-slot"></div>
      <div id="ringkasan-slot" style="margin-bottom:20px;"></div>

      <div class="grid-2" id="grid-detail">
        <div>
          <h2 style="font-size:1.05rem;margin:0 0 10px;">Per Lokasi</h2>
          <div class="card" style="padding:0;overflow:auto;">
            <table class="data" id="tbl-lokasi">
              <thead><tr><th>Lokasi</th><th>Pendaftar</th><th>Hadir</th><th>Batal</th></tr></thead>
              <tbody><tr><td colspan="4"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
            </table>
          </div>
          <div id="lokasi-pagination-slot" style="margin-top:14px;"></div>
        </div>
        <div>
          <h2 style="font-size:1.05rem;margin:0 0 10px;">Tren Harian</h2>
          <div class="card" style="padding:0;overflow:auto;">
            <table class="data" id="tbl-harian">
              <thead><tr><th>Tanggal</th><th>Pendaftar</th><th>Hadir</th></tr></thead>
              <tbody><tr><td colspan="3"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
            </table>
          </div>
          <div id="harian-pagination-slot" style="margin-top:14px;"></div>
        </div>
      </div>
    </div>
  `;

  const selectLokasi = document.getElementById('f-lokasi');
  const inputMulai = document.getElementById('f-mulai');
  const inputAkhir = document.getElementById('f-akhir');
  const alertSlot = document.getElementById('alert-slot');
  const ringkasanSlot = document.getElementById('ringkasan-slot');
  const btnTerapkan = document.getElementById('btn-terapkan');
  const tbodyLokasi = document.querySelector('#tbl-lokasi tbody');
  const tbodyHarian = document.querySelector('#tbl-harian tbody');
  const paginasiLokasiSlot = document.getElementById('lokasi-pagination-slot');
  const paginasiHarianSlot = document.getElementById('harian-pagination-slot');
  let halamanLokasi = 1;
  let halamanHarian = 1;

  function kartu(label, nilai) {
    return `
      <div>
        <div class="mono" style="font-size:1.6rem;font-weight:700;">${nilai}</div>
        <div class="muted" style="font-size:.75rem;">${label}</div>
      </div>`;
  }

  function renderRingkasan(r) {
    ringkasanSlot.innerHTML = `
      <div class="card" style="display:flex;gap:32px;flex-wrap:wrap;">
        ${kartu('Jumlah Pendaftar', r.jumlah_pendaftar)}
        ${kartu('Jumlah Kehadiran', r.jumlah_kehadiran)}
        ${kartu('Jumlah Dibatalkan', r.jumlah_dibatalkan)}
        ${kartu('Tingkat Kehadiran', r.tingkat_kehadiran + '%')}
        ${kartu('Tingkat Pembatalan', r.tingkat_pembatalan + '%')}
      </div>`;
  }

  let daftarPerLokasi = [];
  let daftarPerHari = [];

  function renderPerLokasi(list) {
    daftarPerLokasi = list;

    if (!list.length) {
      tbodyLokasi.innerHTML = `<tr><td colspan="4">${emptyState('Belum ada data untuk filter ini.')}</td></tr>`;
      paginasiLokasiSlot.innerHTML = '';
      return;
    }

    const { items, page, totalPages } = paginateList(list, halamanLokasi);
    halamanLokasi = page;

    tbodyLokasi.innerHTML = items.map((l) => `
      <tr>
        <td>${escapeHtml(l.nama_lokasi)}</td>
        <td class="mono">${l.jumlah_pendaftar}</td>
        <td class="mono">${l.jumlah_kehadiran}</td>
        <td class="mono">${l.jumlah_dibatalkan}</td>
      </tr>
    `).join('');

    paginasiLokasiSlot.innerHTML = paginationHtml(page, totalPages);
    bindPagination(paginasiLokasiSlot, (delta) => {
      halamanLokasi += delta;
      renderPerLokasi(daftarPerLokasi);
    });
  }

  function renderPerHari(list) {
    daftarPerHari = list;

    if (!list.length) {
      tbodyHarian.innerHTML = `<tr><td colspan="3">${emptyState('Belum ada data untuk filter ini.')}</td></tr>`;
      paginasiHarianSlot.innerHTML = '';
      return;
    }

    const { items, page, totalPages } = paginateList(list, halamanHarian);
    halamanHarian = page;

    tbodyHarian.innerHTML = items.map((h) => `
      <tr>
        <td>${escapeHtml(fmtTanggal(h.tanggal))}</td>
        <td class="mono">${h.jumlah_pendaftar}</td>
        <td class="mono">${h.jumlah_kehadiran}</td>
      </tr>
    `).join('');

    paginasiHarianSlot.innerHTML = paginationHtml(page, totalPages);
    bindPagination(paginasiHarianSlot, (delta) => {
      halamanHarian += delta;
      renderPerHari(daftarPerHari);
    });
  }

  async function loadLokasiOptions() {
    try {
      const res = await Api.adminLokasiList();
      const list = res.data || [];
      selectLokasi.innerHTML = `<option value="">Semua lokasi</option>` +
        list.map((l) => `<option value="${l.id_lokasi}">${escapeHtml(l.nama_lokasi)}</option>`).join('');
    } catch (_) { /* filter lokasi opsional, biarkan default "Semua lokasi" kalau gagal dimuat */ }
  }

  async function load() {
    alertSlot.innerHTML = '';
    setLoading(btnTerapkan, true);
    halamanLokasi = 1;
    halamanHarian = 1;
    const filter = {
      id_lokasi: selectLokasi.value,
      tanggal_mulai: inputMulai.value,
      tanggal_akhir: inputAkhir.value,
    };
    try {
      const res = await Api.adminDashboardStatistik(filter);
      renderRingkasan(res.data.ringkasan);
      renderPerLokasi(res.data.per_lokasi || []);
      renderPerHari(res.data.per_hari || []);
    } catch (e) {
      alertSlot.innerHTML = renderAlertError(e);
    } finally {
      setLoading(btnTerapkan, false, 'Terapkan');
    }
  }

  document.getElementById('form-filter').addEventListener('submit', (e) => {
    e.preventDefault();
    load();
  });

  await loadLokasiOptions();
  load();
}
