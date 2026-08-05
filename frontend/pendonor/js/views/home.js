import { app } from '../elements.js';
import { routeHref } from '../router.js';

export function viewHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="shell grid-2" style="align-items:center;">
        <div>
          <p class="eyebrow">Sistem Antrian Online Donor Darah</p>
          <h1 style="font-size:2.6rem;line-height:1.05;margin-bottom:16px;">Ambil nomor antrian donor darah dari mana saja.</h1>
          <p style="font-size:1.05rem;max-width:480px;">Cari jadwal dan lokasi donor terdekat, isi kuesioner kesehatan pra-donor, lalu pantau posisi antrianmu secara langsung — tanpa perlu mengantre fisik dari awal.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;">
            <a href="${routeHref('/jadwal')}" data-route="/jadwal" class="btn btn-primary">Cari Jadwal Donor</a>
            <a href="${routeHref('/daftar')}" data-route="/daftar" class="btn btn-ghost">Daftar Sebagai Pendonor</a>
          </div>
        </div>
        <div class="ticket">
          <div class="ticket__main">
            <p class="ticket__eyebrow">Contoh e-ticket</p>
            <h3 class="ticket__title">UDD PMI Kota — Sesi Pagi</h3>
            <div class="ticket__meta">
              <span>📅 Sabtu, 08 Agustus 2026</span>
              <span>⏰ 08.00 – 10.00</span>
            </div>
            <div class="ticket__meta">
              <span class="badge badge--aktif"><i class="badge-dot"></i>Kuota tersedia</span>
            </div>
          </div>
          <div class="ticket__divider"></div>
          <div class="ticket__stub">
            <div class="ticket__stub-label">Nomor Antrian</div>
            <div class="ticket__stub-value">A-014</div>
          </div>
        </div>
      </div>
    </section>

    <section class="shell" style="padding:20px 24px 60px;">
      <div class="grid-2">
        <div class="card">
          <p class="eyebrow">Alur singkat</p>
          <h2 style="font-size:1.3rem;">Bagaimana cara kerjanya</h2>
          <div class="stack" style="margin-top:14px;">
            ${[
              ['1', 'Daftar / masuk', 'Buat akun dengan NIK, verifikasi OTP lewat email.'],
              ['2', 'Cari jadwal & lokasi', 'Pilih lokasi UDD tetap atau unit donor bergerak terdekat.'],
              ['3', 'Isi kuesioner kesehatan', 'Self-assessment singkat sebelum mengambil nomor antrian.'],
              ['4', 'Pantau antrian real-time', 'Lihat posisi antrianmu dan dapat notifikasi saat giliran mendekati.'],
            ].map(([n, t, d]) => `
              <div style="display:flex;gap:14px;">
                <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:var(--crimson-tint);color:var(--crimson-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-family:var(--font-mono);font-size:.85rem;">${n}</div>
                <div><strong>${t}</strong><p style="margin:2px 0 0;">${d}</p></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card" style="background:var(--ink);color:#fff;">
          <p class="eyebrow" style="color:#E9B9BE;">Perlu diketahui</p>
          <h2 style="font-size:1.3rem;color:#fff;">Aturan dasar donor darah</h2>
          <ul style="padding-left:18px;color:#EDE6E1;font-size:.9rem;line-height:1.8;">
            <li>Usia pendonor 17–65 tahun saat pendaftaran.</li>
            <li>Jarak minimal antar donor adalah 3 bulan (12 minggu).</li>
            <li>Satu akun hanya bisa punya satu nomor antrian aktif.</li>
            <li>Keputusan akhir kelayakan tetap di tangan petugas medis di lokasi.</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}
