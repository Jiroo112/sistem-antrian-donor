import { app } from '../elements.js';
import { escapeHtml, setLoading, toast, renderAlertError } from '../../../js/shared/dom.js';
import { fmtTanggal, fmtTanggalWaktu, statusBadgeClass, labelStatusAntrian } from '../../../js/shared/format.js';
import { Api } from '../../../js/api.js';
import { pageHeader } from '../ui.js';
import { requireRole } from '../guards.js';

/**
 * FR-9.2: Laporan Ekspor Data. "Unduh CSV" memanggil admin/laporan/export
 * (dibuka Excel langsung). "Cetak / Simpan PDF" memakai window.print() pada
 * tabel yang sama, bukan generate file PDF di server -- proyek ini tidak
 * punya library PDF terpasang (lihat catatan di admin/Laporan.php), jadi
 * cetak browser dipakai supaya format PDF tetap terpenuhi tanpa dependency
 * baru. Elemen berclass "no-print" (filter & tombol) disembunyikan otomatis
 * saat mencetak lewat aturan @media print di frontend/css/style.css.
 */
export async function viewLaporan() {
  if (!requireRole('/laporan')) return;

  app.innerHTML = `
    ${pageHeader('Pelaporan', 'Laporan Data Donor', 'Data pendonor dan hasil kegiatan donor untuk kebutuhan pelaporan internal PMI/UDD.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div class="card no-print" style="margin-bottom:20px;">
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
          <button type="button" class="btn btn-ghost" id="btn-unduh">Unduh CSV</button>
          <button type="button" class="btn btn-quiet" id="btn-cetak">Cetak / Simpan PDF</button>
        </form>
      </div>

      <div id="alert-slot"></div>
      <p class="muted" id="ringkasan-jumlah" style="margin:0 0 10px;"></p>

      <div class="card" style="padding:0;overflow:auto;">
        <table class="data" id="tbl-laporan">
          <thead>
            <tr>
              <th>No.</th><th>Nama Pendonor</th><th>NIK</th><th>Gol. Darah</th>
              <th>Lokasi</th><th>Tanggal</th><th>Slot</th><th>Status</th>
              <th>Check-in</th><th>Selesai</th>
            </tr>
          </thead>
          <tbody><tr><td colspan="10"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  const selectLokasi = document.getElementById('f-lokasi');
  const inputMulai = document.getElementById('f-mulai');
  const inputAkhir = document.getElementById('f-akhir');
  const alertSlot = document.getElementById('alert-slot');
  const ringkasanJumlah = document.getElementById('ringkasan-jumlah');
  const btnTerapkan = document.getElementById('btn-terapkan');
  const btnUnduh = document.getElementById('btn-unduh');
  const btnCetak = document.getElementById('btn-cetak');
  const tbody = document.querySelector('#tbl-laporan tbody');

  function currentFilter() {
    return {
      id_lokasi: selectLokasi.value,
      tanggal_mulai: inputMulai.value,
      tanggal_akhir: inputAkhir.value,
    };
  }

  async function loadLokasiOptions() {
    try {
      const res = await Api.adminLokasiList();
      const list = res.data || [];
      selectLokasi.innerHTML = `<option value="">Semua lokasi</option>` +
        list.map((l) => `<option value="${l.id_lokasi}">${escapeHtml(l.nama_lokasi)}</option>`).join('');
    } catch (_) { /* filter lokasi opsional, biarkan default "Semua lokasi" kalau gagal dimuat */ }
  }

  function renderTabel(list) {
    ringkasanJumlah.textContent = `${list.length} baris data`;
    tbody.innerHTML = list.length ? list.map((row) => `
      <tr>
        <td class="mono">${String(row.nomor_urut).padStart(3, '0')}</td>
        <td>${escapeHtml(row.nama_pendonor)}</td>
        <td class="mono">${escapeHtml(row.nik)}</td>
        <td>${escapeHtml(row.golongan_darah)}</td>
        <td>${escapeHtml(row.nama_lokasi)}</td>
        <td>${escapeHtml(fmtTanggal(row.tanggal))}</td>
        <td>${escapeHtml(row.slot_waktu)}</td>
        <td><span class="badge ${statusBadgeClass(row.status)}"><i class="badge-dot"></i>${escapeHtml(labelStatusAntrian(row.status))}</span></td>
        <td>${escapeHtml(fmtTanggalWaktu(row.waktu_checkin))}</td>
        <td>${escapeHtml(fmtTanggalWaktu(row.waktu_selesai))}</td>
      </tr>
    `).join('') : `<tr><td colspan="10" class="muted" style="padding:24px;">Belum ada data untuk filter ini.</td></tr>`;
  }

  async function load() {
    alertSlot.innerHTML = '';
    setLoading(btnTerapkan, true);
    try {
      const res = await Api.adminLaporanList(currentFilter());
      renderTabel(res.data.data || []);
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

  btnUnduh.addEventListener('click', async () => {
    setLoading(btnUnduh, true);
    try {
      await Api.adminLaporanExport(currentFilter());
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(btnUnduh, false, 'Unduh CSV');
    }
  });

  btnCetak.addEventListener('click', () => window.print());

  await loadLokasiOptions();
  load();
}
