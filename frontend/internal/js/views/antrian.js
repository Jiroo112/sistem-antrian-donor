import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast } from '../../../js/shared/dom.js';
import { statusBadgeClass, labelStatusAntrian } from '../../../js/shared/format.js';
import { Api } from '../../../js/api.js';
import { pageHeader } from '../ui.js';
import { requireRole } from '../guards.js';
import { BASE_PATH } from '../router.js';

// Selaras dengan tracking pendonor (FR-5.1) & papan antrian (FR-5.4) --
// NFR performa: "pembaruan status antrian real-time maksimal jeda 5 detik".
const INTERVAL_POLLING_MS = 5000;

/* FR-7.2 (Panggil Antrian) + FR-7.3 (Verifikasi Kehadiran/Check-in) */
export async function viewAntrian() {
  if (!requireRole('/antrian')) return;

  // BASE_PATH selalu berakhiran "/admin" (lihat router.js), jadi root situs
  // didapat dengan membuang akhiran itu -- dipakai buat tautan Papan Antrian
  // (halaman statis terpisah di root situs, bukan bagian rute /admin/*).
  // Sengaja dihitung DI DALAM fungsi, bukan di top-level modul -- lihat
  // komentar serupa di views/masuk.js soal kenapa (TDZ karena circular import).
  const siteRoot = BASE_PATH.replace(/\/admin$/, '');

  app.innerHTML = `
    ${pageHeader('Manajemen antrian', 'Panggil & Verifikasi Antrian', 'Panggil nomor antrian berikutnya, verifikasi kehadiran lewat QR code, dan tandai antrian yang sudah selesai diproses.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div class="card" style="margin-bottom:20px;">
        <label for="select-jadwal">Pilih Jadwal</label>
        <select class="input" id="select-jadwal"><option value="">Memuat daftar jadwal…</option></select>
        <div id="papan-antrian-row" style="display:none;margin-top:18px;padding-top:18px;border-top:1px solid var(--line);align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <p class="muted" style="margin:0;font-size:.85rem;">Tayangkan nomor antrian di layar/TV lokasi donor.</p>
          <a id="link-papan-antrian" class="btn btn-quiet btn-sm" href="#" target="_blank" rel="noopener">Buka Papan Antrian ↗</a>
        </div>
      </div>

      <div id="jadwal-kosong-slot"></div>

      <div id="jadwal-aktif-wrap" style="display:none;">
        <div class="card" style="margin-bottom:20px;">
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;">
            <div class="field" style="flex:1;min-width:220px;margin-bottom:0;">
              <label for="input-checkin">Verifikasi Kehadiran (scan/ketik kode QR)</label>
              <input class="input mono" id="input-checkin" placeholder="Tempel atau ketik kode QR pendonor di sini">
            </div>
            <button class="btn btn-primary" id="btn-checkin">Check-in</button>
          </div>
        </div>

        <div id="ringkasan-slot" style="margin-bottom:20px;"></div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
          <h2 style="font-size:1.1rem;margin:0;">Daftar Antrian</h2>
          <button class="btn btn-primary" id="btn-panggil-berikutnya">Panggil Nomor Berikutnya</button>
        </div>
        <div class="card" style="padding:0;overflow:auto;">
          <table class="data" id="tbl-antrian">
            <thead><tr><th>No.</th><th>Nama</th><th>Gol. Darah</th><th>Status</th><th></th></tr></thead>
            <tbody><tr><td colspan="5"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const selectJadwal = document.getElementById('select-jadwal');
  const jadwalKosongSlot = document.getElementById('jadwal-kosong-slot');
  const jadwalAktifWrap = document.getElementById('jadwal-aktif-wrap');
  const ringkasanSlot = document.getElementById('ringkasan-slot');
  const tbody = document.querySelector('#tbl-antrian tbody');
  const inputCheckin = document.getElementById('input-checkin');
  const btnCheckin = document.getElementById('btn-checkin');
  const btnPanggilBerikutnya = document.getElementById('btn-panggil-berikutnya');
  const papanAntrianRow = document.getElementById('papan-antrian-row');
  const linkPapanAntrian = document.getElementById('link-papan-antrian');

  let idJadwalTerpilih = null;
  let sedangMemuat = false;

  // FR-5.4: papan antrian aktornya "Sistem, Petugas Loket" -- tautannya
  // sengaja ditaruh di sini (halaman petugas), bukan di Kelola Jadwal, karena
  // itu halaman Admin UDD yang tidak bisa diakses petugas_loket.
  function updateLinkPapanAntrian() {
    if (!idJadwalTerpilih) {
      papanAntrianRow.style.display = 'none';
      return;
    }
    linkPapanAntrian.href = `${siteRoot}/papan-antrian.html?id_jadwal=${idJadwalTerpilih}`;
    papanAntrianRow.style.display = 'flex';
  }

  async function loadDaftarJadwal() {
    try {
      const res = await Api.adminJadwalList({});
      const list = res.data || [];
      if (!list.length) {
        selectJadwal.innerHTML = `<option value="">Belum ada jadwal</option>`;
        return;
      }
      selectJadwal.innerHTML = list.map((j) =>
        `<option value="${j.id_jadwal}">#${j.id_jadwal} — ${escapeHtml(j.nama_lokasi || ('Lokasi #' + j.id_lokasi))} · ${escapeHtml(j.tanggal)} ${escapeHtml(j.slot_waktu)}</option>`
      ).join('');
      idJadwalTerpilih = list[0].id_jadwal;
      selectJadwal.value = idJadwalTerpilih;
      jadwalAktifWrap.style.display = '';
      updateLinkPapanAntrian();
      loadAntrian();
    } catch (e) {
      selectJadwal.innerHTML = `<option value="">Gagal memuat jadwal</option>`;
      jadwalKosongSlot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    }
  }

  async function loadAntrian() {
    if (!idJadwalTerpilih || sedangMemuat) return;
    sedangMemuat = true;
    try {
      const res = await Api.adminAntrianList(idJadwalTerpilih);
      renderRingkasan(res.data.antrian || []);
      renderTabel(res.data.antrian || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
    } finally {
      sedangMemuat = false;
    }
  }

  function renderRingkasan(list) {
    const dipanggil = list.find((a) => a.status === 'dipanggil');
    const diproses = list.filter((a) => a.status === 'sedang_diproses');
    const menunggu = list.filter((a) => a.status === 'menunggu').length;
    ringkasanSlot.innerHTML = `
      <div class="card" style="display:flex;gap:32px;flex-wrap:wrap;">
        <div>
          <div class="mono" style="font-size:1.6rem;font-weight:700;">${dipanggil ? String(dipanggil.nomor_urut).padStart(3, '0') : '-'}</div>
          <div class="muted" style="font-size:.75rem;">Sedang dipanggil</div>
        </div>
        <div>
          <div class="mono" style="font-size:1.6rem;font-weight:700;">${diproses.length}</div>
          <div class="muted" style="font-size:.75rem;">Sedang diproses</div>
        </div>
        <div>
          <div class="mono" style="font-size:1.6rem;font-weight:700;">${menunggu}</div>
          <div class="muted" style="font-size:.75rem;">Menunggu</div>
        </div>
      </div>
    `;
  }

  function renderTabel(list) {
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="muted" style="padding:24px;">Belum ada antrian untuk jadwal ini.</td></tr>`;
      return;
    }
    tbody.innerHTML = '';
    list.forEach((a) => {
      tbody.appendChild(el(`
        <tr>
          <td class="mono">${String(a.nomor_urut).padStart(3, '0')}</td>
          <td>${escapeHtml(a.nama)}</td>
          <td>${escapeHtml(a.golongan_darah)}</td>
          <td><span class="badge ${statusBadgeClass(a.status)}"><i class="badge-dot"></i>${escapeHtml(labelStatusAntrian(a.status))}</span></td>
          <td style="white-space:nowrap;">${renderAksiButtons(a)}</td>
        </tr>
      `));
    });

    tbody.querySelectorAll('[data-panggil]').forEach((b) => b.addEventListener('click', () => aksiPanggil(b, b.dataset.panggil)));
    tbody.querySelectorAll('[data-lewati]').forEach((b) => b.addEventListener('click', () => aksiLewati(b, b.dataset.lewati)));
    tbody.querySelectorAll('[data-selesai]').forEach((b) => b.addEventListener('click', () => aksiSelesai(b, b.dataset.selesai)));
  }

  function renderAksiButtons(a) {
    if (a.status === 'menunggu') {
      return `
        <button class="btn btn-ghost btn-sm" data-panggil="${a.id_antrian}">Panggil</button>
        <button class="btn btn-danger btn-sm" data-lewati="${a.id_antrian}">Lewati</button>
      `;
    }
    if (a.status === 'dipanggil') {
      return `
        <button class="btn btn-ghost btn-sm" data-panggil="${a.id_antrian}">Panggil Ulang</button>
        <button class="btn btn-danger btn-sm" data-lewati="${a.id_antrian}">Lewati</button>
      `;
    }
    if (a.status === 'sedang_diproses') {
      return `<button class="btn btn-primary btn-sm" data-selesai="${a.id_antrian}">Selesaikan</button>`;
    }
    return '';
  }

  async function aksiPanggil(btn, idAntrian) {
    setLoading(btn, true);
    try {
      await Api.adminAntrianPanggil({ id_antrian: idAntrian });
      toast('Nomor antrian berhasil dipanggil.', 'success');
      loadAntrian();
    } catch (e) {
      toast(e.message, 'error');
      setLoading(btn, false, 'Panggil');
    }
  }

  async function aksiLewati(btn, idAntrian) {
    if (!confirm('Tandai nomor ini tidak hadir? Kuota akan dikembalikan.')) return;
    setLoading(btn, true);
    try {
      await Api.adminAntrianLewati(idAntrian);
      toast('Antrian ditandai tidak hadir.', 'success');
      loadAntrian();
    } catch (e) {
      toast(e.message, 'error');
      setLoading(btn, false, 'Lewati');
    }
  }

  async function aksiSelesai(btn, idAntrian) {
    setLoading(btn, true);
    try {
      await Api.adminAntrianSelesai(idAntrian);
      toast('Antrian ditandai selesai.', 'success');
      loadAntrian();
    } catch (e) {
      toast(e.message, 'error');
      setLoading(btn, false, 'Selesaikan');
    }
  }

  btnPanggilBerikutnya.addEventListener('click', async () => {
    setLoading(btnPanggilBerikutnya, true);
    try {
      const res = await Api.adminAntrianPanggil({ id_jadwal: idJadwalTerpilih });
      toast(`Nomor ${String(res.data.nomor_urut).padStart(3, '0')} berhasil dipanggil.`, 'success');
      loadAntrian();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(btnPanggilBerikutnya, false, 'Panggil Nomor Berikutnya');
    }
  });

  btnCheckin.addEventListener('click', async () => {
    const qrCode = inputCheckin.value.trim();
    if (!qrCode) { toast('Ketik/tempel kode QR dulu.', 'error'); return; }
    setLoading(btnCheckin, true);
    try {
      const res = await Api.adminAntrianCheckin({ qr_code: qrCode });
      toast(`Check-in berhasil untuk nomor ${String(res.data.nomor_urut).padStart(3, '0')}.`, 'success');
      inputCheckin.value = '';
      loadAntrian();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(btnCheckin, false, 'Check-in');
    }
  });
  inputCheckin.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); btnCheckin.click(); }
  });

  selectJadwal.addEventListener('change', () => {
    idJadwalTerpilih = selectJadwal.value || null;
    updateLinkPapanAntrian();
    if (idJadwalTerpilih) loadAntrian();
  });

  // Router hand-rolled ini tidak punya lifecycle "unmount" -- timer dicek
  // tiap tick apakah tabelnya masih ada di DOM, berhenti sendiri begitu
  // petugas pindah halaman.
  const pollTimer = setInterval(() => {
    if (!document.body.contains(tbody)) {
      clearInterval(pollTimer);
      return;
    }
    loadAntrian();
  }, INTERVAL_POLLING_MS);

  loadDaftarJadwal();
}
