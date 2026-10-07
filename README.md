# Landing Page — Direktorat Riset, Inovasi, dan Sustainability (RIS)

Halaman depan Direktorat RIS · PT Riset Perkebunan Nusantara.
Berisi intro animasi, logo 3D, profil pimpinan, navigasi per divisi, dan tautan dashboard manajemen.

Semua **nama, jabatan, foto, dan link dashboard disimpan di 2 file data**, terpisah dari kode tampilan.
Mengganti pejabat atau menambah dashboard **tidak perlu menyentuh kode**.

| Yang ingin diubah | File yang diedit |
|---|---|
| Pejabat, jabatan, foto, teks direktorat, kontak | `public/content/organisasi.json` |
| Daftar dashboard manajemen | `public/content/dashboards.json` |
| Foto pimpinan | folder `public/img/pimpinan/` |
| Logo perusahaan | folder `public/img/logo/` + field `perusahaan.logo` di `organisasi.json` |

---

## A. Mengganti pejabat (mis. ada rotasi jabatan)

1. Buka repositori di **github.com** → masuk ke `public/content/organisasi.json`.
2. Klik ikon **pensil (Edit)** di kanan atas.
3. Cari blok pejabat yang berganti, lalu ubah `"nama"` (dan `"foto"` bila ada):

   ```json
   {
     "id": "dori",
     "tipe": "divisi",
     "singkatan": "DORI",
     "jabatan": "Kepala Divisi",
     "singkatanJabatan": "KADIV DORI",
     "unit": "Divisi Operasional Riset",
     "nama": "Dr. Nama Pejabat Baru, M.Si",
     "foto": "img/pimpinan/dori.webp",
     ...
   }
   ```

4. Klik **Commit changes** → **Commit changes**.
5. Tunggu ±1–2 menit, situs ter-update otomatis. Progresnya bisa dilihat di tab **Actions**.

Nama baru otomatis tampil di **semua tempat**: menu, panel divisi, indikator samping, dan footer.

### Arti setiap field

| Field | Isi | Contoh |
|---|---|---|
| `id` | Kode unik, huruf kecil tanpa spasi. Dipakai untuk navigasi menu & filter dashboard. **Sebaiknya jangan diubah.** | `"dori"` |
| `tipe` | `"pimpinan"` (SEVP), `"divisi"`, atau `"pendukung"` (TU) | `"divisi"` |
| `singkatan` | Singkatan unit, tampil besar di panel | `"DORI"` |
| `jabatan` | Nama jabatan | `"Kepala Divisi"` |
| `singkatanJabatan` | Singkatan jabatan | `"KADIV DORI"` |
| `unit` | Nama lengkap unit | `"Divisi Operasional Riset"` |
| `nama` | Nama lengkap + gelar | `"Dr. Sri Wening"` |
| `foto` | Path foto, atau `""` jika belum ada | `"img/pimpinan/dori.webp"` |
| `ruangLingkup` | (divisi & TU) Daftar ruang lingkup | `["Perencanaan dan Valuasi", "…"]` |
| `deskripsi` | (hanya TU) Penjelasan singkat | |

> **Foto kosong (`""`)?** Halaman otomatis menampilkan **inisial nama** dalam bingkai navy, jadi tidak ada gambar rusak.

### Menambah divisi baru
Salin satu blok divisi, tempel setelahnya (pisahkan dengan koma), lalu ganti `id`-nya dengan kode baru (mis. `"dsp"`).
Panel, menu, dan indikator navigasi bertambah otomatis.

## B. Mengunggah / mengganti foto pimpinan

1. Siapkan foto **potret (tegak), rasio 4:5**, mis. 1200×1500 px. Format `.webp` atau `.jpg`, ukuran < 400 KB.
2. Di github.com buka folder `public/img/pimpinan/` → **Add file → Upload files** → pilih foto → **Commit changes**.
3. Isi field `foto` di `organisasi.json`, mis. `"img/pimpinan/dori.webp"`.
   Huruf besar/kecil nama file harus **sama persis**.

### Mengganti logo perusahaan

1. Unggah file logo ke `public/img/logo/`. Sebaiknya versi **putih berlatar transparan** (`.webp`, `.png`, atau `.svg`).
2. Di `organisasi.json`, ubah `"logo"` di bagian `perusahaan`, mis. `"logo": "img/logo/rpn-putih.webp"`.

Logo tampil di header dan footer. Di header, logo putih otomatis berubah gelap saat melewati section berlatar putih.
Kosongkan (`"logo": ""`) untuk kembali ke lencana teks "RIS".

## C. Menambah dashboard

1. Buka `public/content/dashboards.json` → klik ikon pensil.
2. Salin satu blok `{ ... }`, tempel setelah blok terakhir, lalu **beri koma** di antara blok:

   ```json
       { "judul": "Dashboard 08", "url": "#", "unit": "turis", "perluLogin": true, "aktif": true },
       {
         "judul": "Monitoring Program Riset",
         "deskripsi": "Penjelasan singkat (opsional).",
         "url": "https://lookerstudio.google.com/...",
         "unit": "dori",
         "kategori": "Riset",
         "perluLogin": true,
         "aktif": true
       }
     ]
   ```

3. **Commit changes.** Kartu baru muncul dan susunan grid menyesuaikan sendiri.

Saat ini 8 kartu masih berupa placeholder ("Dashboard 01" s.d. "Dashboard 08"). Cukup ganti `judul` dan `url`-nya bila dashboard sudah siap.

| Field | Wajib? | Isi |
|---|---|---|
| `judul` | ya | Nama dashboard. |
| `url` | ya | Link lengkap berawalan `https://`. Isi `"#"` jika belum ada (kartu tampil "Segera"). |
| `unit` | tidak | `"ris"` (tingkat direktorat) atau `id` pimpinan: `"dori"`, `"dis"`, `"turis"`. Dipakai untuk tombol filter. |
| `kategori` | tidak | Label kecil di pojok kartu. |
| `deskripsi` | tidak | Penjelasan singkat di bawah judul. |
| `perluLogin` | tidak | `true` / `false` (tanpa tanda kutip). Menampilkan label "Perlu login". |
| `aktif` | tidak | `false` untuk menyembunyikan sementara tanpa menghapus. |

Urutan blok di file = urutan kartu di halaman.

## D. Kalau salah ketik?

Sebelum situs diperbarui, isi file dicek otomatis oleh `scripts/validate-content.mjs`.
Jika ada kesalahan, misalnya koma hilang, link tanpa `https://`, foto tidak ditemukan, atau `unit` tidak dikenal:

- Update **dibatalkan** dan **situs lama tetap tayang** (tidak akan tampil halaman rusak).
- Di tab **Actions** muncul tanda ❌. Klik untuk membaca pesannya, contoh:
  `dashboard[4] (SDM Peneliti).url harus diawali https://`
- Perbaiki file, lalu commit lagi.

Kesalahan JSON yang paling sering terjadi:
- Lupa koma di antara dua blok `}` `{`.
- Ada koma **setelah** item terakhir sebelum `]` atau `}`.
- Tanda kutip lengkung (`“ ”`) dari Word. Gunakan kutip lurus (`"`).

---

## Publikasi pertama ke GitHub Pages (sekali saja)

1. Buat repositori baru di GitHub (mis. `landing-page-ris`), lalu jalankan dari folder ini:

   ```bash
   git init -b main
   git add .
   git commit -m "Landing page Direktorat RIS"
   git remote add origin https://github.com/<akun>/landing-page-ris.git
   git push -u origin main
   ```

2. Di repositori: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Tunggu workflow **Deploy ke GitHub Pages** selesai (tab **Actions**).
   Situs tersedia di `https://<akun>.github.io/landing-page-ris/`.

Nama repositori bebas. Path aset bersifat relatif (`base: './'` di `vite.config.js`).

## Menjalankan di komputer (untuk pengembang)

Butuh Node.js 20+.

```bash
npm install
```

```bash
npm run dev
```

Perintah lain: `npm run validate` (cek isi file konten saja), `npm run build` (validasi + build ke `dist/`), `npm run preview` (coba hasil build).

> Halaman tidak bisa dibuka dengan klik dua kali `index.html`, karena konten dimuat via `fetch`. Gunakan `npm run dev` atau versi yang sudah di-hosting.

## Teknologi

- **Vite** (build), **GSAP** + ScrollTrigger + SplitText (animasi), **Lenis** (smooth scroll), **Three.js** (logo 3D "RIS", dimuat terpisah).
- Font Manrope & Instrument Serif di-*bundle* lokal, tanpa CDN.
- Aksesibilitas: menghormati pengaturan **reduce motion** (intro, 3D, dan scroll horizontal dimatikan), ada tautan "Lewati ke konten", menu bisa dipakai dengan keyboard (Esc untuk menutup).
- Intro hanya diputar sekali per sesi browser dan bisa dilewati (tombol atau Esc).

### Struktur

```
public/content/organisasi.json   ← data pejabat & direktorat
public/content/dashboards.json   ← data dashboard
public/img/pimpinan/             ← foto pimpinan
src/main.js         alur awal (muat data → render → animasi)
src/content.js      merender HTML dari data JSON
src/intro.js        intro partikel + hitungan
src/hero3d.js       logo 3D "RIS" (Three.js)
src/animations.js   smooth scroll, reveal, horizontal scroll divisi
src/ui.js           menu, indikator, filter dashboard, kursor
src/styles/main.css tampilan (warna navy × putih)
scripts/validate-content.mjs   pemeriksa data sebelum build
.github/workflows/deploy.yml   deploy otomatis ke GitHub Pages
```

### Catatan konten
Ruang lingkup DORI dan DIS sudah sesuai data dari Tata Usaha. Yang masih **draf/placeholder**: deskripsi & ruang lingkup TU RIS, daftar komoditas, 8 kartu dashboard, serta alamat/kontak di bagian `kontak`.
