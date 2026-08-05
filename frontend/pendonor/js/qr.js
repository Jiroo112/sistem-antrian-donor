// FR-4.2: render QR code asli (bukan cuma teks kode) ke dalam elemen dengan id
// tertentu, dipakai buat e-ticket antrian supaya bisa dipindai petugas loket
// beneran -- tidak ada dependensi/panggilan ke layanan luar.
//
// qrcode.js (frontend/js/qrcode.js) adalah kode pihak ketiga yang di-vendor
// apa adanya (UMD, bukan ES module) dan dimuat lewat <script> klasik SEBELUM
// modul ini (lihat index.html), sehingga library-nya dibaca lewat global
// `window.qrcode`, bukan `import` biasa.
export function renderQrCode(elId, text) {
  const slot = document.getElementById(elId);
  const qrcodeLib = window.qrcode;
  if (!slot || typeof qrcodeLib === 'undefined' || !text) return;
  try {
    const qr = qrcodeLib(0, 'M'); // typeNumber 0 = auto-detect ukuran sesuai panjang data
    qr.addData(text);
    qr.make();
    slot.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  } catch (e) {
    slot.innerHTML = '';
  }
}
