// Memeriksa file konten sebelum build. Jika ada kesalahan, build (dan deploy)
// dibatalkan sehingga situs yang sedang tayang tetap aman.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');
const errors = [];
const warnings = [];

function readJson(rel) {
  const file = resolve(publicDir, rel);
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    errors.push(`File tidak ditemukan: public/${rel}`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    // Tunjukkan nomor baris agar mudah dicari di editor GitHub.
    const pos = Number(/position (\d+)/.exec(e.message)?.[1]);
    const line = Number.isFinite(pos) ? text.slice(0, pos).split('\n').length : null;
    errors.push(
      `public/${rel} bukan JSON yang valid${line ? ` (sekitar baris ${line})` : ''}: ${e.message}\n` +
        '    Periksa tanda kutip ("), koma di antara item, dan kurung { } [ ].'
    );
    return null;
  }
}

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const need = (obj, key, where) => {
  if (!isText(obj?.[key])) errors.push(`${where}.${key} wajib diisi (teks).`);
};

// ---------- organisasi.json ----------
const org = readJson('content/organisasi.json');
const ids = new Set();
const TIPE = ['pimpinan', 'divisi', 'pendukung'];

if (org) {
  need(org.perusahaan, 'nama', 'perusahaan');
  need(org.direktorat, 'nama', 'direktorat');
  need(org.direktorat, 'singkatan', 'direktorat');
  if (org.direktorat?.komoditas && !Array.isArray(org.direktorat.komoditas)) {
    errors.push('direktorat.komoditas harus berupa daftar, mis. ["Kopi", "Kakao"].');
  }
  if (isText(org.perusahaan?.logo) && !/^https?:\/\//.test(org.perusahaan.logo) && !existsSync(resolve(publicDir, org.perusahaan.logo))) {
    errors.push(
      `perusahaan.logo "${org.perusahaan.logo}" tidak ditemukan di folder public/. ` +
        'Pastikan file sudah diunggah dan nama file (termasuk huruf besar/kecil) sama persis, atau kosongkan ("").'
    );
  }
  if (org.perusahaan?.website && !/^https?:\/\//.test(org.perusahaan.website)) {
    errors.push('perusahaan.website harus diawali http:// atau https:// (atau dikosongkan "").');
  }

  if (!Array.isArray(org.pimpinan) || org.pimpinan.length === 0) {
    errors.push('pimpinan harus berupa daftar dan minimal berisi 1 orang.');
  } else {
    org.pimpinan.forEach((p, i) => {
      const where = `pimpinan[${i + 1}]${isText(p?.nama) ? ` (${p.nama})` : ''}`;
      for (const k of ['id', 'tipe', 'jabatan', 'singkatanJabatan', 'unit', 'nama']) need(p, k, where);
      if (isText(p?.id)) {
        if (!/^[a-z0-9-]+$/.test(p.id)) errors.push(`${where}.id hanya boleh huruf kecil, angka, dan tanda "-" (contoh: "dori").`);
        if (ids.has(p.id)) errors.push(`${where}.id "${p.id}" dipakai lebih dari sekali.`);
        ids.add(p.id);
      }
      if (isText(p?.tipe) && !TIPE.includes(p.tipe)) {
        errors.push(`${where}.tipe harus salah satu dari: ${TIPE.join(', ')}.`);
      }
      if (p?.ruangLingkup && !Array.isArray(p.ruangLingkup)) {
        errors.push(`${where}.ruangLingkup harus berupa daftar, mis. ["Butir 1", "Butir 2"].`);
      }
      if (isText(p?.foto)) {
        if (/^https?:\/\//.test(p.foto)) {
          warnings.push(`${where}.foto memakai link luar; disarankan unggah ke public/img/pimpinan/.`);
        } else if (!existsSync(resolve(publicDir, p.foto))) {
          errors.push(
            `${where}.foto "${p.foto}" tidak ditemukan di folder public/. ` +
              'Pastikan file sudah diunggah dan nama file (termasuk huruf besar/kecil) sama persis.'
          );
        }
      }
    });
    if (!org.pimpinan.some((p) => p?.tipe === 'pimpinan')) {
      warnings.push('Tidak ada pimpinan dengan tipe "pimpinan" — bagian pimpinan direktorat tidak akan tampil.');
    }
  }
}

// ---------- dashboards.json ----------
const dash = readJson('content/dashboards.json');
if (dash) {
  if (!Array.isArray(dash.dashboard)) {
    errors.push('dashboards.json harus memiliki daftar "dashboard": [ ... ].');
  } else {
    dash.dashboard.forEach((d, i) => {
      const where = `dashboard[${i + 1}]${isText(d?.judul) ? ` (${d.judul})` : ''}`;
      for (const k of ['judul', 'url']) need(d, k, where);
      if (isText(d?.url) && d.url !== '#' && !/^https?:\/\/[^\s]+$/.test(d.url)) {
        errors.push(`${where}.url harus diawali https:// (atau "#" jika belum ada link).`);
      }
      if (isText(d?.unit) && d.unit !== 'ris' && org && !ids.has(d.unit)) {
        errors.push(`${where}.unit "${d.unit}" tidak dikenal. Gunakan "ris" atau salah satu id: ${[...ids].join(', ')}.`);
      }
      for (const k of ['perluLogin', 'aktif']) {
        if (d && k in d && typeof d[k] !== 'boolean') errors.push(`${where}.${k} harus true atau false (tanpa tanda kutip).`);
      }
    });
  }
}

// ---------- hasil ----------
for (const w of warnings) console.warn(`⚠  ${w}`);
if (errors.length) {
  console.error(`\n✖ Konten tidak valid (${errors.length} masalah):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('\nPerbaiki lalu simpan ulang. Situs yang sedang tayang tidak berubah.\n');
  process.exit(1);
}
console.log('✔ Konten valid.');
