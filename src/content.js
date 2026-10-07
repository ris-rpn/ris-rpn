// Membaca public/content/*.json lalu merender seluruh bagian halaman.
// Tidak ada nama/jabatan yang ditulis langsung di HTML — semuanya dari data.
import { esc, safeUrl, assetUrl, initials, pad, $, $$ } from './utils.js';

const LEAF =
  '<svg class="leaf" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C4 10.5 10.5 4.5 20.5 3.5 19.5 13.5 13.5 20 4 20Z"/><path d="M4 20 13 11"/></svg>';
const ARROW =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

async function getJson(path) {
  const res = await fetch(import.meta.env.BASE_URL + path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

export async function loadContent() {
  const [org, dash] = await Promise.all([
    getJson('content/organisasi.json'),
    getJson('content/dashboards.json'),
  ]);
  const pimpinan = org.pimpinan ?? [];
  return {
    org,
    pimpinan,
    leads: pimpinan.filter((p) => p.tipe === 'pimpinan'),
    divisions: pimpinan.filter((p) => p.tipe === 'divisi'),
    support: pimpinan.filter((p) => p.tipe === 'pendukung'),
    dashboards: (dash.dashboard ?? []).filter((d) => d.aktif !== false),
  };
}

/* ---------- potongan markup ---------- */

function portrait(p, cls = '') {
  const src = assetUrl(p.foto);
  return `
    <figure class="portrait ${cls}" data-reveal="clip">
      <div class="portrait__media" data-parallax>
        ${src ? `<img src="${esc(src)}" alt="Foto ${esc(p.nama)}" loading="lazy" decoding="async" />` : ''}
        <div class="portrait__mono"${src ? ' hidden' : ''}>
          <span>${esc(initials(p.nama))}</span>
          <small>Foto menyusul</small>
        </div>
      </div>
    </figure>`;
}

const label = (no, text) =>
  `<p class="label"><span class="label__no">(${pad(no)})</span> ${esc(text)}</p>`;

function list(items = [], cls) {
  return `<ol class="${cls}">${items
    .map((t, i) => `<li><span>${pad(i + 1)}</span>${esc(t)}</li>`)
    .join('')}</ol>`;
}

function marqueeItems(items) {
  const one = items.map((t) => `<span class="marquee__item">${esc(t)}</span>${LEAF}`).join('');
  // Diulang dua kali agar animasi bisa berputar tanpa jeda.
  return `<div class="marquee__group">${one}</div><div class="marquee__group" aria-hidden="true">${one}</div>`;
}

/* ---------- bagian-bagian ---------- */

function renderLeads(leads, no) {
  return leads
    .map(
      (p) => `
    <section class="lead" id="${esc(p.id)}" data-theme="light" data-nav="${esc(p.singkatanJabatan)}">
      <div class="container">
        <div class="lead__top">
          ${label(no, 'Pimpinan Direktorat')}
          <p class="lead__short">${esc(p.singkatanJabatan)}</p>
        </div>
        <h2 class="lead__name" data-reveal="chars">${esc(p.nama)}</h2>
        <div class="lead__grid">
          ${portrait(p, 'lead__portrait')}
          <div class="lead__body" data-reveal="fade">
            <p class="lead__sub">Jabatan</p>
            <p class="lead__role">${esc(p.jabatan)}</p>
            <p class="lead__unit">${esc(p.unit)}</p>
          </div>
        </div>
      </div>
    </section>`
    )
    .join('');
}

function renderDivisions(divs, supportCount, no) {
  if (!divs.length) return '';
  const n = divs.length;
  // Judul dihitung dari data, mis. "2 Divisi, 1 Tata Usaha".
  const title = supportCount
    ? `${n} Divisi,<br /><em>${supportCount} Tata Usaha</em>`
    : `${n} Divisi`;
  const panels = divs
    .map(
      (p, i) => `
      <article class="panel panel--${i % 2 ? 'alt' : 'base'}" id="${esc(p.id)}" data-nav="${esc(p.singkatan || p.singkatanJabatan)}" aria-labelledby="${esc(p.id)}-title">
        <span class="panel__ghost" aria-hidden="true">${esc(p.singkatan || '')}</span>
        <div class="panel__inner container">
          <div class="panel__meta">
            <span>Divisi ${pad(i + 1)} / ${pad(n)}</span>
            <span>${esc(p.singkatanJabatan)}</span>
          </div>
          <div class="panel__content">
            <div class="panel__text">
              <h3 class="panel__unit" id="${esc(p.id)}-title">${esc(p.unit)}</h3>
              ${p.ruangLingkup?.length ? `<p class="panel__sub">Ruang lingkup</p>${list(p.ruangLingkup, 'panel__scope')}` : ''}
            </div>
            <div class="panel__person">
              ${portrait(p, 'panel__portrait')}
              <p class="panel__name">${esc(p.nama)}</p>
              <p class="panel__role">${esc(p.jabatan)} · ${esc(p.singkatanJabatan)}</p>
            </div>
          </div>
        </div>
      </article>`
    )
    .join('');

  return `
    <section class="divisi" id="divisi" data-theme="dark">
      <div class="divisi__intro container">
        ${label(no, 'Divisi')}
        <h2 class="divisi__title" data-reveal="lines">${title}</h2>
        <p class="divisi__hint" aria-hidden="true">Gulir untuk menjelajah <span>→</span></p>
      </div>
      <div class="divisi__pin">
        <div class="divisi__track">${panels}</div>
      </div>
    </section>`;
}

function renderSupport(items, no) {
  return items
    .map(
      (p) => `
    <section class="support" id="${esc(p.id)}" data-theme="light" data-nav="${esc(p.singkatan || p.singkatanJabatan)}">
      ${p.ruangLingkup?.length ? `<div class="marquee marquee--big" aria-hidden="true"><div class="marquee__track">${marqueeItems(p.ruangLingkup)}</div></div>` : ''}
      <div class="container support__grid">
        <div class="support__text">
          ${label(no, 'Pendukung Direktorat')}
          <h2 class="support__title" data-reveal="lines">${esc(p.unit)}</h2>
          ${p.deskripsi ? `<p class="support__desc" data-reveal="fade">${esc(p.deskripsi)}</p>` : ''}
          ${p.ruangLingkup?.length ? list(p.ruangLingkup, 'support__scope') : ''}
        </div>
        <div class="support__person">
          ${portrait(p, 'support__portrait')}
          <p class="support__name">${esc(p.nama)}</p>
          <p class="support__role">${esc(p.singkatanJabatan)} — ${esc(p.jabatan)}</p>
        </div>
      </div>
    </section>`
    )
    .join('');
}

// Pola lebar kartu per baris (grid 12 kolom) agar susunannya asimetris.
const ROWS = [[7, 5], [4, 4, 4], [5, 7]];
const LAST = { 1: [12], 2: [7, 5], 3: [4, 4, 4] };
export function cardSpans(count) {
  const spans = [];
  let r = 0;
  while (spans.length < count) {
    const left = count - spans.length;
    const row = ROWS[r % ROWS.length];
    spans.push(...(left < row.length ? LAST[left] : row));
    r++;
  }
  return spans;
}

function unitName(id, pimpinan) {
  if (id === 'ris') return 'Direktorat';
  const p = pimpinan.find((x) => x.id === id);
  return p ? p.singkatan || p.singkatanJabatan : id;
}

function renderDashboards(c) {
  const spans = cardSpans(c.dashboards.length);
  const grid = c.dashboards
    .map((d, i) => {
      const url = safeUrl(d.url);
      const tag = url ? 'a' : 'div';
      const attrs = url
        ? `href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-cursor="Buka"`
        : 'data-cursor="Segera"';
      return `
      <li class="card" data-span="${spans[i]}" data-unit="${esc(d.unit || '')}">
        <${tag} class="card__link${url ? '' : ' is-soon'}" ${attrs}>
          <div class="card__top">
            <span class="card__no">${pad(i + 1)}</span>
            ${d.kategori ? `<span class="card__cat">${esc(d.kategori)}</span>` : ''}
          </div>
          <h3 class="card__title">${esc(d.judul)}${url ? '<span class="sr-only"> (tab baru)</span>' : ''}</h3>
          ${d.deskripsi ? `<p class="card__desc">${esc(d.deskripsi)}</p>` : ''}
          <div class="card__foot">
            ${d.unit ? `<span class="chip">${esc(unitName(d.unit, c.pimpinan))}</span>` : ''}
            ${d.perluLogin ? '<span class="chip chip--ghost">Perlu login</span>' : ''}
            ${url ? '' : '<span class="chip chip--soon">Segera</span>'}
            <span class="card__arrow">${ARROW}</span>
          </div>
        </${tag}>
      </li>`;
    })
    .join('');

  const units = [...new Set(c.dashboards.map((d) => d.unit).filter(Boolean))];
  const filters = units.length > 1
    ? [`<button type="button" class="filter is-active" aria-pressed="true" data-filter="*">Semua <sup>${c.dashboards.length}</sup></button>`]
        .concat(
          units.map((u) => {
            const n = c.dashboards.filter((d) => d.unit === u).length;
            return `<button type="button" class="filter" aria-pressed="false" data-filter="${esc(u)}">${esc(unitName(u, c.pimpinan))} <sup>${n}</sup></button>`;
          })
        )
        .join('')
    : '';

  return { grid: grid || '<li class="dash__empty">Belum ada dashboard.</li>', filters };
}

function renderMenu(c) {
  const items = [
    { href: '#beranda', title: 'Beranda', sub: c.org.direktorat.nama },
    ...c.leads.map((p) => ({ href: `#${p.id}`, title: p.singkatanJabatan, sub: p.nama })),
    ...c.divisions.map((p) => ({ href: `#${p.id}`, title: p.singkatan || p.singkatanJabatan, sub: `${p.unit} — ${p.nama}` })),
    ...c.support.map((p) => ({ href: `#${p.id}`, title: p.singkatan || p.singkatanJabatan, sub: `${p.unit} — ${p.nama}` })),
    { href: '#dashboard', title: 'Dashboard', sub: `${c.dashboards.length} dashboard manajemen` },
  ];
  return items
    .map(
      (it, i) => `
      <li class="menu__item">
        <a href="${esc(it.href)}" class="menu__link">
          <span class="menu__no">${pad(i + 1)}</span>
          <span class="menu__title"><span>${esc(it.title)}</span></span>
          <span class="menu__sub">${esc(it.sub)}</span>
        </a>
      </li>`
    )
    .join('');
}

function contactBlock(k = {}) {
  return [
    k.alamat ? `<p>${esc(k.alamat)}</p>` : '',
    k.email ? `<p><a href="mailto:${esc(k.email)}">${esc(k.email)}</a></p>` : '',
    k.telepon ? `<p><a href="tel:${esc(k.telepon.replace(/[^\d+]/g, ''))}">${esc(k.telepon)}</a></p>` : '',
  ].join('');
}

function renderFooter(c) {
  const { org } = c;
  const web = safeUrl(org.perusahaan.website);
  const logo = assetUrl(org.perusahaan.logo);
  const tgl = org.diperbarui
    ? new Date(org.diperbarui).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const nav = [
    ['#beranda', 'Beranda'],
    ...c.pimpinan.map((p) => [`#${p.id}`, p.singkatanJabatan]),
    ['#dashboard', 'Dashboard'],
  ];
  return `
    <div class="footer__cols">
      <div>
        ${logo ? `<img class="footer__logo" src="${esc(logo)}" alt="Logo ${esc(org.perusahaan.nama)}" loading="lazy" />` : ''}
        <p class="footer__h">Direktorat</p>
        <p>${esc(org.direktorat.nama)}</p>
        <p>${web ? `<a href="${esc(web)}" target="_blank" rel="noopener noreferrer">${esc(org.perusahaan.nama)}</a>` : esc(org.perusahaan.nama)}</p>
      </div>
      <div>
        <p class="footer__h">Navigasi</p>
        <ul class="footer__nav">${nav.map(([h, t]) => `<li><a href="${esc(h)}">${esc(t)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <p class="footer__h">Kontak</p>
        ${contactBlock(org.kontak) || '<p>—</p>'}
      </div>
    </div>
    <div class="footer__bottom">
      <span>© ${new Date().getFullYear()} ${esc(org.perusahaan.nama)}</span>
      <span>Konten dikelola Tata Usaha ${esc(org.direktorat.singkatan)}${tgl ? ` · diperbarui ${esc(tgl)}` : ''}</span>
      <a href="#beranda" class="footer__top">Kembali ke atas ↑</a>
    </div>
    <div class="footer__giant" aria-hidden="true">${esc(org.direktorat.singkatan)}</div>`;
}

/* ---------- render utama ---------- */

export function render(c) {
  const { org } = c;
  const d = org.direktorat;
  const set = (slot, html) => {
    const el = $(`[data-slot="${slot}"]`);
    if (el) el.innerHTML = html;
  };
  const text = (slot, t) => $$(`[data-slot="${slot}"]`).forEach((el) => (el.textContent = t));

  document.title = `${d.nama} — ${org.perusahaan.nama}`;
  text('company-name', org.perusahaan.nama);
  text('brand-mark', d.singkatan);
  text('brand-text', `Direktorat ${d.singkatan}`);
  // Logo perusahaan (opsional). Jika kosong/gagal dimuat, header memakai lencana teks.
  const logoSrc = assetUrl(org.perusahaan.logo);
  const logoEl = $('[data-slot="logo"]');
  if (logoSrc && logoEl) {
    logoEl.src = logoSrc;
    logoEl.alt = `Logo ${org.perusahaan.nama}`;
    logoEl.hidden = false;
    $('.header__brand').classList.add('has-logo');
    logoEl.addEventListener('error', () => {
      logoEl.hidden = true;
      $('.header__brand').classList.remove('has-logo');
    });
  }

  const introCompany = $('[data-intro-company]');
  if (introCompany) introCompany.textContent = org.perusahaan.nama;

  const stats = [
    [c.divisions.length, 'Divisi'],
    [d.komoditas?.length ?? 0, 'Komoditas riset'],
    [c.dashboards.length, 'Dashboard manajemen'],
  ].filter(([n]) => n > 0);
  set(
    'stats',
    stats
      .map(([n, l]) => `<div class="stat"><span class="stat__n" data-count="${n}">${pad(n)}</span><span class="stat__l">${esc(l)}</span></div>`)
      .join('')
  );
  set('komoditas', d.komoditas?.length ? marqueeItems(d.komoditas) : '');

  // Penomoran bagian mengikuti data yang ada.
  let no = 0;
  set('pimpinan', c.leads.length ? renderLeads(c.leads, ++no) : '');
  set('divisi', c.divisions.length ? renderDivisions(c.divisions, c.support.length, ++no) : '');
  set('pendukung', c.support.length ? renderSupport(c.support, ++no) : '');
  set('dash-no', `(${pad(++no)})`);

  const dash = renderDashboards(c);
  set('dash-grid', dash.grid);
  set('dash-filters', dash.filters);

  set('menu-list', renderMenu(c));
  set(
    'menu-aside',
    `<p class="menu__h">${esc(d.nama)}</p>
     <p class="menu__muted">${esc(org.perusahaan.nama)}</p>
     <div class="menu__contact">${contactBlock(org.kontak)}</div>
     ${d.komoditas?.length ? `<p class="menu__h">Komoditas</p><p class="menu__muted">${d.komoditas.map(esc).join(' · ')}</p>` : ''}`
  );
  set('footer', renderFooter(c));

  // Foto gagal dimuat (salah nama file, dll.) -> tampilkan inisial.
  $$('.portrait img').forEach((img) =>
    img.addEventListener('error', () => {
      img.remove();
      img.parentElement?.querySelector('.portrait__mono')?.removeAttribute('hidden');
    })
  );
}

export function renderError(err) {
  console.error(err);
  const isFile = location.protocol === 'file:';
  $('#main').insertAdjacentHTML(
    'afterbegin',
    `<div class="load-error container">
      <p class="label">Konten tidak dapat dimuat</p>
      <p>${isFile
        ? 'Halaman dibuka langsung dari file. Jalankan <code>npm run dev</code> atau buka versi yang sudah di-hosting.'
        : 'Periksa file <code>public/content/organisasi.json</code> dan <code>dashboards.json</code>, lalu muat ulang.'}</p>
    </div>`
  );
}
