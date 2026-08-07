import { app } from '../elements.js';
import { routeHref } from '../router.js';

// Halaman Beranda -- awalnya jadi tempat uji coba design system di
// frontend/DESIGN.md (bahasa desain ala Airbnb), sekarang sudah jadi
// fondasi resmi seluruh aplikasi lewat frontend/css/style.css (berlaku
// otomatis di semua halaman & role). Kelas `.home-abnb`, `.card-abnb`, dst
// di bawah ini konten KHUSUS halaman ini saja (hero, carousel foto,
// timeline langkah) -- bukan override navbar lagi, karena navbar sudah
// ikut palet baru secara global.
export function viewHome() {
  app.innerHTML = `
    <style>
      /* ---- Konten halaman ---- */
      .home-abnb{ color:#222222; font-family:'Inter',system-ui,-apple-system,sans-serif; }
      .home-abnb .hero-band{ padding:64px 0 48px; }
      .home-abnb .eyebrow-abnb{ display:inline-flex; align-items:center; gap:8px; background:#ffffff; border:1px solid #dddddd; border-radius:9999px; padding:6px 14px 6px 10px; font-size:13px; font-weight:600; color:#222222; margin-bottom:20px; box-shadow:rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.04) 0 2px 6px 0; }
      .home-abnb .eyebrow-abnb .dot{ width:7px; height:7px; border-radius:50%; background:#ff385c; flex-shrink:0; }
      .home-abnb h1{ font-size:2.75rem; font-weight:700; line-height:1.12; letter-spacing:-.02em; color:#222222; margin:0 0 18px; }
      .home-abnb .lead{ font-size:1.05rem; line-height:1.55; color:#3f3f3f; max-width:460px; margin:0 0 26px; }
      .home-abnb .cta-row{ display:flex; gap:12px; flex-wrap:wrap; margin-bottom:28px; }
      .home-abnb .btn-abnb{ display:inline-flex; align-items:center; justify-content:center; height:48px; padding:0 26px; border-radius:8px; font-size:16px; font-weight:600; text-decoration:none; border:1px solid transparent; cursor:pointer; transition:background-color .15s,border-color .15s; }
      .home-abnb .btn-abnb--primary{ background:#ff385c; color:#fff; }
      .home-abnb .btn-abnb--primary:hover{ background:#e00b41; }
      .home-abnb .btn-abnb--secondary{ background:#fff; color:#222222; border-color:#222222; }
      .home-abnb .btn-abnb--secondary:hover{ background:#f7f7f7; }
      .home-abnb .trust-row{ display:flex; gap:22px; flex-wrap:wrap; }
      .home-abnb .trust-item{ display:flex; align-items:center; gap:8px; font-size:14px; color:#3f3f3f; }
      .home-abnb .trust-item .ic{ width:26px; height:26px; border-radius:50%; background:#f7f7f7; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }

      /* ---- Kartu foto (pengganti contoh e-ticket) -- carousel foto-first
         gaya property-card Airbnb: badge melayang, auto-geser + bisa
         digeser manual (drag mouse/touch), titik indikator + panah ---- */
      .home-abnb .photo-card{ position:relative; }
      .home-abnb .photo-badge{ position:absolute; top:14px; left:14px; z-index:3; display:inline-flex; align-items:center; gap:6px; background:#fff; color:#222222; font-size:11px; font-weight:600; border-radius:9999px; padding:6px 12px 6px 8px; box-shadow:rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.04) 0 2px 6px 0, rgba(0,0,0,.1) 0 4px 8px 0; cursor:default; transition:background-color .15s,transform .15s,box-shadow .15s; }
      .home-abnb .photo-badge:hover{ background:#ff385c; color:#fff; transform:translateY(-2px); box-shadow:rgba(0,0,0,.04) 0 0 0 1px, rgba(0,0,0,.08) 0 4px 10px 0, rgba(0,0,0,.14) 0 8px 16px 0; }
      .home-abnb .carousel{ position:relative; height:460px; border-radius:16px; overflow:hidden; touch-action:pan-y; cursor:grab; }
      .home-abnb .carousel:active{ cursor:grabbing; }
      .home-abnb .carousel__track{ display:flex; height:100%; transition:transform .4s cubic-bezier(.22,.61,.36,1); will-change:transform; }
      .home-abnb .carousel__slide{ flex:0 0 100%; height:100%; background-size:cover; background-position:center; pointer-events:none; user-select:none; -webkit-user-drag:none; }
      .home-abnb .carousel__dots{ position:absolute; bottom:14px; left:0; right:0; display:flex; justify-content:center; gap:6px; z-index:3; }
      .home-abnb .carousel__dots .dot{ width:6px; height:6px; padding:0; border:none; border-radius:9999px; background:rgba(255,255,255,.6); cursor:pointer; transition:background-color .2s,width .2s; }
      .home-abnb .carousel__dots .dot.is-active{ background:#fff; width:18px; }
      @media (max-width:840px){ .home-abnb .carousel{ height:320px; } }

      .home-abnb .section-abnb{ padding:48px 24px 72px; }
      .home-abnb .card-head{ margin-bottom:22px; }
      .home-abnb .card-head .eyebrow-abnb{ margin-bottom:10px; }
      .home-abnb h2{ font-size:1.35rem; font-weight:700; letter-spacing:-.01em; color:#222222; margin:0; }
      .home-abnb .card-abnb{ background:#fff; border:1px solid #dddddd; border-radius:16px; padding:28px; }
      .home-abnb .card-abnb--soft{ background:#f7f7f7; border-color:#f7f7f7; }

      .home-abnb .step-abnb{ display:flex; gap:16px; position:relative; padding-bottom:26px; }
      .home-abnb .step-abnb:last-child{ padding-bottom:0; }
      .home-abnb .step-abnb::before{ content:''; position:absolute; left:17px; top:36px; bottom:2px; width:1px; background:#ebebeb; }
      .home-abnb .step-abnb:last-child::before{ display:none; }
      .home-abnb .step-num-abnb{ position:relative; z-index:1; flex-shrink:0; width:36px; height:36px; border-radius:9999px; background:#ffd1da; color:#e00b41; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; }
      .home-abnb .step-abnb strong{ display:block; font-size:16px; font-weight:600; color:#222222; margin-bottom:2px; }
      .home-abnb .step-abnb p{ margin:0; font-size:14px; color:#6a6a6a; line-height:1.5; }

      .home-abnb ul.rules-abnb{ list-style:none; padding:0; margin:0; }
      .home-abnb ul.rules-abnb li{ display:flex; gap:12px; align-items:flex-start; padding:14px 0; border-top:1px solid #e2e2e2; font-size:15px; color:#3f3f3f; line-height:1.5; }
      .home-abnb ul.rules-abnb li:first-child{ border-top:none; padding-top:0; }
      .home-abnb ul.rules-abnb .check{ flex-shrink:0; width:22px; height:22px; border-radius:50%; background:#222222; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; margin-top:1px; }

      @media (max-width:840px){ .home-abnb h1{ font-size:2.1rem; } }
    </style>

    <div class="home-abnb">
      <section class="hero-band">
        <div class="shell grid-2" style="align-items:center;">
          <div>
            <span class="eyebrow-abnb"><i class="dot"></i>Sistem Antrian Online Donor Darah</span>
            <h1>Ambil nomor antrian donor darah dari mana saja.</h1>
            <p class="lead">Cari jadwal dan lokasi donor terdekat, isi kuesioner kesehatan pra-donor, lalu pantau posisi antrianmu secara langsung — tanpa perlu mengantre fisik dari awal.</p>
            <div class="cta-row">
              <a href="${routeHref('/jadwal')}" data-route="/jadwal" class="btn-abnb btn-abnb--primary">Cari Jadwal Donor</a>
              <a href="${routeHref('/daftar')}" data-route="/daftar" class="btn-abnb btn-abnb--secondary">Daftar Sebagai Pendonor</a>
            </div>
            <div class="trust-row">
              <div class="trust-item"><span class="ic">⚡</span>Tanpa antre fisik</div>
              <div class="trust-item"><span class="ic">🔄</span>Posisi real-time</div>
              <div class="trust-item"><span class="ic">🩸</span>Sertifikat digital</div>
            </div>
          </div>

          <div class="photo-card">
            <div class="carousel" id="home-carousel">
              <div class="carousel__track" id="home-carousel-track">
                <div class="carousel__slide" style="background-image:url('${routeHref('/frontend/pendonor/assets/img/donor-1.jpg')}');"></div>
                <div class="carousel__slide" style="background-image:url('${routeHref('/frontend/pendonor/assets/img/donor-2.jpg')}');"></div>
                <div class="carousel__slide" style="background-image:url('${routeHref('/frontend/pendonor/assets/img/donor-3.jpg')}');"></div>
              </div>
              <div class="carousel__dots" id="home-carousel-dots">
                <button type="button" class="dot is-active" data-i="0" aria-label="Foto 1"></button>
                <button type="button" class="dot" data-i="1" aria-label="Foto 2"></button>
                <button type="button" class="dot" data-i="2" aria-label="Foto 3"></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-abnb">
        <div class="shell grid-2">
          <div class="card-abnb">
            <div class="card-head">
              <span class="eyebrow-abnb"><i class="dot"></i>Alur singkat</span>
              <h2>Bagaimana cara kerjanya</h2>
            </div>
            ${[
              ['1', 'Daftar / masuk', 'Buat akun dengan NIK, verifikasi OTP lewat email.'],
              ['2', 'Cari jadwal & lokasi', 'Pilih lokasi UDD tetap atau unit donor bergerak terdekat.'],
              ['3', 'Isi kuesioner kesehatan', 'Self-assessment singkat sebelum mengambil nomor antrian.'],
              ['4', 'Pantau antrian real-time', 'Lihat posisi antrianmu dan dapat notifikasi saat giliran mendekati.'],
            ].map(([n, t, d]) => `
              <div class="step-abnb">
                <div class="step-num-abnb">${n}</div>
                <div><strong>${t}</strong><p>${d}</p></div>
              </div>`).join('')}
          </div>

          <div class="card-abnb card-abnb--soft">
            <div class="card-head">
              <span class="eyebrow-abnb"><i class="dot"></i>Perlu diketahui</span>
              <h2>Aturan dasar donor darah</h2>
            </div>
            <ul class="rules-abnb">
              <li><span class="check">✓</span>Usia pendonor 17–65 tahun saat pendaftaran.</li>
              <li><span class="check">✓</span>Jarak minimal antar donor adalah 3 bulan (12 minggu).</li>
              <li><span class="check">✓</span>Satu akun hanya bisa punya satu nomor antrian aktif.</li>
              <li><span class="check">✓</span>Keputusan akhir kelayakan tetap di tangan petugas medis di lokasi.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  `;

  initCarousel();
}

// Carousel foto hero -- auto-geser tiap 4 detik, bisa juga digeser manual
// lewat drag mouse/touch (Pointer Events, jadi satu kode buat keduanya),
// plus titik indikator (tanpa tombol panah). Router hand-rolled ini tidak punya
// lifecycle "unmount" (sama seperti pola polling di views/antrian.js), jadi
// timer auto-geser dicek tiap tick apakah elemennya masih ada di DOM --
// begitu pendonor pindah halaman, timer berhenti sendiri.
function initCarousel() {
  const root = document.getElementById('home-carousel');
  if (!root) return;

  const track = document.getElementById('home-carousel-track');
  const dots = Array.from(document.querySelectorAll('#home-carousel-dots .dot'));
  const jumlahSlide = dots.length;
  let idx = 0;
  let startX = 0;
  let geserX = 0;
  let sedangDrag = false;

  function goTo(i) {
    idx = (i + jumlahSlide) % jumlahSlide;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle('is-active', di === idx));
  }

  let timer = setInterval(tick, 4000);
  function tick() {
    if (!document.body.contains(root)) {
      clearInterval(timer);
      return;
    }
    goTo(idx + 1);
  }
  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(tick, 4000);
  }

  dots.forEach((d, di) => d.addEventListener('click', () => { goTo(di); resetTimer(); }));

  root.addEventListener('pointerdown', (e) => {
    sedangDrag = true;
    startX = e.clientX;
    track.style.transition = 'none';
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove', (e) => {
    if (!sedangDrag) return;
    geserX = e.clientX - startX;
    track.style.transform = `translateX(calc(-${idx * 100}% + ${geserX}px))`;
  });
  function selesaiDrag() {
    if (!sedangDrag) return;
    sedangDrag = false;
    track.style.transition = '';
    const AMBANG_GESER_PX = 60;
    if (geserX < -AMBANG_GESER_PX) goTo(idx + 1);
    else if (geserX > AMBANG_GESER_PX) goTo(idx - 1);
    else goTo(idx);
    geserX = 0;
    resetTimer();
  }
  root.addEventListener('pointerup', selesaiDrag);
  root.addEventListener('pointercancel', selesaiDrag);
}
