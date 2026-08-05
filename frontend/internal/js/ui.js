// Versi panel internal punya tipografi lebih ringkas dari versi pendonor
// (frontend/pendonor/js/ui.js), jadi sengaja tidak digabung ke shared/dom.js.
export function pageHeader(eyebrow, title, subtitle) {
  return `
    <div class="shell" style="padding-top:36px;">
      <p class="eyebrow">${eyebrow}</p>
      <h1 style="font-size:1.7rem;max-width:640px;">${title}</h1>
      ${subtitle ? `<p style="max-width:620px;">${subtitle}</p>` : ''}
    </div>`;
}
