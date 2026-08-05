import { app } from '../elements.js';
import { escapeHtml, toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { pageHeader } from '../ui.js';
import { requireAuth } from '../guards.js';

/* FR-2.2: Kuesioner Kesehatan Pra-Donor */
export async function viewKuesioner() {
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
