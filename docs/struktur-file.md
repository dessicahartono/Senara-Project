# Struktur File Senara

Penjelasan tujuan dan isi setiap file di project Senara, dikelompokkan per folder.

## Root project

| File | Tujuan dan isi |
|---|---|
| `README.md` | Dokumentasi utama: fitur, teknologi, cara menjalankan (lokal, Docker, Render), dan ringkasan keamanan. |
| `composer.json` | Daftar library PHP yang dipakai. Hanya satu: `kreait/firebase-php` (Firebase Admin SDK untuk PHP). |
| `composer.lock` | Versi persis semua library hasil `composer install`. Dibuat otomatis, tidak perlu diedit manual. |
| `.gitignore` | File yang tidak boleh masuk Git: file rahasia (`firebase_credentials.json`, `firebase_web_config.php`, `cloudinary_config.php`, `gemini_config.php`, `.env`), folder `vendor/`, dan `.DS_Store` dari macOS. |
| `.editorconfig` | Pengaturan editor yang sama untuk semua anggota tim: UTF-8, line ending LF, indentasi 4 spasi untuk PHP/JSON dan 2 spasi untuk lainnya. |
| `.gitattributes` | Memaksa semua file teks memakai line ending LF agar tidak muncul perubahan palsu CRLF. |
| `Dockerfile` | Image PHP 8.3 + Apache untuk deploy: install dependency Composer, set DocumentRoot ke `public/`, dan port dari env `PORT` (bawaan 8080). |
| `.dockerignore` | File yang tidak ikut masuk image Docker: file rahasia, `vendor/`, `.git/`, dan `docs/`. |
| `docs/prd/Senara_PRD.md` (dan `media/`) | Dokumen PRD (Product Requirements Document): rancangan kebutuhan produk beserta gambarnya. |
| `docs/struktur-file.md` | Dokumen ini. |

## `config/`

| File | Tujuan dan isi |
|---|---|
| `firebase_config.php` | Menghubungkan PHP ke Firebase. Membaca service account dari env `FIREBASE_CREDENTIALS_JSON` (atau `firebase_credentials.json` jika env kosong), menentukan URL Realtime Database, lalu membuat dua objek: `$database` dan `$auth`. Hampir semua endpoint memanggil file ini. |

### Konfigurasi rahasia

Setiap konfigurasi dibaca dari env lebih dulu (dipakai saat deploy), lalu dari file lokal di root project jika env kosong (dipakai saat development). File lokal tidak masuk Git maupun image Docker.

| Env | File lokal | Dipakai oleh |
|---|---|---|
| `FIREBASE_CREDENTIALS_JSON` | `firebase_credentials.json` | `config/firebase_config.php` |
| `FIREBASE_DATABASE_URL` | (nilai bawaan di kode) | `config/firebase_config.php` |
| `FIREBASE_WEB_CONFIG_JSON` | `firebase_web_config.php` | `get_firebase_web_config.php`, `src/verification.php` (ganti email) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `cloudinary_config.php` | `src/cloudinary.php` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | `gemini_config.php` | `src/gemini.php` |

## `src/`: logika backend bersama

File di sini tidak dipanggil langsung oleh browser. Isinya fungsi yang dipakai ulang oleh endpoint di `public/actions/`.

| File | Tujuan dan isi |
|---|---|
| `session.php` | Mengurus session login. `requireLoginUid()` mengambil `uid` dari session, atau menjawab 401 jika belum login. Ada juga `jsonResponse()` untuk mengirim JSON dan `destroyLoginSession()` untuk logout. |
| `users.php` | Logika profil. `getUserProfile()` menggabungkan data database dengan status dari Firebase Auth (termasuk menyamakan email setelah ganti email). `ensureUserProfile()` dan `createUserProfileIfMissing()` membuat profil baru, sedangkan `deleteUserData()` menghapus semua data pengguna sekaligus. |
| `journals.php` | Logika jurnal: validasi tanggal (`isValidDateKey`), zona waktu WIB, format data jurnal, perhitungan streak (`computeStreak`), dan `refreshJournalStats()` yang memperbarui statistik setelah jurnal dibuat atau dihapus. |
| `chat.php` | Logika chat Nomi. Berisi konstanta batas (3 hari, minimal 20 pesan, 30 pesan per scroll, 6 pesan konteks Gemini), batas pemakaian per pengguna (`claimNomiReplyQuota`), fungsi mengambil pesan awal dan pesan lama (`initialMessages`, `messagesBefore`), serta system prompt dan balasan Nomi. |
| `gemini.php` | Pemanggilan Gemini API yang dipakai bersama: `geminiConfig()` membaca API key dan model, `geminiThinkingConfig()` mengatur thinking serendah mungkin sesuai model, dan `callGemini()` mengirim permintaan lalu mengembalikan teks jawaban. |
| `summary.php` | Rangkuman mingguan: menentukan minggu yang dirangkum (Senin sampai Minggu WIB), memilih dan memangkas pesan pengguna (maksimal 6.000 karakter), meminta rangkuman JSON ke Gemini, lalu menyimpannya di `summaries/{uid}` (`weeklySummary()`). |
| `cloudinary.php` | Upload dan hapus foto di Cloudinary: membuat signature (signed upload), `cloudinaryUpload()`, `cloudinaryDestroy()`, menghapus semua foto milik satu pengguna, dan memvalidasi file foto (harus JPG, PNG, atau WebP). |
| `verification.php` | Urusan email: mengirim email verifikasi, menyimpan data "menunggu verifikasi" di session untuk kirim ulang, dan `sendEmailChangeLink()` untuk ganti email lewat REST API Firebase. |

## `public/actions/`: endpoint PHP yang dipanggil browser

Aturan penamaan: endpoint data memakai nama benda dan membedakan operasi lewat method HTTP (GET baca, POST simpan, DELETE hapus), misalnya `journals.php` dan `chat.php`. Endpoint aksi memakai kata kerja, misalnya `login.php` dan `change_email.php`.

| File | Tujuan |
|---|---|
| `register.php` | Membuat akun Firebase Auth dan profil, mengirim email verifikasi, lalu mengarahkan ke `cek-email.html`. **(Create)** |
| `login.php` | Login email dan kata sandi. Hanya berhasil jika email sudah diverifikasi. Jika sukses, membuat session lalu masuk ke dashboard. |
| `google_login.php` | Memverifikasi ID token Google dari browser, membuat profil saat login pertama, lalu membuat session. |
| `get_firebase_web_config.php` | Mengirim konfigurasi Firebase Web ke browser (dibutuhkan untuk popup login Google). |
| `logout.php` | Menghapus session login. |
| `resend_verification.php` | Mengirim ulang email verifikasi. Email tujuan diambil dari session, bukan dari input browser. |
| `reset_password.php` | Mengirim email reset kata sandi ke email akun yang sedang login. |
| `profile.php` | GET: membaca profil. POST: mengubah nama dan bio. **(Read, Update)** |
| `profile_photo.php` | POST: mengganti foto profil (upload ke Cloudinary, lalu menyimpan URL-nya). DELETE: menghapus foto profil. **(Update, Delete)** |
| `change_email.php` | Mengganti email dengan verifikasi ulang (wajib memasukkan kata sandi). **(Update)** |
| `delete_account.php` | Menghapus akun beserta semua data dan fotonya. Wajib konfirmasi kata sandi atau login Google ulang. **(Delete)** |
| `journals.php` | GET: tanggal yang punya jurnal per bulan (dari `journalDates`), isi jurnal per tanggal, atau jurnal terbaru. POST: membuat atau mengubah jurnal sekaligus fotonya. DELETE `?date=`: menghapus jurnal di satu tanggal beserta fotonya di Cloudinary. **(Create, Read, Update, Delete)** |
| `streak.php` | Menghitung streak dan status 5 hari terakhir untuk dashboard. |
| `chat.php` | GET: riwayat chat, termasuk `?before=` untuk memuat pesan lama. POST: menyimpan pesan pengguna. DELETE: menghapus satu pesan (`?id=`) atau seluruh riwayat beserta rangkuman mingguannya (`?all=1`). **(Create, Read, Delete)** |
| `nomi_reply.php` | Meminta balasan dari Gemini, lalu menyimpan balasan Nomi ke database. |
| `weekly_summary.php` | GET: rangkuman mingguan chat dengan Nomi untuk dashboard; dibuat lewat Gemini sekali per minggu lalu disimpan. **(Create, Read, Update)** |
| `affirmation.php` | Mengambil satu afirmasi acak dari 365 afirmasi, yang berbeda dari afirmasi terakhir. Bisa dibuka tanpa login. |

## `public/*.html`: halaman

| File | Halaman |
|---|---|
| `index.html` | Landing page dengan slider 4 slide (Tentang, Afirmasi, Nomi, Daftar). |
| `registrasi.html` | Form daftar dan tombol Google. |
| `login.html` | Form masuk. |
| `cek-email.html` | Pemberitahuan "cek emailmu" setelah daftar, dengan tombol kirim ulang. |
| `dashboard.html` | Beranda setelah login: sapaan, afirmasi, dan streak. |
| `nomi-chat.html` | Ruang chat dengan Nomi, termasuk Mode Tenang. |
| `journaling.html` | Form menulis atau mengedit jurnal (tanggal, foto, catatan). |
| `arsip.html` | Kalender jurnal beserta panel detail. |
| `profil.html` | Profil, pengaturan akun, logout, dan hapus akun. |

## `public/js/`: frontend (JavaScript ES modules)

### `config.js`

Konfigurasi global: nama aplikasi, tagline, `ROUTES` (alamat semua halaman), `ASSETS` (logo, foto Nomi), dan `MAX_PHOTO_SIZE` (10 MB).

### `pages/`

Satu file untuk tiap halaman HTML, berisi logika interaksi halaman itu.

| File | Isi |
|---|---|
| `landing.js` | Slider (geser dengan panah keyboard, sentuh, drag mouse, atau touchpad) dan memuat afirmasi. |
| `registrasi.js` | Validasi form daftar, menampilkan pesan error dari PHP, dan login Google. |
| `login.js` | Validasi form masuk, menampilkan pesan error dari PHP, login Google, dan kirim ulang verifikasi. |
| `cek-email.js` | Menampilkan email tujuan dan tombol kirim ulang dengan hitung mundur 60 detik. |
| `dashboard.js` | Sapaan, afirmasi, dan tampilan streak. |
| `nomi-chat.js` | Menampilkan chat, memuat pesan lama saat scroll ke atas, mengirim dan menghapus pesan, serta animasi napas Mode Tenang. |
| `journaling.js` | Form jurnal, kompres foto, mode edit otomatis, dan hapus jurnal. |
| `arsip.js` | Render kalender dari daftar tanggal ber-jurnal, membaca detail jurnal per tanggal saat diklik, ringkasan bulan, edit dan hapus. |
| `profil.js` | Edit nama dan bio, ganti dan hapus foto, ganti email, reset kata sandi, dan hapus akun. |

### `services/`

Lapisan yang memanggil endpoint PHP (dengan `fetch`), supaya halaman tidak memanggil PHP langsung.

| File | Isi |
|---|---|
| `authService.js` | Logout dan reset kata sandi. |
| `googleAuth.js` | Memuat Firebase SDK, membuka popup Google, lalu mengirim token ke `google_login.php`. |
| `userService.js` | Profil, ganti dan hapus foto profil, ganti email, dan hapus akun (dengan cache profil). |
| `journalService.js` | CRUD jurnal, streak, dan ringkasan bulan (dengan cache per bulan). |
| `chatService.js` | Pesan chat, balasan Nomi, hapus pesan, dan daftar pertanyaan cepat. |
| `affirmationService.js` | Afirmasi acak (nomor terakhir disimpan di `sessionStorage`). |
| `summaryService.js` | Rangkuman mingguan chat dengan Nomi untuk kartu di dashboard. |
| `photoService.js` | Kompres foto di browser (lebar maksimal 1080 px, WebP kualitas 0.8). |

### `components/`

Potongan UI yang dipakai ulang.

| File | Isi |
|---|---|
| `app-shell.js` | Sidebar, header, dan bottom nav untuk halaman setelah login. Juga mengecek login: jika belum login, pengguna diarahkan ke halaman login. |
| `site-header.js` | Header untuk landing page dan halaman auth. |
| `modal.js` | Buka dan tutup modal, serta `confirmDialog()`. |
| `toast.js` | Notifikasi kecil yang muncul sebentar. |
| `form.js` | Helper form: toggle lihat kata sandi, tanda error, dan validasi email. |

### `utils/`

| File | Isi |
|---|---|
| `dom.js` | `$`, `$$`, `escapeHtml` (mencegah XSS), `icon`, `show`/`hide`, `withLoading`, dan `shake`. |
| `format.js` | Format tanggal dalam Bahasa Indonesia, jam, nama hari, inisial, dan nama depan. |

## `public/css/`: tampilan

| File | Isi |
|---|---|
| `variables.css` | Design tokens: warna, ukuran, radius, dan bayangan. File CSS lain memakai variabel dari sini. |
| `base.css` | Reset, gaya elemen dasar, skala tipografi, ikon, dan utilitas kecil. |
| `layout.css` | Kerangka halaman: app shell (sidebar dan bottom nav) serta site shell (header publik dan footer). |
| `components.css` | Gaya komponen yang dipakai ulang (tombol, kartu, input, modal, toast, dan lainnya) dengan penamaan BEM. |
| `pages/*.css` | Gaya khusus tiap halaman: `landing`, `auth` (login, daftar, cek email), `dashboard`, `nomi-chat`, `journaling`, `arsip`, dan `profil`. |

## `public/assets/images/`

| File | Isi |
|---|---|
| `senara-logo.svg` | Logo Senara. |
| `nomi.jpg` | Foto avatar Nomi. |

## Alur singkat

Contoh saat pengguna membuka halaman Journaling:

1. `journaling.html` memuat `js/pages/journaling.js`.
2. `journaling.js` memanggil `js/services/journalService.js`.
3. Service itu melakukan `fetch` ke `actions/journals.php`.
4. Endpoint memakai helper di `src/` (`journals.php`, `cloudinary.php`) dan `config/firebase_config.php`.
5. Data dibaca atau ditulis ke Firebase Realtime Database, dan fotonya ke Cloudinary.
