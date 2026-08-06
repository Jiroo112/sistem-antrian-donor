<?php
// Sertifikat Donor Digital (FR-8.2). View ini dirender lewat Dompdf
// (Riwayat::sertifikat()), BUKAN dilayani langsung sebagai halaman web --
// makanya CSS-nya sengaja disederhanakan (tanpa flexbox/grid/aspect-ratio/
// clamp/vw/mix-blend-mode/CSS variables/<svg> inline -- semuanya tidak
// konsisten didukung Dompdf). Font custom (Jost, Cormorant Garamond, Alex
// Brush) didaftarkan manual lewat Dompdf::getFontMetrics()->registerFont()
// di Riwayat::sertifikat(), bukan lewat @font-face, supaya tidak bergantung
// isRemoteEnabled.
//
// Ukuran .cert sengaja ditulis eksplisit dalam pt (halaman A4 landscape di
// controller = 841.89 x 595.28pt via $dompdf->setPaper()). height:100%/
// vertical-align:middle/transform:translateY(%) semuanya sudah dicoba dan
// tidak dihormati Dompdf untuk menengahkan konten.
//
// PENTING: jarak tepi ke halaman ditaruh sebagai padding di <body>, BUKAN
// margin di .cert. Sudah diuji empiris: kalau .cert (posisi:relative +
// border-radius + box-shadow) diberi margin sendiri, Dompdf memicu halaman
// ke-2 kosong begitu (margin + tinggi .cert) melewati ~524pt dari tinggi
// halaman 595.28pt -- padahal elemen yang sama dengan margin:0 dan tinggi
// hampir 590pt (nyaris penuh 1 halaman) render sempurna di 1 halaman. Jadi
// bug-nya spesifik ke margin pada elemen itu sendiri, bukan soal total
// tinggi konten. Solusinya: padding di body (elemen biasa, tidak kena bug
// ini) untuk jarak tepi, .cert sendiri margin:0 dan tingginya dihitung
// mepet ke tinggi halaman minus padding minus buffer aman kecil.
$PAGE_W = 841.89;
$PAGE_H = 595.28;
$PAD = 8;
$BUFFER = 8;
$CERT_W = $PAGE_W - (2 * $PAD);
$CERT_H = $PAGE_H - (2 * $PAD) - $BUFFER;

function svg_to_data_uri($svg)
{
    return 'data:image/svg+xml;base64,' . base64_encode($svg);
}

// Ledakan pita emas-krimson di sudut kanan-atas & kiri-bawah. Gradient SVG
// asli dari template referensi disederhanakan jadi warna solid berlapis
// (bukan linearGradient) supaya tidak bergantung dukungan gradient di
// php-svg-lib. Varian cermin (kiri-bawah) dibuat dari SVG yang SAMA lewat
// <g transform="rotate(180 ...)"> internal SVG -- BUKAN CSS transform pada
// elemen HTML, yang dukungannya terbatas di Dompdf.
function pita_svg($mirror)
{
    $isi = '<path d="M60,0 C220,10 260,90 340,120 C420,150 460,110 480,60 L480,0 Z" fill="#4a0d14"/>'
        . '<path d="M120,0 C260,30 300,120 400,150 C450,165 470,140 480,120 L480,0 Z" fill="#c8a24a"/>'
        . '<path d="M170,0 C300,40 330,140 440,175 C465,183 478,170 480,155 L480,0 Z" fill="#c22733"/>'
        . '<path d="M230,0 C330,45 350,150 460,195 L480,200 L480,0 Z" fill="#e6cd8a" opacity="0.85"/>'
        . '<path d="M0,0 C40,60 30,140 90,190 C150,240 240,210 300,260 C360,310 340,380 400,420" fill="none" stroke="#c8a24a" stroke-width="4" opacity="0.6"/>';
    if ($mirror) {
        $isi = '<g transform="rotate(180 240 210)">' . $isi . '</g>';
    }
    return svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="420" viewBox="0 0 480 420">' . $isi . '</svg>');
}
$pita_kanan_atas = pita_svg(false);
$pita_kiri_bawah = pita_svg(true);

// Ornamen garis sudut (lingkaran + lekukan emas). Varian cermin
// (kanan-bawah) juga lewat transform SVG internal, bukan CSS.
function ornamen_sudut_svg($mirror)
{
    $isi = '<path d="M2,30 L2,2 L30,2" fill="none" stroke="#c8a24a" stroke-width="1.6"/>'
        . '<path d="M2,10 Q2,2 10,2" fill="none" stroke="#c8a24a" stroke-width="1.6"/>'
        . '<circle cx="15" cy="15" r="6" fill="none" stroke="#c8a24a" stroke-width="1.6"/>'
        . '<path d="M15,9 Q22,15 15,21" fill="none" stroke="#c8a24a" stroke-width="1.4"/>'
        . '<circle cx="15" cy="45" r="6" fill="none" stroke="#c8a24a" stroke-width="1.6"/>'
        . '<path d="M9,45 Q15,38 21,45" fill="none" stroke="#c8a24a" stroke-width="1.4"/>';
    if ($mirror) {
        $isi = '<g transform="rotate(180 50 50)">' . $isi . '</g>';
    }
    return svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' . $isi . '</svg>');
}
$sudut_kiri_atas = ornamen_sudut_svg(false);
$sudut_kanan_bawah = ornamen_sudut_svg(true);

// Titik-titik dekoratif emas di dekat pita.
$titik_kanan_atas_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30">'
    . '<g fill="#c8a24a">'
    . '<circle cx="4" cy="4" r="2"/><circle cx="14" cy="4" r="2"/><circle cx="24" cy="4" r="2"/><circle cx="34" cy="4" r="2"/><circle cx="44" cy="4" r="2"/><circle cx="54" cy="4" r="2"/>'
    . '<circle cx="4" cy="14" r="2"/><circle cx="14" cy="14" r="2"/><circle cx="24" cy="14" r="2"/><circle cx="34" cy="14" r="2"/>'
    . '<circle cx="4" cy="24" r="2"/><circle cx="14" cy="24" r="2"/>'
    . '</g></svg>';
$titik_kiri_bawah_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30">'
    . '<g fill="#c8a24a">'
    . '<circle cx="4" cy="24" r="2"/><circle cx="14" cy="24" r="2"/><circle cx="24" cy="24" r="2"/><circle cx="34" cy="24" r="2"/><circle cx="44" cy="24" r="2"/><circle cx="54" cy="24" r="2"/>'
    . '<circle cx="4" cy="14" r="2"/><circle cx="14" cy="14" r="2"/><circle cx="24" cy="14" r="2"/><circle cx="34" cy="14" r="2"/>'
    . '<circle cx="4" cy="4" r="2"/><circle cx="14" cy="4" r="2"/>'
    . '</g></svg>';
$titik_kanan_atas = svg_to_data_uri($titik_kanan_atas_svg);
$titik_kiri_bawah = svg_to_data_uri($titik_kiri_bawah_svg);

// Garis lekuk hiasan di bawah judul.
$lengkung_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="30" viewBox="0 0 300 30">'
    . '<path d="M0,15 C60,-5 90,35 150,15 C210,-5 240,35 300,15" fill="none" stroke="#c8a24a" stroke-width="1.6"/>'
    . '</svg>';
$lengkung = svg_to_data_uri($lengkung_svg);
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 0; }
    html, body {
        margin: 0;
    }
    body {
        padding: <?= $PAD ?>pt;
        font-family: 'Jost', 'DejaVu Sans', sans-serif;
        background: linear-gradient(135deg, #efe8d6 0%, #d9cfb4 100%);
    }
    .cert {
        position: relative;
        margin: 0;
        width: <?= $CERT_W ?>pt;
        height: <?= $CERT_H ?>pt;
        background: linear-gradient(135deg, #f6efe0 0%, #efe6d2 55%, #eadfc4 100%);
        border: 2px solid #c8a24a;
        border-radius: 6px;
        box-shadow: 0 10px 24px rgba(60, 20, 10, 0.25);
        overflow: hidden;
    }

    /* Posisi/ukuran ditulis dalam pt tetap (bukan %) -- persen pada gambar
       absolut terbukti dihitung Dompdf jadi berukuran raksasa (memicu
       halaman ke-2), padahal komputasinya dari <?= $CERT_W ?>pt x <?= $CERT_H ?>pt sudah benar
       secara manual di sini. */
    .ornamen { position: absolute; }
    .pita-ka { top: -11pt; right: -25pt; width: 378pt; }
    .pita-kb { bottom: -11pt; left: -25pt; width: 378pt; }
    .sudut-ka { top: 29pt; left: 41pt; width: 90pt; }
    .sudut-kb { bottom: 29pt; right: 41pt; width: 90pt; }
    .titik-ka { top: 20pt; right: 115pt; width: 74pt; }
    .titik-kb { bottom: 20pt; left: 41pt; width: 74pt; }

    .content {
        position: relative;
        text-align: center;
        padding: 64pt 100pt 40pt;
    }

    .judul-instansi {
        font-family: 'Jost', 'DejaVu Sans', sans-serif;
        font-weight: 500;
        font-size: 12px;
        letter-spacing: 3px;
        color: #9c7b2e;
        text-transform: uppercase;
        margin-bottom: 18px;
    }
    .judul {
        font-family: 'Cormorant Garamond', 'DejaVu Serif', serif;
        font-weight: bold;
        font-size: 62px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #7c1420;
        margin: 0;
    }
    .subjudul {
        font-family: 'Jost', 'DejaVu Sans', sans-serif;
        font-weight: 400;
        font-size: 23px;
        letter-spacing: 7px;
        text-transform: uppercase;
        color: #c22733;
        margin-top: 6px;
    }
    .lengkung-hias { width: 280px; margin: 18px auto 0; opacity: 0.9; }

    .pengantar {
        margin-top: 36px;
        font-size: 15px;
        letter-spacing: 0.5px;
        color: #8a5a10;
    }
    .nama-penerima {
        font-family: 'Alex Brush', 'DejaVu Serif', cursive, serif;
        font-size: 72px;
        color: #4a0d14;
        line-height: 1.1;
        margin: 8px 0 0;
    }
    .pembatas {
        width: 55%;
        height: 1px;
        background: linear-gradient(90deg, transparent, #9c7b2e 20%, #9c7b2e 80%, transparent);
        margin: 22px auto 26px;
    }
    .deskripsi {
        font-size: 14px;
        line-height: 1.75;
        color: #7c3b28;
        width: 540pt;
        margin: 0 auto;
    }

    .nomor { font-size: 10px; color: #a08a6a; letter-spacing: 1px; margin-top: 30px; }
    .footer-catatan { font-size: 9.5px; color: #b6a488; margin-top: 4px; }

    .ttd {
        position: absolute;
        bottom: 30pt;
        right: 80pt;
        width: 190px;
        text-align: center;
    }
    .ttd-garis { border-top: 1px solid #9c7b2e; margin: 0 8px 6px; }
    .ttd-label { font-size: 10.5px; color: #8a5a10; letter-spacing: 0.5px; }
</style>
</head>
<body>
    <div class="cert">
        <img class="ornamen pita-ka" src="<?= $pita_kanan_atas ?>" alt="">
        <img class="ornamen pita-kb" src="<?= $pita_kiri_bawah ?>" alt="">
        <img class="ornamen sudut-ka" src="<?= $sudut_kiri_atas ?>" alt="">
        <img class="ornamen sudut-kb" src="<?= $sudut_kanan_bawah ?>" alt="">
        <img class="ornamen titik-ka" src="<?= $titik_kanan_atas ?>" alt="">
        <img class="ornamen titik-kb" src="<?= $titik_kiri_bawah ?>" alt="">

        <div class="content">
            <div class="judul-instansi">Palang Merah Indonesia &middot; Unit Donor Darah</div>
            <div class="judul">Sertifikat</div>
            <div class="subjudul">Donor Darah</div>
            <img class="lengkung-hias" src="<?= $lengkung ?>" alt="">

            <div class="pengantar">Diberikan kepada</div>
            <div class="nama-penerima"><?= htmlspecialchars($nama) ?></div>

            <div class="pembatas"></div>

            <div class="deskripsi">
                atas partisipasi dan kepeduliannya menyumbangkan darah secara sukarela
                melalui Sistem Antrian Online Donor Darah PMI/UDD. Setetes darah Anda
                adalah harapan baru bagi sesama yang membutuhkan.
            </div>

            <div class="nomor">Nomor Sertifikat: <?= htmlspecialchars($nomor_sertifikat) ?></div>
            <div class="footer-catatan">Sertifikat ini diterbitkan otomatis oleh sistem dan sah tanpa tanda tangan basah.</div>
        </div>

    </div>
</body>
</html>
