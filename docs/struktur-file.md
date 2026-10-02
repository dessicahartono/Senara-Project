# Struktur File Senara

Penjelasan tujuan dan isi setiap file di project Senara, dikelompokkan per folder.

## Root project

| File | Tujuan dan isi |
|---|---|
| `README.md` | Dokumentasi utama: fitur, teknologi, arsitektur, class diagram, struktur database, cara menjalankan. |
| `composer.json` | Daftar library PHP yang dipakai. Hanya satu: `kreait/firebase-php` (Firebase Admin SDK untuk PHP). |
| `composer.lock` | Versi persis semua library hasil `composer install`. Dibuat otomatis, tidak perlu diedit manual. |
| `.gitignore` | File yang tidak boleh masuk Git karena berisi rahasia: `firebase_credentials.json`, `firebase_web_config.php`, `cloudinary_config.php`, `gemini_config.php`, dan folder `vendor/`. |
| `docs/prd/Senara_PRD.md` (dan `media/`) | Dokumen PRD (Product Requirements Document): rancangan kebutuhan produk beserta gambarnya. |
| `docs/struktur-file.md` | Dokumen ini. |

## `config/`

| File | Tujuan dan isi |
|---|---|
| `firebase_config.php` | Menghubungkan PHP ke Firebase. Membaca `firebase_credentials.json` (service account), menentukan URL Realtime Database, lalu membuat dua objek: `$database` dan `$auth`. Hampir semua endpoint memanggil file ini. |

## `src/`: logika backend bersama

File di sini tidak dipanggil langsung oleh browser. Isinya fungsi yang dipakai ulang oleh endpoint di `public/actions/`.

| File | Tujuan dan isi |
|---|---|
| `session.php` | Mengurus session login. `requireLoginUid()` mengambil `uid` dari session, atau menjawab 401 jika belum login. Ada juga `jsonResponse()` untuk mengirim JSON dan `destroyLoginSession()` untuk logout. |
| `users.php` | Logika profil. `getUserProfile()` menggabungkan data database dengan status dari Firebase Auth (termasuk menyamakan email setelah ganti email). `ensureUserProfile()` dan `createUserProfileIfMissing()` membuat profil baru, sedangkan `deleteUserData()` menghapus semua data pengguna sekaligus. |
| `journals.php` | Logika jurnal: validasi tanggal (`isValidDateKey`), zona waktu WIB, format data jurnal, perhitungan streak (`computeStreak`), dan `refreshJournalStats()` yang memperbarui statistik setelah jurnal dibuat atau dihapus. |
| `chat.php` | Logika chat Nomi. Berisi konstanta batas (3 hari, minimal 20 pesan, 30 pesan per scroll, 10 pesan konteks Gemini), fungsi mengambil pesan awal dan pesan lama (`initialMessages`, `messagesBefore`), serta pemanggilan Gemini API beserta system prompt Nomi. |
| `cloudinary.php` | Upload dan hapus foto di Cloudinary: membuat signature (signed upload), `cloudinaryUpload()`, `cloudinaryDestroy()`, menghapus semua foto milik satu pengguna, dan memvalidasi file foto (harus JPG, PNG, atau WebP). |
| `verification.php` | Urusan email: mengirim email verifikasi, menyimpan data "menunggu verifikasi" di session untuk kirim ulang, dan `sendEmailChangeLink()` untuk ganti email lewat REST API Firebase. |

## `public/actions/`: endpoint PHP yang dipanggil browser

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
| `profile_photo.php` | Mengganti foto profil: upload ke Cloudinary, lalu menyimpan URL-nya. **(Update)** |
| `change_email.php` | Mengganti email dengan verifikasi ulang (wajib memasukkan kata sandi). **(Update)** |
| `delete_account.php` | Menghapus akun beserta semua data dan fotonya. Wajib konfirmasi kata sandi atau login Google ulang. **(Delete)** |
| `journals.php` | GET: jurnal per bulan, per tanggal, atau yang terbaru. POST: membuat atau mengubah jurnal sekaligus fotonya. **(Create, Read, Update)** |
| `delete_journal.php` | Menghapus jurnal di satu tanggal beserta fotonya di Cloudinary. **(Delete)** |
| `streak.php` | Menghitung streak dan status 5 hari terakhir untuk dashboard. |
| `chat.php` | GET: riwayat chat, termasuk `?before=` untuk memuat pesan lama. POST: menyimpan pesan pengguna. **(Create, Read)** |
| `nomi_reply.php` | Meminta balasan dari Gemini, lalu menyimpan balasan Nomi ke database. |
| `delete_chat.php` | Menghapus satu pesan (`id`) atau seluruh riwayat (`all=1`). **(Delete)** |
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
| `arsip.js` | Render kalender, detail jurnal, ringkasan bulan, edit dan hapus. |
| `profil.js` | Edit nama dan bio, ganti foto, ganti email, reset kata sandi, dan hapus akun. |

### `services/`

Lapisan yang memanggil endpoint PHP (dengan `fetch`), supaya halaman tidak memanggil PHP langsung.

| File | Isi |
|---|---|
| `authService.js` | Logout dan reset kata sandi. |
| `googleAuth.js` | Memuat Firebase SDK, membuka popup Google, lalu mengirim token ke `google_login.php`. |
| `userService.js` | Profil, foto profil, ganti email, dan hapus akun (dengan cache profil). |
| `journalService.js` | CRUD jurnal, streak, dan ringkasan bulan (dengan cache per bulan). |
| `chatService.js` | Pesan chat, balasan Nomi, hapus pesan, dan daftar pertanyaan cepat. |
| `affirmationService.js` | Afirmasi acak (nomor terakhir disimpan di `sessionStorage`). |
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
