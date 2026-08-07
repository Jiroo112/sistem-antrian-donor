import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast } from '../../../js/shared/dom.js';
import { Auth, Api } from '../../../js/api.js';
import { fmtTanggal } from '../../../js/shared/format.js';
import { pageHeader } from '../ui.js';
import { routeHref, navigate } from '../router.js';

/* FR-3.1 / FR-3.3: Cari Jadwal Donor */
export async function viewJadwal() {
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
            <label for="f-nama-lokasi">Nama Lokasi <span class="muted">(opsional)</span></label>
            <input class="input" id="f-nama-lokasi" name="nama_lokasi" placeholder="mis. UDD PMI Jember">
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
      hasil.innerHTML = `<div class="empty">Tidak ada jadwal yang cocok. Coba ubah tanggal atau nama lokasi.</div>`;
      return;
    }
    hasil.innerHTML = '';
    list.forEach((j) => {
      const sisa = j.kuota_tersisa ?? j.sisa_kuota ?? j.kuota_total;
      const habis = Number(sisa) <= 0;
      const loggedIn = Auth.isLoggedIn('pendonor');
      const node = el(`
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
            <div style="margin-top:12px;">
              ${loggedIn
                ? `<button class="btn btn-primary btn-sm" data-ambil="${j.id_jadwal}" ${habis ? 'disabled' : ''}>Ambil Nomor Antrian</button>`
                : `<a class="btn btn-ghost btn-sm" href="${routeHref('/masuk')}" data-route="/masuk">Masuk untuk Ambil Antrian</a>`}
            </div>
          </div>
          <div class="ticket__divider"></div>
          <div class="ticket__stub">
            <div class="ticket__stub-label">Kuota total</div>
            <div class="ticket__stub-value">${j.kuota_total ?? '-'}</div>
          </div>
        </div>
      `);
      const btnAmbil = node.querySelector('[data-ambil]');
      if (btnAmbil) {
        btnAmbil.addEventListener('click', () => bukaFormKuesioner(j.id_jadwal, btnAmbil));
      }
      hasil.appendChild(node);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadJadwal({
      tanggal: document.getElementById('f-tanggal').value,
      nama_lokasi: document.getElementById('f-nama-lokasi').value,
    });
  });

  loadJadwal();
}

// FR-2.2: kuesioner kesehatan pra-donor sekarang diisi LANGSUNG di sini,
// tepat sebelum nomor antrian diambil (bukan halaman /kuesioner terpisah
// lagi) -- supaya jawabannya selalu segar, bukan isian lama yang basi.
// Ditampilkan sebagai modal (reuse .modal-backdrop/.modal yang sama dengan
// modal "dipanggil" di antrian-alert.js) di atas daftar jadwal, BUKAN
// navigasi ke halaman baru, supaya pendonor tidak kehilangan konteks jadwal
// mana yang lagi mereka pilih.
async function bukaFormKuesioner(idJadwal, btnAmbil) {
  setLoading(btnAmbil, true);

  let pertanyaan;
  try {
    const res = await Api.getKuesioner();
    pertanyaan = res.data.pertanyaan;
  } catch (err) {
    toast(err.message, 'error');
    setLoading(btnAmbil, false, 'Ambil Nomor Antrian');
    return;
  }

  const backdrop = el(`
    <div class="modal-backdrop">
      <div class="modal" style="max-width:560px;text-align:left;">
        <p class="eyebrow" style="margin-bottom:4px;">Kuesioner Kesehatan Pra-Donor</p>
        <h2 style="margin:0 0 4px;font-size:1.2rem;">Sebelum ambil nomor antrian...</h2>
        <p class="muted" style="margin:0 0 16px;">Jawab sesuai kondisimu saat ini -- ini cuma self-assessment awal, keputusan akhir kelayakan tetap di tangan petugas medis di lokasi.</p>
        <div id="kuesioner-alert"></div>
        <form id="form-kuesioner-inline">
          <div id="kuesioner-list" class="stack" style="gap:14px;max-height:48vh;overflow-y:auto;padding-right:4px;margin-bottom:4px;">
            ${pertanyaan.map((p) => `
              <div class="field" style="margin-bottom:0;">
                <label>${escapeHtml(p.teks)}</label>
                <div class="radio-group">
                  <label class="radio-pill" data-kode="${p.kode}"><input type="radio" name="q-${p.kode}" value="ya">Ya</label>
                  <label class="radio-pill" data-kode="${p.kode}"><input type="radio" name="q-${p.kode}" value="tidak">Tidak</label>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:10px;margin-top:20px;">
            <button type="button" class="btn btn-ghost" id="btn-batal-kuesioner" style="flex:1;">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-kuesioner" style="flex:2;">Ambil Nomor Antrian</button>
          </div>
        </form>
      </div>
    </div>
  `);
  document.body.appendChild(backdrop);
  setLoading(btnAmbil, false, 'Ambil Nomor Antrian');

  backdrop.querySelectorAll('.radio-pill').forEach((p) => {
    p.addEventListener('click', () => {
      const group = p.parentElement;
      group.querySelectorAll('.radio-pill').forEach((x) => x.classList.remove('is-checked'));
      p.classList.add('is-checked');
    });
  });

  function tutupModal() {
    backdrop.remove();
  }
  backdrop.querySelector('#btn-batal-kuesioner').addEventListener('click', tutupModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) tutupModal();
  });

  const alertSlot = backdrop.querySelector('#kuesioner-alert');
  backdrop.querySelector('#form-kuesioner-inline').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertSlot.innerHTML = '';

    const jawaban = {};
    for (const p of pertanyaan) {
      const dipilih = backdrop.querySelector(`input[name="q-${p.kode}"]:checked`);
      if (!dipilih) {
        alertSlot.innerHTML = `<div class="alert alert-error">Semua pertanyaan wajib dijawab.</div>`;
        return;
      }
      jawaban[p.kode] = dipilih.value;
    }

    const btnSubmit = backdrop.querySelector('#btn-submit-kuesioner');
    setLoading(btnSubmit, true);
    try {
      const res = await Api.ambilAntrian(idJadwal, jawaban);
      tutupModal();
      toast('Nomor antrian berhasil diambil!', 'success');
      // BR5: self-assessment kesehatan tidak memblokir pengambilan antrian
      // (keputusan akhir tetap di petugas medis di lokasi), tapi kalau
      // jawabannya berisiko, pendonor tetap perlu diberi tahu tegas --
      // lihat Antrian::ambil() field peringatan_kesehatan.
      if (res.data && res.data.peringatan_kesehatan) {
        tampilkanPeringatanKesehatan(res.data.peringatan_kesehatan);
      }
      navigate('/antrian');
    } catch (err) {
      alertSlot.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
      setLoading(btnSubmit, false, 'Ambil Nomor Antrian');
    }
  });
}

// BR5: modal peringatan self-assessment kesehatan -- reuse komponen
// .modal-backdrop/.modal yang sama dengan modal "dipanggil" (antrian-alert.js)
// supaya pesannya tidak sekadar lewat sebagai toast dan gampang kelewat.
function tampilkanPeringatanKesehatan(pesan) {
  const backdrop = el(`
    <div class="modal-backdrop">
      <div class="modal" style="text-align:center;">
        <p class="eyebrow" style="color:#B4232E;margin-bottom:6px;">⚠️ Perlu Diperhatikan</p>
        <p style="margin:0 0 20px;">${escapeHtml(pesan)}</p>
        <button class="btn btn-primary btn-block" id="btn-tutup-peringatan-kesehatan">Mengerti</button>
      </div>
    </div>
  `);
  document.body.appendChild(backdrop);
  backdrop.querySelector('#btn-tutup-peringatan-kesehatan').addEventListener('click', () => backdrop.remove());
}
