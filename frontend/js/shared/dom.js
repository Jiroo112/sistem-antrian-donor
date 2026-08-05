/**
 * dom.js — helper DOM/UI generik yang identik dipakai oleh aplikasi pendonor
 * (frontend/pendonor/) dan panel internal (frontend/internal/). Isinya
 * murni manipulasi DOM, tidak tahu apa-apa soal routing atau API.
 */

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function toast(message, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  const node = el(`<div class="toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}">${escapeHtml(message)}</div>`);
  wrap.appendChild(node);
  setTimeout(() => node.remove(), 4200);
}

export function setLoading(buttonEl, loading, labelWhenIdle) {
  if (!buttonEl) return;
  buttonEl.disabled = loading;
  buttonEl.innerHTML = loading
    ? '<span class="spinner"></span> Memproses…'
    : labelWhenIdle;
}

export function renderAlertError(err) {
  let details = '';
  if (err.fieldErrors) {
    details = '<ul style="margin:6px 0 0 18px;padding:0;">' +
      Object.values(err.fieldErrors).map((m) => `<li>${escapeHtml(m)}</li>`).join('') + '</ul>';
  }
  return `<div class="alert alert-error"><div><strong>${escapeHtml(err.message)}</strong>${details}</div></div>`;
}
