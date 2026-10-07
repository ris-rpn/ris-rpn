export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape teks dari JSON sebelum dimasukkan ke HTML. */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Hanya izinkan link http(s), anchor, atau path relatif. */
export function safeUrl(url) {
  const u = String(url ?? '').trim();
  if (!u || u === '#') return '';
  if (/^https?:\/\//i.test(u)) return u;
  return '';
}

/** Path relatif di folder public (mis. "img/pimpinan/sevp.webp"). */
export function assetUrl(path) {
  const p = String(path ?? '').trim();
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  if (/^[a-z]+:/i.test(p)) return '';
  return import.meta.env.BASE_URL + p.replace(/^\.?\//, '');
}

/** "Dr. Riza Arief Putranto, D.E.A" -> "RP" (gelar diabaikan). */
export function initials(nama) {
  const core = String(nama ?? '').split(',')[0];
  const words = core
    .split(/\s+/)
    .filter((w) => w && !w.includes('.') && /^[\p{L}]/u.test(w));
  if (!words.length) return '·';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export const pad = (n) => String(n).padStart(2, '0');

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
