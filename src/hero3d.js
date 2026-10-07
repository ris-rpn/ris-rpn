// Logotype "RIS" 3D (krom di atas navy) + orbit data + partikel benih.
// Huruf dibangun dari bentuk geometris sendiri, tanpa file font.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const STROKE = 1.8;
const CAP = 10;
const R_OUT = 2.95; // jari-jari luar mangkuk R & lengkung S
const R_IN = R_OUT - STROKE;

function rect(x0, y0, x1, y1) {
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  s.lineTo(x1, y0);
  s.lineTo(x1, y1);
  s.lineTo(x0, y1);
  s.closePath();
  return s;
}

function arcBand(cx, cy, a0, a1) {
  const s = new THREE.Shape();
  s.absarc(cx, cy, R_OUT, a0, a1, false);
  s.absarc(cx, cy, R_IN, a1, a0, true);
  s.closePath();
  return s;
}

function poly(points) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}

const PI = Math.PI;

function letterR(ox) {
  const W = 7.2;
  const cx = ox + W - R_OUT;
  const cy = CAP - R_OUT;
  return [
    rect(ox, 0, ox + STROKE, CAP),
    rect(ox, CAP - STROKE, cx, CAP),
    rect(ox, cy - R_OUT, cx, cy - R_OUT + STROKE),
    arcBand(cx, cy, -PI / 2, PI / 2),
    poly([
      [ox + 3.3, cy - R_OUT + 0.2],
      [ox + 5.4, cy - R_OUT + 0.2],
      [ox + 7.5, 0],
      [ox + 5.35, 0],
    ]),
  ];
}

function letterI(ox) {
  return [rect(ox, 0, ox + STROKE, CAP)];
}

function letterS(ox) {
  const W = 7.2;
  const upY = CAP - R_OUT;
  const loY = R_OUT;
  const upX = ox + R_OUT;
  const loX = ox + W - R_OUT;
  const midY0 = loY + R_OUT - STROKE;
  return [
    rect(upX, CAP - STROKE, ox + W, CAP),
    arcBand(upX, upY, PI / 2, (3 * PI) / 2),
    rect(upX, midY0, loX, midY0 + STROKE),
    arcBand(loX, loY, -PI / 2, PI / 2),
    rect(ox, 0, loX, STROKE),
  ];
}

function buildLogoGeometry() {
  const shapes = [...letterR(0), ...letterI(9.0), ...letterS(12.6)];
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 2.6,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.16,
    bevelSegments: 5,
    curveSegments: 40,
  });
  geo.center();
  return geo;
}

function seeds(count, radius) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.45 + Math.random() * 0.55);
    const th = Math.random() * PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.6;
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.8;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return g;
}

// Bidang yang dibutuhkan logo + orbit (satuan dunia, skala 1), termasuk ruang
// untuk kemiringan akibat gerak mouse.
const LOGO_SPAN = { w: 28, h: 14.5 };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ safeArea?: () => { left: number, top: number, right: number, bottom: number } }} [opts]
 *   safeArea: area kosong (piksel, relatif kanvas) tempat logo boleh berada.
 */
export function initHero(canvas, { safeArea } = {}) {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  camera.position.set(0, 0, 48);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-10, 14, 18);
  const rim = new THREE.PointLight(0x4c8dff, 260, 80);
  rim.position.set(12, -6, -10);
  scene.add(key, rim);

  // Rig: anchor (layout) > scrollRig (gulir) > enter (animasi masuk) > tilt (mouse) > logo
  const anchor = new THREE.Group();
  const scrollRig = new THREE.Group();
  const enter = new THREE.Group();
  const tilt = new THREE.Group();
  anchor.add(scrollRig);
  scrollRig.add(enter);
  enter.add(tilt);
  scene.add(anchor);

  const logo = new THREE.Mesh(
    buildLogoGeometry(),
    new THREE.MeshPhysicalMaterial({
      color: 0xe4ebff,
      metalness: 1,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.25,
    })
  );
  tilt.add(logo);

  // Orbit dibuat pipih (miring tajam) agar tetap di sekitar logo, tidak melebar ke teks.
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4c8dff, transparent: true, opacity: 0.55 });
  const RING_R = [13, 14.5];
  const rings = [
    [RING_R[0], 0.045, 1.25, 0.2],
    [RING_R[1], 0.03, -1.3, 0.45],
  ].map(([r, t, rx, ry]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 220), ringMat);
    m.rotation.set(rx, ry, 0);
    tilt.add(m);
    return m;
  });
  const dots = rings.map((ring, i) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(i ? 0.28 : 0.38, 16, 16), new THREE.MeshBasicMaterial({ color: 0xa9c7ff }));
    ring.add(d);
    return d;
  });

  const points = new THREE.Points(
    seeds(mobile ? 450 : 1100, 26),
    new THREE.PointsMaterial({ color: 0xa9c7ff, size: 0.11, transparent: true, opacity: 0.75, depthWrite: false })
  );
  scene.add(points);

  // Mulai tersembunyi; animations.js menganimasikan `enter` setelah intro.
  enter.scale.setScalar(0.001);
  enter.rotation.y = -PI;

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  function layout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * camera.position.z * Math.tan((camera.fov * PI) / 360);
    const visW = visH * camera.aspect;
    const perPx = visH / h; // satuan dunia per piksel (di bidang z = 0)

    // Tempatkan logo di tengah area kosong yang diberikan (piksel kanvas),
    // diskalakan agar logo + orbit muat sepenuhnya -> tidak menimpa teks.
    const a = safeArea?.();
    if (a && a.right - a.left > 40 && a.bottom - a.top > 40) {
      const cx = (a.left + a.right) / 2;
      const cy = (a.top + a.bottom) / 2;
      const fitW = ((a.right - a.left) * perPx) / LOGO_SPAN.w;
      const fitH = ((a.bottom - a.top) * perPx) / LOGO_SPAN.h;
      anchor.position.set((cx / w - 0.5) * visW, (0.5 - cy / h) * visH, 0);
      anchor.scale.setScalar(Math.min(fitW, fitH, 1.6));
    } else {
      anchor.position.set(0, visH * 0.17, 0);
      anchor.scale.setScalar(Math.min(1, (visW * 0.7) / LOGO_SPAN.w));
    }
  }
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);
  layout();
  document.fonts?.ready.then(layout);

  let running = true;
  let raf = 0;
  const t0 = performance.now();
  function tick(now) {
    const t = ((now ?? performance.now()) - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    tilt.rotation.y = mouse.x * 0.45 + Math.sin(t * 0.4) * 0.12;
    tilt.rotation.x = mouse.y * 0.25 + Math.cos(t * 0.3) * 0.05;
    rings[0].rotation.z = t * 0.12;
    rings[1].rotation.z = -t * 0.08;
    dots[0].position.set(Math.cos(t * 0.6) * RING_R[0], Math.sin(t * 0.6) * RING_R[0], 0);
    dots[1].position.set(Math.cos(-t * 0.45 + 2) * RING_R[1], Math.sin(-t * 0.45 + 2) * RING_R[1], 0);
    points.rotation.y = t * 0.03;
    points.rotation.x = mouse.y * 0.05;
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(tick);
  }
  const start = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  raf = requestAnimationFrame(tick);

  // Hemat GPU: berhenti saat hero tidak terlihat atau tab disembunyikan.
  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible && !document.hidden ? start() : stop();
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (visible && !document.hidden ? start() : stop()));

  return {
    enter,
    /** p: 0..1 progres gulir keluar dari hero */
    setScroll(p) {
      scrollRig.position.y = p * 9;
      scrollRig.rotation.x = p * 0.9;
      scrollRig.scale.setScalar(1 - p * 0.35);
    },
  };
}
