// Smooth scroll, reveal teks/gambar, horizontal scroll divisi, dan efek hero.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { reducedMotion, $, $$ } from './utils.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

export let lenis = null;
let horizontal = null; // { st, panels, distance() } saat divisi di-pin

/* ---------- smooth scroll & navigasi anchor ---------- */

export function initSmoothScroll() {
  if (reducedMotion) return;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) window.__ris = { lenis, scrollToHash, ScrollTrigger };
}

/** Posisi gulir (px) untuk menampilkan elemen — termasuk panel di dalam horizontal scroll. */
export function scrollPosition(el) {
  if (!el || el.id === 'beranda') return 0;
  if (horizontal && horizontal.panels.includes(el)) {
    const { st } = horizontal;
    const p = Math.min(1, Math.max(0, el.offsetLeft / horizontal.distance()));
    return st.start + p * (st.end - st.start);
  }
  return el.getBoundingClientRect().top + window.scrollY;
}

export function scrollToHash(hash, { immediate = false } = {}) {
  const el = document.getElementById(decodeURIComponent(hash.replace(/^#/, '')));
  if (!el) return;
  const y = scrollPosition(el);
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.4, force: true });
  else window.scrollTo({ top: y, behavior: immediate || reducedMotion ? 'auto' : 'smooth' });
  // Sengaja tidak menulis #hash ke URL, agar refresh selalu kembali ke atas.
  // Pindahkan fokus untuk pengguna keyboard/pembaca layar.
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

/* ---------- reveal ---------- */

function revealLines(el) {
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 110,
        duration: 1.1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
  });
}

function revealChars(el) {
  SplitText.create(el, {
    type: 'words,chars',
    mask: 'words',
    onSplit: (self) =>
      gsap.from(self.chars, {
        yPercent: 120,
        duration: 1.2,
        stagger: 0.025,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      }),
  });
}

function clipReveal(fig, scrollTrigger) {
  const media = $('[data-parallax]', fig);
  const tl = gsap.timeline({ scrollTrigger });
  tl.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
  if (media) tl.fromTo(media, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
}

function initReveals() {
  $$('[data-reveal="lines"]').forEach(revealLines);
  $$('[data-reveal="chars"]').forEach(revealChars);
  $$('[data-reveal="fade"]').forEach((el) =>
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  );
  // Potret di luar panel divisi (panel ditangani di initDivisions).
  $$('[data-reveal="clip"]')
    .filter((el) => !el.closest('.panel'))
    .forEach((fig) => {
      clipReveal(fig, { trigger: fig, start: 'top 85%', once: true });
      const media = $('[data-parallax]', fig);
      if (media)
        gsap.to(fig, {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
        });
    });
}

function initCounters() {
  $$('[data-count]').forEach((n) => {
    const to = Number(n.dataset.count);
    const o = { v: 0 };
    gsap.to(o, {
      v: to,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => (n.textContent = String(Math.round(o.v)).padStart(2, '0')),
      scrollTrigger: { trigger: n, start: 'top 90%', once: true },
    });
  });
}

/* ---------- divisi: horizontal scroll ---------- */

function initDivisions() {
  const track = $('.divisi__track');
  if (!track) return;
  const panels = $$('.panel', track);
  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.divisi__pin',
        pin: true,
        scrub: 0.8,
        start: 'top top',
        end: () => `+=${distance()}`,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    horizontal = { st: tween.scrollTrigger, panels, distance };

    panels.forEach((panel, i) => {
      // Panel pertama sudah di posisi kiri sejak awal pin -> pakai trigger vertikal.
      const enterAt =
        i === 0
          ? { trigger: '.divisi__pin', start: 'top 60%', once: true }
          : { trigger: panel, containerAnimation: tween, start: 'left 55%', once: true };
      gsap.fromTo(
        $('.panel__ghost', panel),
        { xPercent: 12 },
        {
          xPercent: -12,
          ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        }
      );
      const fig = $('.portrait', panel);
      if (fig) clipReveal(fig, enterAt);
      gsap.from($$('.panel__unit, .panel__sub, .panel__scope li', panel), {
        y: 50,
        autoAlpha: 0,
        stagger: 0.06,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: enterAt,
      });
    });

    return () => (horizontal = null);
  });

  mm.add('(max-width: 899px)', () => {
    panels.forEach((panel) => {
      const fig = $('.portrait', panel);
      if (fig) clipReveal(fig, { trigger: fig, start: 'top 85%', once: true });
    });
  });
}

/* ---------- hero ---------- */

export function initHeroScroll(hero3d) {
  gsap.fromTo('.hero__inner', { yPercent: 0, opacity: 1 }, {
    yPercent: -12,
    opacity: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  if (hero3d) {
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => hero3d.setScroll(self.progress),
    });
  }
}

export function heroEntrance(hero3d) {
  const lines = $$('.hero__line');
  const split = SplitText.create(lines, { type: 'chars', mask: 'chars' });
  const tl = gsap.timeline();
  tl.from(split.chars, { yPercent: 115, duration: 1.3, stagger: 0.022, ease: 'expo.out' })
    .from('.hero__eyebrow, .hero__scroll', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 0.35)
    .from('.header, .progress', { autoAlpha: 0, duration: 0.8 }, 0.5)
    .from('.hero__grid', { autoAlpha: 0, duration: 1.4 }, 0);
  if (hero3d) {
    tl.to(hero3d.enter.scale, { x: 1, y: 1, z: 1, duration: 1.8, ease: 'expo.out' }, 0.1).to(
      hero3d.enter.rotation,
      { y: 0, duration: 2.2, ease: 'expo.out' },
      0.1
    );
  } else {
    tl.from('.hero__fallback', { autoAlpha: 0, scale: 0.9, duration: 1.4, ease: 'expo.out' }, 0.1);
  }
  return tl;
}

export function initScrollAnimations() {
  if (reducedMotion) return;
  initReveals();
  initCounters();
  initDivisions();
  // Foto & font dapat mengubah tinggi elemen setelah dimuat.
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

export { ScrollTrigger };
