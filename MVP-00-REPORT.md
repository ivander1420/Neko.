# MVP 00 — Laporan Audit & Fondasi

Tanggal audit: 2026-11-07
Nama proyek: **NEKO — Belajar TJKT Sambil Bermain** (`neko-tjkt` v3.0.42)
Status MVP 0: **SELESAI** ✅

---

## 1. Ringkasan

NEKO adalah aplikasi belajar kompetensi keahlian TJKT (Teknik Jaringan Komputer
dan Telekomunikasi) berbasis gamifikasi. Terdiri atas:

- **Frontend** — web app vanilla JS (tanpa framework), PWA-ready (manifest +
  service worker assets, ikon lengkap di `public/icons/`).
- **Backend** — server Node.js murni tanpa dependency (`server/server.js`),
  menyediakan REST API + WebSocket/long-poll realtime, dengan penyimpanan
  berkas JSON (`server/db.json`).
- **Versi serverless** — `api/neko.js` untuk deployment Vercel.
- **Klien Android** — duplikat aplikasi web di folder `android-apk/`
  (siap dibungkus Capacitor/WebView sesuai MVP 10).

## 2. Struktur Folder

| Folder | Isi | Jumlah |
|---|---|---|
| `js/` | Modul frontend utama (app, auth, api, ui, home, book, profile, dll.) | 30 berkas |
| `js/games/` | 15 mini-game (quiz, subnet, osi, cable, typing, memory, dll.) | 15 berkas |
| `server/` | Server Node murni + game-room + nobar + db.json | 4 berkas |
| `api/` | Entry serverless Vercel | 1 berkas |
| `data/` | Materi buku (TJKT, koding, desain, mega), kuis, kata spy | 8 berkas |
| `css/` | 18 lembar gaya (base, themes, games, live, rooms, dll.) | 18 berkas |
| `scripts/` | check-project, check-api-routing, prepare-build | 3 berkas |
| `assets/`, `public/icons/` | Logo SVG + ikon PWA 32–1024 px | 7 berkas |
| `android-apk/` | Mirror aplikasi untuk APK | — |

Total ±102 berkas di root (di luar `node_modules`, `.git`).

## 3. Teknologi

- **Runtime:** Node.js ≥ 18, **0 dependency npm** (semua modul bawaan).
- **Frontend:** HTML/CSS/vanilla JS, PWA (web manifest, ikon, tema).
- **Data:** berkas JSON pada server; localStorage pada klien.
- **Realtime:** WebSocket + long-poll fallback (terlihat pada `/api/health`).
- **Skrip npm:** `start`, `build` (prepare-build), `check` (check-project).

## 4. Komponen yang Sudah Berfungsi

✅ Server API lengkap: auth (login/register), room mabar (12 endpoint),
live/kelas, notifikasi (poll), pencarian user, nobar (nonton bareng).
✅ 15 mini-game edukasi jaringan siap dimainkan.
✅ 6 buku materi dengan sistem progres & lencana (badge) profil.
✅ QA harness pernah dijalankan (lihat `.qa-harness.log`): health 200,
room list 200, notifikasi 200, penanganan 401/404/400 berjalan benar.
✅ Skrip `npm run check` lolos: 58 berkas JS + manifest + pola rahasia —
semua pemeriksaan lolos.

## 5. Temuan Audit

1. **Kualitas kode baik** — tidak ada TODO/FIXME menggantung pada jalur kritis;
   `npm run check` dan `check-api-routing` berjalan bersih.
2. **Duplikasi kode** — `android-apk/` menduplikasi `js/`, `css/`, `data/`.
   Perlu strategi sinkronisasi (skrip build saat MVP 10) agar tidak berbeda versi.
3. **Penyimpanan JSON** — cukup untuk MVP 0–1, tetapi MVP 1 (auth & database)
   memerlukan PostgreSQL/Supabase seperti direncanakan.
4. **Kredensial/rahasia** — `.env.local` dan `server/.env` ada; pola rahasia
   sudah diperiksa oleh `check-project.js` dan lolos.
5. **QA harness exit=124** — log lama menunjukkan harness berhenti karena
   timeout (`exit 124`), bukan kegagalan endpoint; perlu dipertimbangkan
   batas waktu yang lebih realistis di MVP 11.

## 6. Checklist MVP 0

- [x] Audit struktur & kode yang ada
- [x] Dokumentasi struktur & teknologi (berkas ini)
- [x] Identifikasi komponen berfungsi & dependensi hilang (tidak ada — 0 dep)
- [x] Laporan awal `MVP-00-REPORT.md`
- [x] `README.md` dan `.gitignore` tersedia
- [x] Folder `docs/reports/` disiapkan

## 7. Langkah Berikutnya (MVP 1)

1. Definisikan arsitektur target: frontend (bisa tetap vanilla atau React+Vite)
   + backend Node dengan Supabase/PostgreSQL.
2. Migrasi penyimpanan user dari `db.json` ke database sungguhan.
3. Auth berbasis token/refresh + role-based access (siswa, guru, admin).
4. Tambahkan skrip build yang menyinkronkan `android-apk/`.
