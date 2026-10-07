// Interaksi: menu overlay, indikator progres, link anchor, filter dashboard,
// kursor kustom, dan efek spotlight kartu.
import { gsap } from 'gsap';
import { lenis, scrollToHash, scrollPosition, ScrollTrigger } from './animations.js';
import { cardSpans } from './content.js';
import { reducedMotion, finePointer, esc, $, $$ } from './utils.js';

/* ---------- menu overlay ---------- */

const menu = { open: false, tl: null, lastFocus: null };

function openMenu() {
  const el = $('#menu');
  const btn = $('.header__menu');
  menu.open = true;
  menu.lastFocus = document.activeElement;
  el.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  $('.header__menu-label').textContent = 'Tutup';
  document.body.classList.add('menu-open');
  $('#main').inert = true;
  lenis?.stop();
  menu.tl?.kill();
  menu.tl = gsap
    .timeline()
    .fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: reducedMotion ? 0 : 0.9, ease: 'expo.inOut' })
    .from($$('.menu__title > span', el), { yPercent: 110, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, '-=0.35')
    .from($$('.menu__no, .menu__sub, .menu__aside > *', el), { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.02 }, '<0.15');
  $('.menu__link', el)?.focus({ preventScroll: true });
}

function closeMenu() {
  if (!menu.open) return Promise.resolve();
  const el = $('#menu');
  menu.open = false;
  $('.header__menu').setAttribute('aria-expanded', 'false');
  $('.header__menu-label').textContent = 'Menu';
  document.body.classList.remove('menu-open');
  $('#main').inert = false;
  lenis?.start();
  menu.tl?.kill();
  return new Promise((resolve) => {
    gsap.to(el, {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: reducedMotion ? 0 : 0.7,
      ease: 'expo.inOut',
      onComplete: () => {
        el.hidden = true;
        resolve();
      },
    });
  });
}

function initMenu() {
  $('.header__menu').addEventListener('click', () => (menu.open ? closeMenu().then(() => menu.lastFocus?.focus()) : openMenu()));
  document.addEventListener('keydown', (e) => {
    if (!menu.open) return;
    if (e.key === 'Escape') closeMenu().then(() => $('.header__menu').focus());
    // Jaga fokus tetap di dalam menu (dan tombol tutup).
    if (e.key === 'Tab') {
      const focusables = [$('.header__menu'), ...$$('#menu a')];
      const i = focusables.indexOf(document.activeElement);
      const next = e.shiftKey ? i - 1 : i + 1;
      if (i === -1 || next < 0 || next >= focusables.length) {
        e.preventDefault();
        focusables[e.shiftKey ? focusables.length - 1 : 0].focus();
      }
    }
  });
}

/* ---------- link anchor (#dori, #dashboard, ...) ---------- */

function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const hash = a.getAttribute('href');
    if (!document.getElementById(hash.slice(1))) return;
    e.preventDefault();
    if (menu.open) closeMenu().then(() => scrollToHash(hash));
    else scrollToHash(hash);
  });
}

/* ---------- indikator progres ---------- */

function initProgress() {
  const list = $('[data-slot="progress"]');
  const targets = $$('[data-nav]');
  list.innerHTML = targets
    .map(
      (t) =>
        `<li><a href="#${esc(t.id)}"><span class="progress__label">${esc(t.dataset.nav)}</span><span class="progress__dot" aria-hidden="true"></span></a></li>`
    )
    .join('');
  const links = $$('a', list);
  let positions = [];
  const measure = () => (positions = targets.map((t) => scrollPosition(t)));
  let current = -1;
  const update = () => {
    const y = window.scrollY + window.innerHeight * 0.45;
    let idx = 0;
    positions.forEach((p, i) => {
      if (y >= p) idx = i;
    });
    if (idx === current) return;
    current = idx;
    links.forEach((l, i) => {
      l.classList.toggle('is-active', i === idx);
      if (i === idx) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
  };
  ScrollTrigger.addEventListener('refresh', () => {
    measure();
    update();
  });
  measure();
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- filter dashboard ---------- */

function applySpans(cards) {
  const spans = cardSpans(cards.length);
  cards.forEach((c, i) => (c.dataset.span = spans[i]));
}

function initFilters() {
  const grid = $('.dash__grid');
  const buttons = $$('.filter');
  const cards = $$('.card');
  let reveal = null;
  let tl = null;

  if (!reducedMotion) {
    reveal = gsap.from(cards, {
      y: 60,
      autoAlpha: 0,
      duration: 1,
      stagger: 0.07,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.dash__grid', start: 'top 85%', once: true },
    });
  }

  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      const f = btn.dataset.filter;
      buttons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      const shown = cards.filter((c) => f === '*' || c.dataset.unit === f);
      const apply = () => {
        cards.forEach((c) => (c.hidden = !shown.includes(c)));
        applySpans(shown);
        ScrollTrigger.refresh();
      };

      // Selesaikan animasi masuk awal agar tidak bentrok dengan filter.
      if (reveal) {
        reveal.scrollTrigger?.kill();
        reveal.progress(1);
        reveal = null;
      }
      tl?.kill();
      if (reducedMotion) return apply();

      // Keluar dulu, susun ulang saat tak terlihat, lalu masuk bertahap:
      // tidak ada kartu yang saling menumpuk selama transisi.
      tl = gsap
        .timeline()
        .to(grid, { autoAlpha: 0, y: 16, duration: 0.25, ease: 'power2.in' })
        .add(apply)
        .set(grid, { y: 0 })
        .set(shown, { autoAlpha: 0, y: 28 })
        .set(grid, { autoAlpha: 1 })
        .to(shown, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out' });
    })
  );
}

/* ---------- kursor & efek pointer ---------- */

function initPointer() {
  if (!finePointer || reducedMotion) {
    $('.cursor')?.remove();
    return;
  }
  document.documentElement.classList.add('has-cursor');
  const cur = $('.cursor');
  const label = $('.cursor__label', cur);
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button');
    cur.classList.toggle('is-hover', !!t);
    const text = t?.dataset.cursor || '';
    cur.classList.toggle('has-label', !!text);
    label.textContent = text;
  });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-hover', 'has-label'));

  $$('.card__link').forEach((card) =>
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    })
  );
}

export function initUI() {
  initMenu();
  initAnchors();
  initFilters();
  initPointer();
  initProgress();
}
