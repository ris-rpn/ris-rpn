import '@fontsource-variable/manrope';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import 'lenis/dist/lenis.css';
import './styles/main.css';

import { loadContent, render, renderError } from './content.js';
import { shouldPlayIntro, playIntro, removeIntro } from './intro.js';
import {
  initSmoothScroll,
  initScrollAnimations,
  initHeroScroll,
  heroEntrance,
  lenis,
  ScrollTrigger,
} from './animations.js';
import { initUI } from './ui.js';
import { reducedMotion, hasWebGL, $ } from './utils.js';

if (!reducedMotion) document.documentElement.classList.add('hero-pending');

// Halaman selalu dibuka dari atas, termasuk saat di-refresh.
// Lewat ScrollTrigger: ia menyimpan nilai scrollRestoration saat dimuat dan
// mengembalikannya di setiap refresh, jadi set langsung ke history akan tertimpa.
ScrollTrigger.clearScrollMemory('manual');
if (location.hash) history.replaceState(null, '', location.pathname + location.search);

/**
 * Area kosong di hero untuk logo 3D: di antara eyebrow (atas) dan baris
 * judul (bawah), selebar layar. Diukur dengan offset (bukan
 * getBoundingClientRect) agar tidak terpengaruh transform animasi gulir.
 */
function heroSafeArea() {
  const hero = $('.hero');
  const inner = $('.hero__inner');
  const eyebrow = $('.hero__eyebrow');
  const foot = $('.hero__foot');
  const w = hero.clientWidth;
  const gap = Math.max(12, w * 0.015);
  const top = inner.offsetTop + eyebrow.offsetTop + eyebrow.offsetHeight + gap;
  const bottom = inner.offsetTop + foot.offsetTop - gap;
  // Di layar lebar sisakan ruang untuk indikator progres di kanan (simetris kiri-kanan).
  const side = w >= 900 ? Math.max(80, w * 0.06) : 12;
  return { left: side, right: w - side, top, bottom };
}

async function boot() {
  const contentP = loadContent();

  let introDone = null;
  if (!reducedMotion && shouldPlayIntro()) {
    introDone = playIntro({
      text: contentP.then((c) => c.org.direktorat.singkatan),
      ready: contentP,
    });
  } else {
    removeIntro();
  }

  try {
    render(await contentP);
  } catch (err) {
    renderError(err);
    removeIntro();
    document.documentElement.classList.remove('hero-pending');
    return;
  }
  window.scrollTo(0, 0);
  initSmoothScroll();

  // Three.js dimuat terpisah (lazy) dan hanya jika perangkat mendukung.
  let hero3d = null;
  if (!reducedMotion && hasWebGL()) {
    try {
      const { initHero } = await import('./hero3d.js');
      hero3d = initHero($('.hero__canvas'), { safeArea: heroSafeArea });
      document.documentElement.classList.add('has-webgl');
    } catch (err) {
      console.warn('3D tidak tersedia, memakai tampilan statis.', err);
    }
  }

  initScrollAnimations();
  if (!reducedMotion) initHeroScroll(hero3d);
  initUI();

  if (introDone) await introDone;
  // Dilepas di tick yang sama sebelum entrance, jadi tidak ada kedipan.
  document.documentElement.classList.remove('hero-pending');
  if (!reducedMotion) heroEntrance(hero3d);

  ScrollTrigger.refresh();
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

boot();
