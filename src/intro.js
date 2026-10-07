// Intro: hitungan 000→100 sementara ribuan "benih" membentuk huruf RIS,
// lalu panel terbelah membuka halaman. Hanya diputar sekali per sesi.
import { gsap } from 'gsap';
import { $ } from './utils.js';

const KEY = 'ris-intro-seen';

export function shouldPlayIntro() {
  try {
    return !sessionStorage.getItem(KEY);
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* mode privat: abaikan */
  }
}

export function removeIntro() {
  const el = $('#intro');
  el?.remove();
  document.body.classList.remove('is-loading');
}

function samplePoints(text, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const size = Math.min(w * 0.36, h * 0.5);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${size}px "Manrope Variable", "Manrope", system-ui, sans-serif`;
  ctx.fillText(text, w / 2, h / 2 + size * 0.04);
  const data = ctx.getImageData(0, 0, w, h).data;
  const step = Math.max(4, Math.round(size / 42));
  const pts = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 140) pts.push([x, y]);
    }
  }
  return pts;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * @param {{ text: string | Promise<string>, ready: Promise<any> }} opts
 * @returns {Promise<void>} selesai saat panel mulai membuka.
 */
export function playIntro({ text, ready }) {
  const root = $('#intro');
  const canvas = $('.intro__canvas', root);
  const countEl = $('.intro__count', root);
  const skipBtn = $('.intro__skip', root);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;

  let particles = [];
  const state = { p: 0, burst: 0, alpha: 1 };

  function build() {
    // Ukuran diukur saat build (bukan saat modul dimuat) agar tidak 0.
    W = canvas.clientWidth || window.innerWidth || document.documentElement.clientWidth;
    H = canvas.clientHeight || window.innerHeight || document.documentElement.clientHeight;
    if (!W || !H) return;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pts = samplePoints(text, W, H);
    particles = pts.map(([tx, ty]) => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.max(W, H) * (0.35 + Math.random() * 0.5);
      return {
        sx: W / 2 + Math.cos(a) * r,
        sy: H / 2 + Math.sin(a) * r,
        tx,
        ty,
        d: Math.random() * 0.35,
        s: 0.7 + Math.random() * 1.5,
        blue: Math.random() < 0.28,
        ba: Math.random() * Math.PI * 2,
        bs: 0.5 + Math.random() * 1.5,
      };
    });
  }

  let raf = 0;
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = state.alpha;
    const time = t * 0.001;
    for (const q of particles) {
      const k = easeOut(Math.min(1, Math.max(0, (state.p - q.d) / (1 - q.d))));
      const wob = (1 - k) * 6;
      let x = q.sx + (q.tx - q.sx) * k + Math.sin(time * 2 + q.ba) * wob;
      let y = q.sy + (q.ty - q.sy) * k + Math.cos(time * 2 + q.ba) * wob;
      if (state.burst) {
        const dist = state.burst * q.bs * Math.max(W, H) * 0.6;
        x += Math.cos(q.ba) * dist;
        y += Math.sin(q.ba) * dist - state.burst * 40;
      }
      ctx.fillStyle = q.blue ? '#4C8DFF' : '#E9EFFF';
      ctx.fillRect(x, y, q.s, q.s);
    }
    raf = requestAnimationFrame(draw);
  }

  return new Promise((resolve) => {
    let done = false;
    const counter = { v: 0 };

    const exit = () => {
      if (done) return;
      done = true;
      markSeen();
      tl?.kill();
      gsap.killTweensOf([state, counter]);
      gsap
        .timeline({
          onComplete: () => {
            cancelAnimationFrame(raf);
            removeIntro();
          },
        })
        .to(state, { p: 1, duration: 0.2, ease: 'power2.out' })
        .to(state, { burst: 1, alpha: 0, duration: 1.1, ease: 'power3.in' }, '>-0.05')
        .to('.intro__meta, .intro__skip', { autoAlpha: 0, duration: 0.4 }, '<')
        .to('.intro__panel--top', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '<0.45')
        .to('.intro__panel--bottom', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
        .add(resolve, '<0.25');
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', onKey);
        exit();
      }
    };
    skipBtn.addEventListener('click', exit, { once: true });
    // Pengaman: intro tidak boleh menahan halaman lebih dari 9 detik.
    gsap.delayedCall(9, exit);
    window.addEventListener('keydown', onKey);

    let tl;
    const fontReady = document.fonts?.load('800 100px "Manrope Variable"').catch(() => {}) ?? Promise.resolve();

    Promise.all([fontReady, Promise.resolve(text).catch(() => 'RIS')]).then(([, t]) => {
      if (done) return;
      text = t || 'RIS';
      try {
        build();
      } catch (err) {
        console.warn('Partikel intro dilewati.', err);
      }
      raf = requestAnimationFrame(draw);
      tl = gsap.timeline();
      tl.to(counter, {
        v: 86,
        duration: 2.1,
        ease: 'power2.inOut',
        onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, '0')),
      }).to(state, { p: 0.92, duration: 2.1, ease: 'power2.inOut' }, 0);

      // Tunggu konten selesai dimuat sebelum mencapai 100.
      Promise.all([ready.catch(() => {}), tl.then()]).then(() => {
        if (done) return;
        gsap
          .timeline({ onComplete: () => gsap.delayedCall(0.35, exit) })
          .to(counter, {
            v: 100,
            duration: 0.5,
            ease: 'power1.out',
            onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, '0')),
          })
          .to(state, { p: 1, duration: 0.5, ease: 'power1.out' }, 0);
      });
    });
  });
}
