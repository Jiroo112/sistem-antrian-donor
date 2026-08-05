// Helper presentasi kecil yang khas tampilan pendonor (beda dari versi admin
// di frontend/internal/js/ui.js, jadi sengaja tidak digabung ke shared/dom.js).

export function pageHeader(eyebrow, title, subtitle) {
  return `
    <div class="shell" style="padding-top:40px;">
      <p class="eyebrow">${eyebrow}</p>
      <h1 style="font-size:2rem;max-width:620px;">${title}</h1>
      ${subtitle ? `<p style="max-width:620px;">${subtitle}</p>` : ''}
    </div>`;
}

export function val(id) {
  return document.getElementById(id).value.trim();
}
