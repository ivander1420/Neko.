# NEKO — Belajar TJKT Sambil Bermain

Aplikasi belajar **TJKT (Teknik dan Komputer Jaringan)** berbasis web yang bisa dijalankan
di laptop, di HP lewat jaringan sekolah, dan dibungkus menjadi **APK Android**.
Dibuat oleh **Kelompok 1 · XI TJKT 2** — pembimbing: **Pak Andy Musly**.

Stack: HTML + CSS + JavaScript murni (tanpa framework, tanpa bundler) dan satu server
Node.js **tanpa dependency** (`node:http` + WebSocket tulis tangan). Penyimpanan default berupa
**file `server/db.json`**; kalau diisi kredensial Supabase, seluruh state juga disalin ke
database cloud (lihat bagian 7).

---

## Situs online + APK (versi tayang)

- **Alamat web:** https://neko-tjkt.vercel.app — dibuka dari HP mana pun, datanya sama.
- **API online:** `https://neko-tjkt.vercel.app/api/...` (Vercel Function + Supabase). Kunci
  Supabase disimpan sebagai *Environment Variable* di akun Vercel, tidak ada di kode/APK.
- **APK online:** `dist/NEKO-online-v3.0.38.apk`. APK-nya ringan (±1,9 MB) karena
  isinya dimuat dari situs di atas; kalau internet mati, APK otomatis memakai salinan
  bawaan di dalam APK (`assets/neko/`).
- **Cara berbagi:** unggah file `.apk` itu ke MediaFire / BetaDrop / Google Drive. Siapa pun
  yang mengunduh dan memasang APK tersebut langsung membuka versi terbaru situs — tidak perlu
  build ulang APK setiap ada perubahan. Build ulang APK hanya perlu kalau berubah di sisi
  Android (ikon, `MainActivity.java`, atau salinan offline di `assets/neko/`).
- **Ikon aplikasi:** tanda "M" NEKO dipotong tepat pada garis oranye luarnya — seluruh area di
  luar garis itu **transparan**, jadi ikon menempel rapi di wallpaper apa pun. Sumbernya
  `favicon.svg`; PNG-nya ada di `public/icons/` (web) dan `android-apk/.../res/mipmap-*/`
  (launcher Android). Lihat bagian **6.5** untuk cara memperbaruinya.

---

## Daftar isi

1. [Yang perlu diketahui soal "bisa / tidak bisa"](#1-yang-perlu-diketahui-soal-bisa--tidak-bisa)
2. [Persiapan](#2-persiapan)
3. [Tiga cara menjalankan](#3-tiga-cara-menjalankan)
4. [Cara pakai setiap halaman](#4-cara-pakai-setiap-halaman)
5. [Kelas Langsung (mode Kahoot + PIN)](#5-kelas-langsung-mode-kahoot--pin)
6. [Membuat file APK debug](#6-membuat-file-apk-debug)
7. [Publish ke internet: banyak orang + Kelas Langsung hidup](#7-publish-ke-internet-banyak-orang--kelas-langsung-hidup)
8. [Publish ke GitHub: website + APK](#8-publish-ke-github-website--apk)
9. [Pemecahan masalah](#9-pemecahan-masalah)
10. [Struktur folder](#10-struktur-folder)
11. [Kredit](#11-kredit)

---

## 1. Yang perlu diketahui soal "bisa / tidak bisa"

NEKO punya dua lapisan. **Antarmuka** (buku, game, tema, maskot, profil) murni jalan di
browser. **Fitur bersama** (akun lintas perangkat, papan peringkat, Kelas Langsung, teman &
chat) butuh **server Node** hidup.

| Fitur | Laptop sendiri | Lintas perangkat (1 WiFi) | GitHub Pages / hosting statis | Server di internet (bagian 7) | APK Mode B (offline) |
|---|:--:|:--:|:--:|:--:|:--:|
| Beranda + asisten Miko | ✅ | ✅ | ✅ | ✅ | ✅ |
| Perpustakaan (6 bab TJKT) & kuis bacaan | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 game Arena + XP + season | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tema (8 dunia), audio, animasi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Halaman Kontak + lapor bug | ✅ | ✅ | ✅ | ✅ | ✅ |
| Akun yang mengikuti data ke HP lain | ✅ lokal | ✅ server | ❌ lokal per perangkat | ✅ lintas jaringan/sekolah | ❌ lokal per perangkat |
| Kelas Langsung (PIN, banyak HP) | ❌ | ✅ server | ❌ | ✅ | ❌ |
| Teman, chat, pengumuman admin | ❌ | ✅ server | ❌ | ✅ | ❌ |

**Kesimpulan penting:** GitHub Pages hanya meng-host file statis, tidak menjalankan Node.js.
Website yang di-publish ke Pages **tetap bisa dipakai dan tetap bisa dibuat akun**, tetapi
berada di *mode lokal* — datanya tersimpan di browser perangkat itu saja, dan Kelas Langsung
akan menampilkan pesan bahwa server tidak terhubung. Mode lengkap butuh server Node yang
hidup 24 jam: di laptop sendiri (`Mulai-NEKO.bat`) atau di internet lewat bagian 7.

---

## 2. Persiapan

| Kebutuhan | Untuk apa | Cek |
|---|---|---|
| **Node.js 18+** | menjalankan server NEKO | `node -v` |
| Browser Chrome/Edge terbaru | membuka aplikasi | — |
| *(opsional)* JDK 17/21 | membangun APK | `java -version` |
| *(opsional)* Android SDK (platform + build-tools) | membangun APK | folder `Sdk` |
| *(opsional)* Gradle 8.13+ | membangun APK | ada di `C:\Users\<kamu>\.gradle\wrapper\dists` |
| *(opsional)* Android Studio | cara paling gampang bikin APK | — |

Tanpa alat Android sama sekali, aplikasi ini tetap 100 % bisa dipakai sebagai web app.

---

## 3. Tiga cara menjalankan

### Cara A — Hanya di laptop (paling gampang)

1. Dobel-klik **`Mulai-NEKO.bat`**.
2. Tunggu sampai browser terbuka sendiri di `http://localhost:3000`.
3. **Jangan tutup jendela hitam servernya** selama dipakai; tutup jendela = aplikasi mati.
4. Selesai dipakai: tekan `Ctrl+C` di jendela itu, atau tutup jendela.

### Cara B — Lintas perangkat, satu WiFi (dipakai di kelas)

1. Jalankan Cara A di laptop.
2. Di jendela server ada baris seperti:
   `Jaringan:  http://192.168.1.7:3000   ← bagikan ke teman/kelas`. Angka itu alamat laptop.
3. Windows Firewall: saat muncul popup pertama kali, centang **Private networks → Allow**.
   Kalau perlu menambahkan manual lewat cmd (Administrator):
   ```
   netsh advfirewall firewall add rule name="NEKO" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
   ```
4. HP/tablet teman **harus terhubung ke WiFi yang sama**, lalu buka alamat tadi di Chrome
   (atau lewat APK Mode A, lihat bagian 6).
5. Kalau WiFi sekolah menolak antar-perangkat (*client isolation*), nyalakan **hotspot** di
   salah satu HP/laptop dan sambungkan semua perangkat ke hotspot itu; alamatnya tetap alamat
   laptop tempat server berjalan.

### Cara C — Tanpa server (mode lokal)

- Buka langsung `index.html` (protocol `file:`), **atau**
- Host foldernya di situs statis seperti **GitHub Pages** (protocol `https:` tanpa backend).

Aplikasi mendeteksi tidak adanya server, lalu memakai **akun lokal di perangkat itu**
(layar awal → tab *Buat akun*). Semua buku, game, XP, tema tetap jalan. Kelas Langsung dan chat
antar-perangkat dinonaktifkan dengan pesan yang jelas — bukan error.

---

## 4. Cara pakai setiap halaman

Menu bawah (HP) / sidebar (laptop): **Beranda · Perpustakaan · Arena · Pesan · Kontak · Profil**
(+ **Admin** khusus akun role Developer/President/Admin).
Menu bawah mengukur lebarnya sendiri setiap kali: kalau masih muat, label penuh ikut tampil;
kalau pas-pasan dipakai label pendek; kalau tetap sempit (HP kecil / layar landscape sempit)
sisa **ikon saja** — jadi tiap device mendapatkan ukuran yang paling rapi.

**Pertama kali dibuka** (setelah login pertama) NEKO menayangkan intro sinematik empat babak:
logo, tur enam halaman penting, perkenalan **Miko** (asisten tunggal NEKO, bicara dengan suaranya
sendiri), lalu tombol **Mulai belajar** yang mengajak langsung ke halaman yang ditekan.
Semua narasi berbahasa Indonesia dengan suara cewek lembut; ada tombol lewati, ketuk layar untuk
berlanjut, dan bisa diputar ulang dari Profil. Intro hanya tayang sekali per perangkat.

**Tema utama** NEKO sekarang adalah **Paper Quest** dan aplikasi terbuka pertama kali dalam versi
**gelap**-nya. Delapan dunia: Paper Quest (utama) · Hutan Rimba · Samudra · Permen Manis ·
Crimson Core · Velocity (balap, selalu gelap) · Orbit NEKO · Neon Circuit.

### Beranda
- Halo personal, ringkasan XP/season, progres bacaan, dan papan informasi admin.
- Bulatan maskot di pojok **dan** gelembung teksnya sama-sama bisa ditekan: sekali ketuk,
  jendela chat langsung terbuka.
- Asistennya **satu**: **Miko**, Partner NEKO. Miki dan Neksya sudah dihapus dari aplikasi —
  termasuk dari dalam APK — jadi tidak ada tab berpindah lagi dan riwayat chat lama tetap
  bisa dibaca tanpa error.
- Miko memegang semua bagian:
  | Topik | Contoh pertanyaan |
  |---|---|
  | Cara pakai NEKO | tema, check-in harian, akun & PIN, tombol keluar |
  | Arena + Kelas Langsung | pilih game, tingkat kesulitan, XP, season, PIN enam angka |
  | Perpustakaan | subnet, OSI, kabel, VLAN, troubleshooting, keamanan, rekomendasi bacaan |
- Jawaban Miko **dibacakan dengan suara karakternya** (cowok muda, ramah). Bahasa yang dipakai
  bahasa Indonesia; kalau perangkat tidak punya suara Indonesia, aplikasi memakai suara yang ada
  lalu mengatur nada (pitch). Saklarnya: **Profil → Atur → Suara karakter**
  (sama dengan tombol mikrofon di intro).

### Perpustakaan
- 6 buku materi: Dasar Jaringan, IP Address & Subnetting, VLAN & Switching, Hardware & Kabel,
  Troubleshooting, Keamanan Jaringan.
- Dibuka sebagai lembar dua halaman: geser dengan tombol, panah keyboard, atau usap di layar
  sentuh. Tiap halaman punya gambar/tabel dan **cek pemahaman**.
- Setiap halaman baru memberi XP; menamatkan buku membuka badge di koleksi.

### Arena
- 12 game: **Kuis Kilat, Who Is The Spy, Lab Kabel, Kartu Memori, Subnet Master, Menara OSI,
  Detektif Jaringan, Refleks Neko, Simon Router, Serang Port, Subnet 2048, Terminal Kilat**.
- Pilih kartu game → atur tingkat/opsi → Main. Skor masuk XP dan papan peringkat.
- **Who Is The Spy** mendukung 3–8 pemain dengan **nama pemain sendiri** (atur di editor roster).

### Pesan
- Cari teman lewat username, kirim permintaan berteman, lalu chat realtime.
- Tab masuk: percakapan, permintaan teman, dan pengumuman.
- Butuh server (Cara B). Di mode lokal halaman ini menampilkan penjelasan, tidak error.

### Kontak
- Kartu **guru pembimbing**, **4 anggota kelompok** lengkap (Gmail, Instagram, TikTok, GitHub,
  Red Hat), dan kartu **Laporkan Bug / Masalah** yang menyiapkan email otomatis
  (judul + keterangan + nama sesi + versi browser) ke `ivander1420@gmail.com`.

### Profil
Empat tab: **Profil · Koleksi · Panduan · Atur**.
- **Profil**: identitas, avatar (40 karakter), level, **5 season XP**
  (Langkah Pertama → Penjelajah → Arsitek → Penjaga → Legenda), riwayat check-in harian.
- **Koleksi**: badge dari buku yang sudah ditamatkan dan rekor tiap game.
- **Panduan**: cara pakai aplikasi + penjelasan tugas tiga maskot.
- **Atur**: mode terang/gelap, suara, **Suara karakter** (narasi intro + bubble maskot),
  **Putar ulang intro sinematik**, sidebar, dan **Keluar dari akun**.
  Catatan: PIN tidak bisa diganti dari dalam aplikasi — masuk lewat username + PIN yang dibuat
  saat daftar. Check-in harian otomatis memberi XP.

### Admin (role khusus)
- Membuat/mengedit pengumuman, papan informasi, leaderboard, dan pengelolaan akun.

---

## 5. Kelas Langsung (mode Kahoot + PIN)

**Syarat: server berjalan (Cara B) dan semua perangkat satu jaringan.**

1. **Guru/host** — buka **Arena → Kelas Langsung → Buat Kelas** di laptop (layar besar/proyektor).
   Pilih tingkat, topik, jumlah soal, dan waktu per soal. Layar menampilkan **PIN 6 angka**.
2. **Siswa** — buka NEKO di HP → **Kelas Langsung → Gabung**, masukkan PIN, ketik nama,
   pilih satu karakter dari **40 avatar** (karakter yang sudah dipakai pemain lain tidak bisa
   dipilih lagi; kalau dua orang memilih bersamaan, server menolak yang kedua).
3. Host menekan **Mulai**. Setiap soal: soal tampil di layar host, siswa menjawab di HP.
   Semakin cepat dan benar → semakin banyak poin.
4. Setelah tiap soal host menekan **Lihat Pembahasan** (jawaban benar + penjelasan singkat),
   lalu **Lanjut** ke soal berikutnya.
5. Selesai → **Podium** 3 besar, XP semua peserta langsung tersimpan ke akun masing-masing.
6. Tombol **Keluar** di bar atas menutup sesi; host bisa **restart** dengan opsi yang sama.

Kalau tombol Mulai tidak bisa ditekan: minimal satu siswa harus sudah bergabung
(label tombol menunjukkan jumlah pemain).

---

## 6. Membuat file APK debug

APK-nya hanya **cangkang WebView**; isinya website NEKO. Pilih salah satu:

| Mode | Isi APK | Fungsi |
|---|---|---|
| **A — Server** | WebView yang membuka `http://IP-laptop:3000` | fitur penuh: akun sinkron, Kelas Langsung, chat |
| **B — Offline** | semua file NEKO ikut terpasang di dalam APK | jalan tanpa laptop; data hanya di HP itu |

### 6.1 Struktur project

Folder bebas, contoh `C:\Users\HP\Documents\NEKO-APK`:

```
NEKO-APK/
  settings.gradle
  build.gradle
  gradle.properties
  local.properties
  app/build.gradle
  app/src/main/AndroidManifest.xml
  app/src/main/java/com/neko/tjkt/MainActivity.java
  app/src/main/assets/neko/         <- hanya Mode B
```

> Saat menyusun ulang `assets/neko`, salin **semua** file web terbaru — termasuk yang masih baru:
> `js/voice.js` (suara Miko) dan `css/intro.css` (intro sinematik). Kalau keduanya
> ketinggalan, intro tidak muncul dan bubble chat tidak bersuara.
> Cara paling aman: jalankan `powershell -File update-apk-assets.ps1` (folder root) — skrip itu
> menyalin `css/ data/ js/ assets/ public/` + `index.html manifest.webmanifest favicon.svg`
> ke `android-apk/app/src/main/assets/neko`, lalu membuang sampah lama (`neko-backup`,
> `.nojekyll`, `Mulai-NEKO.bat`). Daftar aset + versi cache ada di `index.html` (`?v=3.0.38`).

**settings.gradle**
```groovy
pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositories { google(); mavenCentral() } }
rootProject.name = "NEKO"
include ':app'
```

**build.gradle** (root)
```groovy
plugins { id 'com.android.application' version '8.13.0' apply false }
```

**gradle.properties**
```properties
android.useAndroidX=true
org.gradle.jvmargs=-Xmx2g
```

**local.properties** (ganti path SDK jika letaknya berbeda)
```properties
sdk.dir=C\:\\Users\\HP\\AppData\\Local\\Android\\Sdk
```

**app/build.gradle**
```groovy
plugins { id 'com.android.application' }
android {
    namespace 'com.neko.tjkt'
    compileSdk 36
    defaultConfig {
        applicationId "com.neko.tjkt"
        minSdk 24
        targetSdk 36
        versionCode 1
        versionName "3.0.13"
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

**app/src/main/AndroidManifest.xml**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="NEKO TJKT" android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```
`usesCleartextTraffic="true"` **wajib**: server NEKO memakai HTTP biasa, dan Android menolak
HTTP tanpa flag ini (WebView jadi putih/kosong).

**app/src/main/java/com/neko/tjkt/MainActivity.java**
```java
package com.neko.tjkt;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    // Mode A: isi alamat laptop, contoh "http://192.168.1.7:3000"
    // Mode B: kosongkan "" -> memakai file yang dibundel di assets/neko
    static final String SERVER_URL = "http://192.168.1.7:3000";

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // tanpa ini login & XP tidak tersimpan
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebViewClient(new WebViewClient());
        setContentView(web, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        web.loadUrl(SERVER_URL.isEmpty() ? "file:///android_asset/neko/index.html" : SERVER_URL);
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
```

**Khusus Mode B**, salin dulu isi website ke assets (cmd):
```
robocopy "C:\Users\HP\Downloads\Neko Fix" "C:\Users\HP\Documents\NEKO-APK\app\src\main\assets\neko" /E /XD server node_modules
```
lalu set `SERVER_URL = ""`.

### 6.2 Build

Opsi 1 — **Android Studio** (paling sedikit masalah): *Open* folder `NEKO-APK`, tunggu sync,
lalu **Build → Build APK(s)**.

Opsi 2 — **command line**, tanpa Gradle yang terinstal global (pakai Gradle yang sudah ada
di cache laptop):
```
cd /d C:\Users\HP\Documents\NEKO-APK
"C:\Users\HP\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat" --offline assembleDebug
```
Bila `--offline` gagal karena ada dependensi belum tercache, hilangkan `--offline`
(perlu internet sekali).

Hasil (ini file APK debug yang dimaksud):
```
app\build\outputs\apk\debug\app-debug.apk
```
APK debug otomatis ditandatangani *debug keystore* (`C:\Users\<kamu>\.android\debug.keystore`),
jadi **tidak perlu** membuat key sendiri.

### 6.3 Pasang ke HP

- Lewat kabel: aktifkan **Pengaturan → Pengembang → USB debugging**, lalu
  ```
  C:\Users\HP\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r "C:\Users\HP\Documents\NEKO-APK\app\build\outputs\apk\debug\app-debug.apk"
  ```
- Tanpa kabel: pindahkan `app-debug.apk` ke HP (kabel data, flashdisk, atau Google Drive),
  buka lewat File Manager → izinkan **instal dari sumber tidak dikenal**.
  Catatan: WhatsApp biasanya menolak mengirim `.apk` — pakai Drive/kabel.

### 6.4 Alternatif tanpa APK sama sekali

Karena ada `manifest.webmanifest`, situs NEKO yang sudah online bisa **di-install seperti
aplikasi**: Chrome di HP → buka alamatnya → menu ⋮ → **Tambahkan ke layar utama**.
Ikon muncul di homescreen dan berjalan layar penuh (standalone). Ini bukan APK, tapi untuk
demonstrasi biasanya cukup.

### 6.5 Cara update APK online (langkah demi langkah)

APK "online" = cangkang yang membuka `https://neko-tjkt.vercel.app`. Jadi **hampir semua
perubahan tidak perlu build ulang APK** — cukup deploy webnya:

**A. Update tampilan/isi aplikasi (paling sering)**
1. Ubah file web seperti biasa di folder project.
2. `npm run build && npm run check` — dua-duanya harus lolos.
3. Naikkan versi di **tiga tempat**: `package.json`, semua `?v=` di `index.html`,
   dan `versionName` (+`versionCode`) di `android-apk/app/build.gradle`.
   Cara cepat (ganti `3.0.38` → `3.0.39`):
   ```
   node -e "const fs=require('fs');for(const f of ['index.html','README.md'])fs.writeFileSync(f,fs.readFileSync(f,'utf8').split('3.0.38').join('3.0.39'));const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='3.0.39';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
   ```
   Versi ini penting: browser dan WebView menyimpan aset lama 5 menit (`max-age=300`), dan
   penanda `?v=` memaksa mereka mengambil yang baru.
4. Deploy ke Vercel: `vercel --prod` (atau push ke branch utama kalau auto-deploy aktif).
5. Selesai — semua APK yang terpasang di HP langsung ikut versi baru saat dibuka.

**B. Update yang wajib build ulang APK**
- Ikon launcher (`res/mipmap-*/ic_launcher.png`) atau `AndroidManifest.xml`.
- `MainActivity.java` (alamat server, perilaku offline, header WebView).
- Salinan offline `assets/neko/` — dipakai hanya saat internet mati.

Prosedurnya:
1. Ganti ikon: sunting `favicon.svg`, lalu render PNG transparan dan tempatkan di
   `public/icons/` + `res/mipmap-*/ic_launcher.png`. Skrip pembuatnya ada di
   `scripts/make-icons.ps1` (memakai Chrome headless untuk raster + `System.Drawing` untuk
   memperkecil; hasilnya `Format32bppArgb`, jadi di luar garis oranye benar-benar transparan).
2. Sinkronkan aset web ke APK: `powershell -File update-apk-assets.ps1`.
3. Build: dari folder `android-apk`, jalankan Gradle 8.14.3 (wrapper bawaan rusak, jadi pakai
   distribusi yang sudah tercache)
   ```
   "%USERPROFILE%\.gradle\wrapper\dists\gradle-8.14.3-bin\cv11ve7ro1n3o1j4so8xd9n66\gradle-8.14.3\bin\gradle.bat" assembleDebug --offline
   ```
4. Ambil hasilnya dan simpan dengan nama bertanda versi:
   ```
   copy app\build\outputs\apk\debug\app-debug.apk ..\dist\NEKO-online-v3.0.38.apk
   ```
5. Unggah `dist\NEKO-online-v3.0.38.apk` ke MediaFire / Google Drive / GitHub Releases, lalu
   sebarkan tautannya. Ganti file lama dengan yang baru (versi Android menerima install
   di atas versi lama selama `versionCode` naik — sekarang 5).
6. Cek isi APK sebelum disebarkan:
   ```
   unzip -l dist\NEKO-online-v3.0.38.apk | findstr mipmap
   ```

**C. Membuat kemasan web untuk MediaFire / hosting lain**
```
powershell -ExecutionPolicy Bypass -File scripts\make-upload-package.ps1
```
Hasilnya `dist\NEKO-web-v3.0.38.zip` (±0,63 MB, 97 berkas): seluruh situs siap diunggah ke
hosting statis mana pun. Skrip ini **menjaga** `.env`, `server/db.json`, dan folder build tidak
ikut terbawa, dan menulis jalur entri dengan pemisah `/` supaya aman di-extract di server Linux.

### 6.6 Isi APK lengkap (bahan presentasi / PPT)

Ukuran akhir **±1,9 MB**. APK adalah file ZIP; isinya begini:

| Bagian | Isi | Fungsi |
|---|---|---|
| `AndroidManifest.xml` | 1 | nama "NEKO TJKT", ikon launcher, izin INTERNET, activity utama |
| `classes.dex` | 1 kelas `com.neko.tjkt.MainActivity` + androidx.webkit | membuka WebView, memutuskan online/offline |
| `res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` | 5 ikon (48/72/96/144/192 px) | logo "M" NEKO, transparan di luar garis oranye |
| `res/drawable*/`, `res/layout*/` | ±19 file kecil | sumber daya dari library androidx.webkit |
| `resources.arsc` | 1 | tabel resource Android |
| `META-INF/*` | 5 | tanda tangan debug keystore |
| `assets/neko/index.html` | 1 | halaman tunggal aplikasi (semua layar ada di sini) |
| `assets/neko/css/` | **17 stylesheet** (±508 KB) | dasar, layout, komponen, tema 8 dunia, glass, paper, scene, ornamen, buku, game, view, sosial, live, room, pesan, avatar, intro |
| `assets/neko/js/` | **27 modul** + **12 game** (±720 KB) | app, auth, store, api, theme, scenes, ornaments, ui, community, admin, fx, mascot, voice, audio, rooms, seasons, profile, avatars, contact, intro, book, arena, live, friends + `games/` (quiz, spy lewat data, cable, memory, subnet, osi, detective, reaction, simon, portrush, merge, typing) |
| `assets/neko/data/` | **6 berkas** (±184 KB) | `materials.js` (6 bab TJKT), `materials-koding.js`, `materials-desain.js`, `quiz.js`, `spy-words.js`, `spy.js` (40 karakter Who Is The Spy) |
| `assets/neko/public/icons/` | 6 PNG (±296 KB) | ikon web/PWA 32–1024 px + `apple-touch-icon.png` |
| `assets/neko/favicon.svg` + `manifest.webmanifest` | 2 | ikon vektor + install PWA |

Alur kerja APK ketika dibuka:
1. `MainActivity` mengecek koneksi.
2. Ada internet → memuat `https://neko-tjkt.vercel.app/` (versi terbaru + server API nyata).
3. Tidak ada internet → memuat `assets/neko/index.html` lewat `WebViewAssetLoader`
   (alamat palsu `https://neko.app/neko/index.html`) sehingga aplikasi tetap jalan, tapi
   data hanya tersimpan di HP itu (mode lokal).
4. Login memakai username + PIN enam angka; PIN dikirim sebagai hash, bukan teks biasa.

---

## 7. Publish ke internet: banyak orang + Kelas Langsung hidup

Ini jalur yang benar kalau tujuannya **"dibuka banyak orang, Kelas Langsung berfungsi, dipakai
beberapa sekolah"**. Dua bagian: (a) server Node yang jalan 24 jam, (b) database Supabase supaya
data tidak hilang saat server restart.

> Kenapa dua-duanya? Hosting gratis (Render/Koyeb) menyalakan ulang container dan **disk-nya
> kosong lagi** — `server/db.json` akan hilang. Supabase adalah tempat datanya disimpan, hosting
> hanyalah tempat kodenya jalan. Kelas Langsung sendiri tetap berjalan di memori server saat
> sesi berlangsung; Supabase menyimpan akun, profil, chat, pengumuman, dan hasil permainan.

### 7.1 Buat database Supabase (5 menit)

1. Daftar di `supabase.com` → **New project** → nama `neko`, region Singapore, buat password
   database, tunggu project siap.
2. **SQL Editor → New query**, salin **seluruh isi** [`server/supabase/schema.sql`](server/supabase/schema.sql),
   lalu **Run**. Semua tabel, index, kebijakan RLS, dan seed dibuat (skripnya aman dijalankan
   berulang kali).
3. **Project Settings → API**, catat dua hal:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **Project API keys → `service_role`** → kunci panjang diawali `eyJ…`
     (ini **kunci rahasia server** — jangan pernah ditempel di APK, di `index.html`, atau di
     file `.js` mana pun).
4. Cek berhasil: **Table editor → `neko_snapshot`** ada 1 baris `key = main`, `value = {}`.

### 7.2 Jalankan server NEKO di hosting (Render contoh)

1. Push repo ke GitHub (lihat bagian 8.1) — pastikan `server/db.json` dan `server/.env`
   **tidak** ikut ter-upload (sudah ada di `.gitignore`).
2. Buka `render.com` → **New → Web Service** → pilih repo `neko-tjkt`.
3. Isi:
   | Field | Nilai |
   |---|---|
   | Runtime | Node |
   | Build command | *(kosongkan — tidak ada dependency yang perlu di-install)* |
   | Node version | 20 (atau versi terbaru yang tersedia) |
   | Start command | `node server/server.js` |
   | Instance type | Free |
4. **Environment Variables**:
   - `SUPABASE_URL` = Project URL dari langkah 7.1
   - `SUPABASE_SERVICE_ROLE_KEY` = kunci service_role
   - `NEKO_PORT` **tidak perlu diisi** — Render mengirim port-nya otomatis dan server NEKO sudah
     membacanya.
5. **Deploy**. Di log harus muncul:
   ```
   [neko] Supabase aktif → https://xxxx.supabase.co
   [neko] memakai data lokal (11 akun), dikirim ke Supabase.
     Cloud  :  Supabase neko_snapshot (key=main)
   ```
6. Alamat jadinya `https://neko-tjkt.onrender.com`. Bagikan URL itu — siapa pun (Chrome di HP,
   laptop sekolah lain) buka, daftar, dan **Kelas Langsung berfungsi**.

Kalau laptop sendiri yang dibiarkan jadi server, cukup buat file `server/.env` (salin dari
`server/.env.example`) lalu isi dua nilai itu; datanya otomatis ikut tersimpan di Supabase.

### 7.3 Menghubungkan APK ke server internet

Di `android-apk/app/src/main/java/com/neko/tjkt/MainActivity.java` isi:
```java
static final String SERVER_URL = "https://neko-tjkt.onrender.com";
```
Build ulang (bagian 6.2). Aplikasi kemudian memakai akun & Kelas Langsung sungguhan dari server
itu, bukan mode offline. Kalau `SERVER_URL` dibiarkan kosong, APK tetap Mode B (offline,
termasuk saat HP tidak ada sinyal).

### 7.4 Aturan yang tidak boleh dilanggar

* **Satu instance server saja.** Snapshot disimpan sebagai satu baris; dua server yang jalan
  bersamaan akan saling menimpa. Free tier Render = 1 instance, jadi aman selama tidak di-scale.
* Server **freeze** di free tier setelah ±15 menit tidak ada yang buka; permintaan pertama
  butuh ±30–60 detik untuk bangun. Saat sesi Kelas Langsung berlangsung, biarkan minimal satu
  tab terbuka.
* `service_role` key hanya di environment server. Kalau key pernah bocor ke repo: Supabase →
  Settings → API → **roll key**, lalu ganti env variable.
* Supaya mudah dipakai banyak sekolah, kolom `school` sudah tersedia di tabel
  `neko_users`/`neko_announcements`/`neko_live_rooms` (schema normal) — belum dipakai
  di layar, tinggal difungsikan kalau perlu pemisahan sekolah.

> **Mode alternatif (belum dipakai):** schema.sql juga berisi tabel normal
> (`neko_users`, `neko_profiles`, `neko_messages`, `neko_live_rooms`, …) dengan kebijakan RLS
> dan Realtime. Itu siap dipakai kalau nanti aplikasi dihubungkan **langsung** ke Supabase tanpa
> server Node. Hari ini server NEKO masih memakai jalur snapshot (1 baris) sehingga tidak ada
> satu baris pun kode frontend yang perlu diubah.

---

## 8. Publish ke GitHub: website + APK

### 8.1 Website → GitHub Pages

1. Buat repository (mis. `neko-tjkt`), lalu dari folder project:
   ```
   cd "C:\Users\HP\Downloads\Neko Fix"
   git init
   git add .
   git commit -m "NEKO belajar TJKT"
   git branch -M main
   git remote add origin https://github.com/<username>/neko-tjkt.git
   git push -u origin main
   ```
   `.gitignore` di repo ini sudah mengecualikan `server/db.json` (data akun siswa) dan
   `server/.env` (kunci Supabase) — cek dulu dengan `git status` sebelum push.
2. Tambahkan file kosong `.nojekyll` di root supaya Pages tidak menyaring apa pun.
3. **Settings → Pages → Source: Deploy from a branch → `main` / root → Save.**
4. Alamat jadinya `https://<username>.github.io/neko-tjkt/`.
5. Yang bekerja di URL itu: seluruh aplikasi dalam **mode lokal** (lihat tabel bagian 1).
   Yang **tidak** bekerja: Kelas Langsung, teman/chat lintas perangkat, sinkron akun,
   leaderboard bersama, pengumuman admin.
6. Normal kalau Console browser menampilkan `404 /api/...` — itu tanda backend memang tidak
   ada; aplikasi sudah menanganinya dan berpindah ke mode lokal.

> Ingin website yang fiturnya penuh (Kelas Langsung + akun lintas sekolah)? Pages tidak bisa.
> Perlu hosting yang menjalankan Node.js (Render/Koyeb/Fly) — caranya sudah ditulis di
> **bagian 7**, dan database Supabase di bagian 7.1 menutup kelemahan disk hosting gratis.

### 8.2 APK → GitHub Releases (orang lain bisa unduh dan pasang)

1. Web: **repository → Releases → Draft a new release** → tag `v1.0` → *Choose file* →
   unggah `app-debug.apk` → *Publish release*.
2. Lewat git CLI (kalau `gh` terinstal):
   ```
   gh release create v1.0 "C:\Users\HP\Documents\NEKO-APK\app\build\outputs\apk\debug\app-debug.apk" --title "NEKO 3.0.13 (APK debug)" --notes "Mode A: hubungkan ke server NEKO. Mode B: offline, data per HP."
   ```
3. Link unduhan langsung berbentuk
   `https://github.com/<username>/<repo>/releases/download/v1.0/app-debug.apk`
   — taruh di bio/Grup kelas; teman tinggal ketuk dan pasang.
4. Beri tahu cara pakainya: APK Mode A harus diisi alamat laptop (ubah `SERVER_URL` lalu build
   ulang), Mode B langsung buka dan pakai tanpa laptop.

### 8.3 (Opsional) Build APK otomatis oleh GitHub

Kalau project Android diletakkan di repo (mis. folder `android-apk/`), GitHub Actions bisa
membuat APK-nya tanpa laptop kamu — file `.github/workflows/android.yml`:
```yaml
name: Android Debug APK
on:
  push:
    paths: ['android-apk/**']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17' }
      - uses: android-actions/setup-android@v3
      - run: cd android-apk && ./gradlew assembleDebug --no-daemon
      - uses: actions/upload-artifact@v4
        with:
          name: NEKO-debug-apk
          path: android-apk/app/build/outputs/apk/debug/app-debug.apk
```
Artifact-nya bisa diunduh siapa pun dari halaman Actions run.

### 8.4 Website online penuh: GitHub → Vercel + server Node (rekomendasi)

Cara ini dipakai supaya **semua fitur hidup** (akun lintas perangkat, Kelas Langsung, Mabar,
teman/chat, leaderboard bersama) sekaligus otomatis ter-update setiap kali kode di-push.

Ringkas: Vercel menjalankan frontend statis, Render menjalankan `server/server.js`, dan
website menunjuk ke server lewat satu baris di `index.html`.

1. Push repository `NEKO` ke GitHub (branch `main` untuk production, `development` untuk uji coba).
2. Vercel → Import repository → Framework `Other`, Build Command `npm run build`,
   Output Directory `.` → Deploy.
3. Render → Web Service dari repository yang sama → Start Command `npm start` +
   environment `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` → Deploy.
4. Isi alamat server Render di `index.html`:
   `<meta name="neko-server-base" content="https://neko-server.onrender.com">` lalu push.
   Untuk satu perangkat saja: Pengaturan cepat → **Alamat server NEKO → Atur**.
5. Cek `https://<server>/api/health` dan daftar uji lengkap.

Langkah detail, alasan teknis (kenapa backend tidak bisa dititipkan ke Vercel),
batasan free tier, dan tabel pengujian ada di **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

---

## 9. Pemecahan masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman putih kosong di browser/HP | server belum jalan / salah alamat | jalankan `Mulai-NEKO.bat`, cek IP dan port `3000` |
| HP tidak bisa connect padahal 1 WiFi | Windows Firewall atau IP berubah | Allow "Private networks"; nyalakan ulang bat dan catat IP baru |
| APK hanya menampilkan halaman error | `usesCleartextTraffic` kurang / alamat salah | tambahkan flag, cek `SERVER_URL` pakai `http://` bukan `https://` |
| Login "hilang" setiap buka APK | `setDomStorageEnabled(true)` belum aktif | aktifkan DOM storage (lihat `MainActivity`) |
| `Terjadi kesalahan server (404)` saat daftar akun di Pages | situs statis tanpa backend | normal — aplikasi seharusnya pindah ke mode lokal; kalau muncul, hard refresh (Ctrl+F5) |
| Tombol **Mulai** Kelas Langsung tidak bisa ditekan | belum ada siswa bergabung | minta minimal 1 siswa join dengan PIN |
| Karakter sudah dipakai / tidak bisa dipilih | karakter unik per ruangan | pilih karakter lain, atau tunggu pemain keluar |
| Data kelas hilang | `server/db.json` terhapus | pulihkan dari cadangan; aktifkan Supabase (bagian 7) supaya ada salinan cloud |
| `Cloud : belum terhubung` di banner server | `server/.env` belum dibuat / kosong | salin `server/.env.example` jadi `server/.env`, isi URL + service_role key |
| Log `[neko] sinkron Supabase gagal ... HTTP 404` | tabel belum dibuat | jalankan ulang seluruh `server/supabase/schema.sql` di SQL Editor |
| Website cloud lambat dibuka (±30–60 detik) | free tier tertidur | buka URL-nya dulu sebelum acara; biarkan satu tab tetap terbuka saat Kelas Langsung |
| Data setelah deploy hilang padahal Supabase aktif | env variable hanya ada di laptop | isi `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` di dashboard hosting |
| Akun dan progres saling menimpa | dua instance server jalan bersamaan | di hosting: jumlah instance = 1; jangan jalankan laptop + cloud pada saat sama |
| Perubahan JS tidak terlihat | aset di-cache (`?v=`) | naikkan versi di `index.html` dan **Ctrl+F5** |
| `Invalid package config ... package.json` | Node gagal baca folder | jalankan ulang `Mulai-NEKO.bat`; jangan taruh `package.json` rusak di root |

---

## 10. Struktur folder

```
Neko Fix/
  Mulai-NEKO.bat          peluncur server (Windows)
  index.html              satu halaman aplikasi + daftar aset (?v= versi cache)
  manifest.webmanifest    supaya bisa "Tambahkan ke layar utama"
  favicon.svg             ikon aplikasi — dipotong tepat di garis oranye, luarnya transparan
  public/icons/           PNG ikon hasil scripts/make-icons.ps1 (32/180/192/512/1024 + apple-touch)
  css/                    17 stylesheet tema & komponen
  js/                     app.js, api.js, auth.js, live.js, mascot.js, contact.js, ...
    games/                12 game arena
  data/                   materials.js (6 bab) + kuis + kata & 40 karakter Who Is The Spy
  assets/                 gambar/ilustrasi
  scripts/
    prepare-build.js      gerbang "npm run build" (cek kelengkapan file + versi ?v=)
    check-project.js      gerbang "npm run check" (syntax, manifest, pola rahasia)
    make-icons.ps1        render favicon.svg -> semua ukuran ikon web + Android
  server/
    server.js             Node tanpa dependency: REST + WebSocket + long-poll
    db.json               penyimpanan lokal (file JSON) — isi akun, jangan di-upload
    supabase-sync.js      penyalin db.json ke Supabase (diam total kalau .env kosong)
    .env.example          contoh isi kredensial; salin jadi server/.env
    .env                  kredensial asli (dikecualikan dari git)
    supabase/
      schema.sql          skrip database: tabel + index + RLS + Realtime + seed
  android-apk/            project Android (Mode A / Mode B)
    app/src/main/res/mipmap-*/ic_launcher.png   ikon launcher transparan
    app/src/main/assets/neko/                   salinan offline (hasil update-apk-assets.ps1)
  dist/                   hasil jadi untuk diunggah
    NEKO-online-v3.0.38.apk                     APK terbaru untuk MediaFire/Drive/Releases
    arsip/                                      APK versi lama
  README.md               dokumen ini
```

Perintah cepat server:
```
node server/server.js              # port 3000
set NEKO_PORT=8080 && node server/server.js   # port lain (Windows cmd)
```

---

## 11. Kredit

- **Kelompok 1 · XI TJKT 2** — Ivander, Muh. Hadit Rafanizam, Muh. Fikron Ainun Najib,
  Akhsan Jauhar Santoso.
- **Guru pembimbing:** Pak Andy Musly.
- Teknologi: HTML, CSS, JavaScript, Node.js (modul bawaan), WebSocket RFC 6455, WebAudio,
  SVG (maskot & pack avatar buatan sendiri).
- Tidak memakai library eksternal, tidak memakai layanan Google, dan tidak memakai database.
