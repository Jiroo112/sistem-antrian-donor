/**
 * main.js — Papan Antrian Digital (FR-5.4). Halaman publik berdiri sendiri,
 * dimaksudkan ditayangkan penuh layar di TV/monitor lokasi donor. Tidak ada
 * login/router SPA di sini -- cuma satu jadwal (dari query string ?id_jadwal=)
 * yang di-poll dan dirender ulang.
 */
import { escapeHtml } from '../../js/shared/dom.js';
import { Api } from '../../js/api.js';

// Sama seperti tracking pribadi pendonor (lihat pendonor/js/views/antrian.js)
// -- selaras dengan NFR "pembaruan status antrian real-time maksimal jeda 5 detik".
const INTERVAL_POLLING_MS = 5000;

const board = document.getElementById('board');
const idJadwal = new URLSearchParams(location.search).get('id_jadwal');

function fmtTanggal(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (_) { return iso; }
}

function fmtJamSekarang() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function renderError(message) {
  board.innerHTML = `<div class="board__error">${escapeHtml(message)}</div>`;
}

function renderBoard(data) {
  const j = data.jadwal || {};
  const nomorUtama = data.nomor_sedang_dilayani !== null
    ? String(data.nomor_sedang_dilayani).padStart(3, '0')
    : null;
  const menunggu = data.daftar_menunggu || [];

  board.innerHTML = `
    <div class="board__header">
      <h1 class="board__lokasi">${escapeHtml(j.nama_lokasi || 'Lokasi Donor')}</h1>
      <p class="board__jadwal">${fmtTanggal(j.tanggal)} · ${escapeHtml(j.slot_waktu || '-')}</p>
    </div>
    <div class="board__utama">
      <p class="board__utama-label">Nomor Sedang Dilayani</p>
      ${nomorUtama
        ? `<div class="board__utama-nomor">${nomorUtama}</div>`
        : `<div class="board__utama-nomor board__utama-nomor--kosong">Belum ada nomor dipanggil</div>`}
    </div>
    <div>
      <p class="board__menunggu-label">Menunggu (${data.jumlah_menunggu || 0})</p>
      <div class="board__grid">
        ${menunggu.length
          ? menunggu.map((n) => `<div class="board__chip">${String(n).padStart(3, '0')}</div>`).join('')
          : `<div class="board__grid-empty">Tidak ada pendonor dalam antrian saat ini.</div>`}
      </div>
    </div>
    <p class="board__footer"><span class="dot"></span>Diperbarui otomatis · ${fmtJamSekarang()}</p>
  `;
}

async function load() {
  try {
    const res = await Api.papanAntrian(idJadwal);
    renderBoard(res.data);
  } catch (e) {
    renderError(e.message || 'Gagal memuat papan antrian.');
  }
}

if (!idJadwal) {
  renderError('Parameter id_jadwal tidak ditemukan. Buka halaman ini dengan format: papan-antrian.html?id_jadwal=<ID>');
} else {
  load();
  setInterval(load, INTERVAL_POLLING_MS);
}
