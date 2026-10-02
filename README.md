# Senara

Ruang tenang untuk jurnal harian, afirmasi, dan bercerita bersama Nomi.

Senara adalah website refleksi diri berbasis layanan cloud. Pengguna bisa membaca afirmasi harian, menulis jurnal momen berharga lengkap dengan foto, melihat kembali jurnalnya dalam kalender arsip, dan bercerita kepada **Nomi**, teman bicara virtual yang hangat, empatik, dan menenangkan (ditenagai Gemini API).

**Website:** `https://<nama-service>.onrender.com`

## Tim

| Nama |
|---|
| Dessica Suhaedi Hartono |
| Khadijatul Kubro |

## Persyaratan Proyek

Website dibangun untuk memenuhi persyaratan berikut:

- Berbasis layanan cloud, dengan **Firebase** sebagai layanan wajib.
- **12 fungsi CRUD** (3 Create, 3 Read, 3 Update, 3 Delete) yang terhubung ke **Firebase Realtime Database**.
- **Register dan login** menggunakan **Firebase Authentication**.
- **Web mailer** lewat Firebase: setelah register, pengguna menerima email verifikasi.

## Fitur

### Landing page (sebelum login)

Slider dengan 4 slide:

| Slide | Judul | Isi |
|---|---|---|
| 1 | Tentang Senara | Perkenalan singkat Senara sebagai ruang aman untuk refleksi dan afirmasi harian. |
| 2 | Daily Affirmation Preview | Contoh afirmasi yang berganti acak setiap halaman dimuat. Tombol "Afirmasi Harian" di header langsung membuka slide ini. |
| 3 | Kenalan dengan Nomi | Perkenalan Nomi, dengan tombol "Sapa Nomi Sekarang" ke halaman Registrasi. |
| 4 | Mulai / Registrasi | Ajakan mendaftar. Tombol "Masuk ke Akunmu" dan tombol Daftar ada di bagian ajakan di bawah slider. |

### Registrasi dan login

- Form registrasi: **nama lengkap**, **email**, **kata sandi** (minimal 6 karakter, aturan Firebase Auth), dan **konfirmasi kata sandi** (dicek di browser agar tidak salah ketik). Tersedia juga **Login with Google**.
- Setelah registrasi, backend memanggil `sendEmailVerificationLink()` dari Firebase Authentication dan pengguna diarahkan ke halaman **Cek Email**. Link di email membawa pengguna kembali ke halaman Login.
- Login dengan email **hanya berhasil jika email sudah diverifikasi**; akun Google dianggap sudah terverifikasi. Jika belum, backend tidak membuat session dan halaman Login menampilkan tombol "Kirim ulang email verifikasi". Email verifikasi bisa dikirim ulang (dari halaman Cek Email atau Login) dengan jeda 60 detik.
- *Email Enumeration Protection* aktif, sehingga akun yang tidak ditemukan dan kata sandi yang salah sama-sama ditampilkan sebagai "Email atau kata sandi salah". Error lain yang ditangani: format email tidak valid, email belum diverifikasi, dan terlalu banyak percobaan login.
- Nama lengkap disimpan utuh, tetapi sapaan di aplikasi hanya memakai nama depan (misalnya "Hi, Seno").
- Semua halaman setelah login (Dashboard, Nomi, Journaling, Arsip, Profil) hanya bisa dibuka oleh pengguna yang sudah login.

### Afirmasi harian

- Dataset **365 kalimat afirmasi** disimpan di Realtime Database.
- Setiap halaman dimuat, browser mengirim nomor afirmasi terakhir (disimpan di `sessionStorage`), lalu backend memilih satu nomor acak 1 sampai 365 yang **berbeda dari nomor itu** dan hanya membaca satu kalimat tersebut.
- Afirmasi hanya untuk dibaca dan dibagikan (tombol Bagikan); tidak disimpan ke akun pengguna.

### Chat dengan Nomi (Gemini API)

- Nomi berkarakter pendengar yang hangat dan empatik, menjawab singkat dalam bahasa Indonesia santai. Nomi bukan psikolog: tidak memberi diagnosis atau saran obat. Bila pengguna menyebut ingin menyakiti diri, Nomi mendorongnya menghubungi orang terpercaya, layanan kesehatan jiwa **119 ext. 8**, atau layanan darurat **112**.
- Riwayat chat tersimpan per pengguna di `chats/{uid}` dan **dimuat bertahap**:
  - Saat halaman dibuka: pesan **3 hari terakhir**. Bila kurang dari 20 pesan, yang dimuat adalah **20 pesan terakhir**, sehingga ruang chat tidak kosong selama masih ada riwayat (maksimal 200 pesan sebagai pengaman).
  - Saat digulir ke atas: browser meminta `chat.php?before={id pesan terlama}` dan backend mengirim **30 pesan sebelumnya** beserta penanda `hasMore`. Pesan lama disisipkan tanpa menggeser posisi baca.
- Gemini hanya menerima **10 pesan terakhir** sebagai konteks, berapa pun panjang riwayatnya, supaya hemat token dan kuota.
- Pengguna bisa menghapus satu pesan atau membersihkan seluruh riwayat chat.
- **Mode Tenang:** latihan napas terpandu dari menu ⋯ di room chat. Pop-up dengan gradien bergerak menampilkan "Persiapkan dirimu tunggu instruksi dari Nomi" selama 4 detik, lalu instruksi berulang setiap 3 detik: *Tarik Napas → Tahan Sejenak → Hembuskan Perlahan → Rileks*. Fitur ini berjalan sepenuhnya di browser, tanpa menyimpan data dan tanpa memanggil Gemini.

### Journaling

- Form berisi **tanggal**, **foto**, dan **catatan** (maksimal 2000 karakter). Minimal salah satu dari foto atau catatan harus diisi.
- **Satu jurnal per tanggal.** Jika tanggal yang dipilih sudah punya jurnal, form otomatis membuka mode Edit.
- Tanggal bisa dipilih mundur, tetapi tidak untuk tanggal yang belum terjadi (berdasarkan WIB, dengan toleransi satu hari untuk zona waktu yang lebih maju).

### Penyimpanan foto (Cloudinary)

Foto jurnal dan foto profil disimpan di **Cloudinary**. Firebase Storage tidak dipakai karena project Firebase baru wajib memakai paket Blaze (berbayar) untuk Storage, sedangkan Cloudinary punya paket gratis tanpa kartu kredit.

Alur upload:

1. Pengguna memilih foto (maksimal 10 MB sebelum kompresi).
2. Browser otomatis mengecilkan foto ke **lebar maksimal 1080 px** dan mengompresnya ke **WebP** (cadangan JPEG) dengan **kualitas 0.8**. Foto HP sekitar 5 MB turun ke kisaran 200 sampai 400 KB.
3. Backend memeriksa isi file (harus JPG, PNG, atau WebP), lalu mengunggahnya ke Cloudinary dengan *signed upload*. API secret Cloudinary hanya ada di server.
4. Database hanya menyimpan **URL** foto pada field `photoUrl`. Nomor versi di URL berubah setiap foto diganti, sehingga browser tidak menampilkan foto lama dari cache.

Pengaturan kompres foto di browser:

| Parameter | Nilai | Alasan |
|---|---|---|
| Lebar maksimal | 1080 px | Detail jurnal tampil sekitar 500 sampai 600 px; layar beresolusi tinggi butuh sekitar 2 kali lipat. |
| Kualitas | 0.8 (80%) | Hampir tidak terlihat beda dari foto asli. |
| Format | WebP (cadangan JPEG) | Didukung browser modern dan ukurannya lebih kecil. |
| Target ukuran akhir | 200 sampai 400 KB | Foto HP sekitar 5 MB turun ke kisaran ini. |
| Batas file sebelum kompresi | 10 MB | File di atas batas ditolak. |

Foto profil dipotong menjadi persegi 400 × 400 px saat diunggah, dan setiap jurnal punya satu foto. Foto baru selalu menimpa foto lama di tempat yang sama, sehingga tidak ada file lama yang tertinggal. Saat jurnal atau akun dihapus, fotonya ikut dihapus dari Cloudinary.

### Arsip

- Kalender bulanan yang bersih; tanggal yang punya jurnal diberi penanda titik.
- Klik tanggal untuk melihat detail jurnal di panel samping (di layar kecil, di bawah kalender) bergaya kartu postingan: foto di atas, catatan di bawah, dengan tombol **Edit** dan **Hapus**.
- Tanggal tanpa jurnal menampilkan ajakan untuk menulis jurnal di tanggal itu.
- Ringkasan bulan: jumlah momen tersimpan dan persentase konsistensi refleksi.

### Profil

| Bagian | Keterangan |
|---|---|
| **Nama lengkap** | Bisa diubah; nama depannya dipakai untuk sapaan. |
| **Bio** | Kutipan diri maksimal 160 karakter, ditulis dan diedit langsung di banner profil lewat ikon pena. |
| **Foto profil** | Bisa diganti (JPG atau PNG, maksimal 3 MB) atau dihapus sehingga avatar kembali menampilkan inisial nama. |
| **Alamat email** | Akun email dan kata sandi bisa **mengganti email dengan verifikasi ulang**: masukkan email baru dan kata sandi, lalu Firebase mengirim link verifikasi ke email baru. Email baru **baru berlaku setelah link diklik**, jadi salah ketik email tidak membuat akun terkunci, dan Firebase juga memberi tahu email lama. Selama menunggu, Profil menampilkan "Menunggu verifikasi {email baru}". Email akun Google mengikuti akun Google sehingga tidak bisa diganti. |
| **Tanggal bergabung** | Hanya dibaca. |
| **Streak** | Jumlah hari berturut-turut menulis jurnal. Karena jurnal bisa diisi untuk tanggal yang sudah lewat, streak dihitung ulang setiap kali jurnal dibuat atau dihapus. |
| **Ubah kata sandi** | Mengirim email reset kata sandi dari Firebase ke email akun yang aktif (dibaca dari Firebase Auth, bukan dari session). |
| **Logout** | Keluar dari sesi aplikasi. |
| **Hapus akun** | Menghapus profil, jurnal, penanda tanggal, riwayat chat, foto di Cloudinary, lalu akun Firebase Auth. Wajib konfirmasi kata sandi (atau login Google ulang). |

## Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | HTML, CSS, dan JavaScript (ES modules) tanpa framework |
| Backend | PHP 8.3+ dengan [kreait/firebase-php](https://github.com/kreait/firebase-php) (Firebase Admin SDK) |
| Autentikasi dan email verifikasi | Firebase Authentication |
| Database | Firebase Realtime Database |
| Penyimpanan foto | Cloudinary (paket gratis) |
| Chatbot AI | Google Gemini API |
| Hosting | Render (paket gratis), menyajikan frontend dan backend dari satu tempat |

## Arsitektur

Senara memakai arsitektur **klien + Firebase (Backend-as-a-Service) + backend PHP tipis** di Render.

```mermaid
flowchart LR
    U[Browser pengguna] -->|HTTPS: halaman dan endpoint PHP| B[Backend PHP di Render]
    U -->|Login Google| A[Firebase Authentication]
    B -->|Admin SDK| A
    B -->|Admin SDK| D[(Firebase Realtime Database)]
    B -->|Signed upload| C[Cloudinary]
    B -->|System prompt + 10 pesan terakhir| G[Gemini API]
    A -.->|Email verifikasi dan ganti email| U
```

| Alur | Penjelasan |
|---|---|
| **Registrasi dan login** | Registrasi dan login email dikirim lewat form ke backend PHP, yang memanggil Firebase Authentication lewat Admin SDK. Login Google dilakukan browser lewat Firebase SDK, lalu ID token-nya diverifikasi backend. Setelah berhasil, backend menyimpan `uid` di session. |
| **Baca dan tulis data** | Browser memanggil endpoint PHP; backend membaca dan menulis data di Realtime Database lewat Admin SDK, hanya pada path milik `uid` yang sedang login. |
| **Upload foto** | Foto dikompres di browser, lalu backend mengunggahnya ke Cloudinary dan menyimpan URL-nya di database. |
| **Chat Nomi** | Backend mengirim system prompt Nomi dan pesan terakhir ke Gemini API, menyimpan balasannya, lalu meneruskannya ke browser. |
| **Web mailer** | Email verifikasi (dan link ganti email) dikirim oleh server Firebase, jadi tidak perlu layanan email tambahan. Tidak ada email lain seperti welcome email. |

**Kenapa arsitektur ini:**

- **Sesuai persyaratan:** Firebase Auth, Realtime Database, dan web mailer terpakai langsung.
- **Rahasia tetap aman:** service account Firebase, API key Gemini, dan API secret Cloudinary hanya ada di server. Kalau dipakai langsung dari browser, semuanya bisa dilihat siapa saja.
- **Keamanan berlapis:** Security Rules menolak akses langsung dari browser, dan backend hanya mengakses data milik pengguna yang sedang login. Kuota Gemini juga tidak bisa dipakai pihak luar.
- **Biaya rendah:** semua layanan memakai paket gratis.

**Konsekuensi yang perlu diketahui:**

- Realtime Database tidak mendukung join dan query kompleks, jadi struktur datanya dirancang khusus (lihat [Struktur Database](#struktur-database)).
- Render paket gratis "tidur" saat lama tidak dipakai, sehingga permintaan pertama setelahnya bisa lambat beberapa detik. Karena semua akses data lewat backend, jeda ini bisa terasa di halaman mana pun.
- Frontend dan backend berada di satu origin (Render), jadi tidak perlu pengaturan CORS lintas domain.
- Email dikirim oleh server Firebase, sehingga pembatasan port SMTP di Render paket gratis tidak berpengaruh.

**Alternatif yang dipertimbangkan:**

| Alternatif | Kelebihan | Alasan tidak dipilih |
|---|---|---|
| Semua langsung dari frontend, tanpa backend | Paling sederhana | API key Gemini terekspos, dan akses database hanya dilindungi Security Rules. |
| Backend penuh dengan database sendiri (misalnya MySQL) | Kontrol penuh atas data | Harus membangun autentikasi, upload file, dan hosting database sendiri; bertentangan dengan persyaratan Firebase. |
| Firebase Cloud Functions sebagai backend | Terintegrasi dengan Firebase | Umumnya membutuhkan paket berbayar (Blaze). |

## Class Diagram

Kelas dibagi menjadi model (data), layanan (logika), dan pendukung. Layanan di browser (`public/js/services`) memanggil endpoint PHP; logika backend bersama ada di `src/`.

```mermaid
classDiagram
    direction LR
    class User {
        +String uid
        +String name
        +String email
        +String bio
        +String photoUrl
        +String createdAt
        +String pendingEmail
    }
    class UserStats {
        +int streak
        +String lastCheckIn
    }
    class Journal {
        +String dateKey
        +String note
        +String photoUrl
        +String photoName
        +String createdAt
        +String updatedAt
    }
    class ChatMessage {
        +String messageId
        +String sender
        +String text
        +String createdAt
    }
    class Affirmation {
        +int index
        +String text
    }
    class AuthService {
        +register()
        +login()
        +signInWithGoogle()
        +logout()
        +sendPasswordReset()
    }
    class UserService {
        +getProfile()
        +updateProfile()
        +updateProfilePhoto()
        +changeEmail()
        +deleteAccount()
    }
    class JournalService {
        +saveJournal()
        +getJournalByDate()
        +getJournals()
        +getLatestJournal()
        +getMonthSummary()
        +getStreak()
        +deleteJournal()
    }
    class PhotoService {
        +compressPhoto()
    }
    class AffirmationService {
        +getRandomAffirmation()
    }
    class ChatService {
        +getMessages()
        +getOlderMessages()
        +sendMessage()
        +getNomiReply()
        +deleteMessage()
        +clearMessages()
    }
    class GeminiClient {
        +generateNomiReply()
    }

    User "1" *-- "1" UserStats
    User "1" -- "0..*" Journal
    User "1" -- "0..*" ChatMessage
    UserService ..> User
    JournalService ..> Journal
    JournalService ..> PhotoService
    UserService ..> PhotoService
    AffirmationService ..> Affirmation
    ChatService ..> ChatMessage
    ChatService ..> GeminiClient : lewat HTTP ke backend
```

| Kelas | Peran |
|---|---|
| **User** | Akun dan profil. `uid` dari Firebase Auth menjadi kunci utama; `name` dan `bio` bisa diubah. |
| **UserStats** | Streak dan tanggal jurnal terakhir, disimpan agar Profil tidak menghitung ulang dari semua jurnal. Ikut terhapus bersama akun (komposisi). |
| **Journal** | Satu momen berharga. `dateKey` (`yyyy-mm-dd`) menjadi kunci, satu jurnal per tanggal per pengguna. |
| **ChatMessage** | Satu pesan dengan Nomi; `sender` bernilai `user` atau `nomi`. |
| **Affirmation** | Satu kalimat afirmasi dengan `index` 1 sampai 365 sebagai kunci. |
| **AuthService** | Registrasi dan login email (form ke backend PHP), login Google (`googleAuth.js`), logout, dan reset kata sandi (`authService.js`). |
| **UserService** | Membaca dan memperbarui profil, foto profil, ganti email, dan hapus akun (`userService.js`). |
| **JournalService** | Create, Read (per tanggal atau per bulan), Update, dan Delete jurnal; memperbarui streak saat jurnal dibuat atau dihapus. |
| **PhotoService** | Mengompres foto di browser; backend yang mengunggah dan menghapus foto di Cloudinary. |
| **AffirmationService** | Mengambil satu afirmasi acak yang berbeda dari afirmasi terakhir. |
| **ChatService** | Mengirim pesan, membaca riwayat bertahap, dan menghapus pesan. |
| **GeminiClient** | Memanggil Gemini API dengan system prompt Nomi dan 10 pesan terakhir; hanya berjalan di backend. |

## Struktur Folder

```
Senara-Project/
├── config/
│   └── firebase_config.php      # inisialisasi Firebase Admin SDK ($auth, $database)
├── public/                      # root web (yang disajikan ke browser)
│   ├── *.html                   # halaman: index, login, registrasi, cek-email, dashboard,
│   │                            #          nomi-chat, journaling, arsip, profil
│   ├── actions/                 # endpoint PHP (auth, profil, jurnal, chat, afirmasi, dll.)
│   ├── css/                     # variables, base, layout, components, dan css per halaman
│   ├── js/
│   │   ├── components/          # app-shell (sidebar & bottom nav), modal, toast, form
│   │   ├── pages/               # skrip per halaman
│   │   ├── services/            # pemanggil endpoint PHP (userService, journalService, chatService, ...)
│   │   └── utils/
│   └── assets/images/
├── src/                         # logika backend bersama (session, users, journals, chat, cloudinary, verification)
├── composer.json
└── README.md
```

## Menjalankan Secara Lokal

### 1. Prasyarat

- PHP 8.3 atau lebih baru
- [Composer](https://getcomposer.org/)
- Project Firebase dengan **Authentication** dan **Realtime Database** aktif
- Akun Cloudinary dan API key Gemini ([Google AI Studio](https://aistudio.google.com/apikey))

### 2. Pasang dependensi

```bash
composer install
```

### 3. Atur Firebase Console

- **Authentication → Sign-in method:** aktifkan *Email/Password* dan *Google*.
- **Authentication → Settings → Authorized domains:** tambahkan `localhost` dan domain Render. Domain ini dipakai link verifikasi email dan ganti email.
- **Authentication → Settings → User actions:** aktifkan *Email enumeration protection*.
- **Realtime Database → Rules:** tolak semua akses langsung dari browser (backend tetap bisa mengakses lewat Admin SDK):

  ```json
  {
    "rules": {
      ".read": false,
      ".write": false
    }
  }
  ```

- **Realtime Database → Data:** isi node `affirmations` dengan 365 kalimat afirmasi (kunci `1` sampai `365`).

### 4. Siapkan file rahasia

File berikut tidak masuk git dan diletakkan di **root project** (di luar folder `public`):

| File | Isi | Sumber |
|---|---|---|
| `firebase_credentials.json` | Service account Firebase Admin SDK | Firebase Console → Project settings → Service accounts → Generate new private key |
| `firebase_web_config.php` | Konfigurasi web app Firebase (`apiKey`, `authDomain`, `projectId`, `appId`, dll.), dipakai untuk login Google dan ganti email | Firebase Console → Project settings → General → Your apps |
| `gemini_config.php` | `api_key` dan `model` Gemini | [Google AI Studio](https://aistudio.google.com/apikey) |
| `cloudinary_config.php` | `cloud_name`, `api_key`, `api_secret` | Cloudinary Console → Dashboard |

Contoh format file konfigurasi PHP:

```php
<?php
// cloudinary_config.php
return [
    'cloud_name' => '...',
    'api_key'    => '...',
    'api_secret' => '...',
];
```

```php
<?php
// gemini_config.php
return [
    'api_key' => '...',
    'model'   => 'gemini-3.5-flash-lite',
];
```

```php
<?php
// firebase_web_config.php
return [
    'apiKey'     => '...',
    'authDomain' => '...',
    'projectId'  => '...',
    'appId'      => '...',
];
```

URL Realtime Database diatur di `config/firebase_config.php` (`$databaseUrl`); sesuaikan jika memakai project Firebase lain.

### 5. Jalankan server

```bash
php -S localhost:8000 -t public
```

Buka `http://localhost:8000` di browser.

## Struktur Database

Realtime Database menyimpan data sebagai satu pohon JSON. Data dipisah per jenis, lalu per pengguna (`uid`), sehingga setiap pengguna punya "laci" sendiri dan membaca profil tidak ikut menarik semua jurnal atau chat.

```
users
  {uid}
    name, email, bio, photoUrl, createdAt
    pendingEmail                   hanya ada selama ganti email menunggu verifikasi
    stats
      streak, lastCheckIn
journals
  {uid}
    {dateKey}                      contoh: 2026-09-29
      note, photoUrl, photoName, createdAt, updatedAt
journalDates
  {uid}
    {dateKey}: true
affirmations
  1: "teks afirmasi ke-1"
  ...
  365: "teks afirmasi ke-365"
chats
  {uid}
    {messageId}                    kunci dari push(), otomatis urut waktu
      sender, text, createdAt
```

| Path | Isi | Kapan dibaca |
|---|---|---|
| `users/{uid}` | Profil dan statistik ringkas | Setiap halaman setelah login (sidebar) dan halaman Profil |
| `journals/{uid}/{dateKey}` | Isi lengkap jurnal pada tanggal itu | Saat membuka jurnal di Journaling atau Arsip |
| `journalDates/{uid}/{dateKey}` | Penanda tanggal yang punya jurnal | Saat membuka kalender bulanan dan menghitung streak |
| `affirmations/{1..365}` | Kalimat afirmasi | Satu node acak setiap halaman dimuat |
| `chats/{uid}/{messageId}` | Riwayat percakapan dengan Nomi | Saat membuka chat (3 hari terakhir, minimal 20 pesan) dan saat menggulir ke atas (30 pesan per muat) |

**Keterangan field:**

| Field | Tipe dan isi |
|---|---|
| `name`, `email`, `bio` | String. `email` disalin dari Firebase Auth dan disamakan lagi setelah pengguna mengganti email; email di Auth tetap sumber utamanya. `bio` boleh kosong. |
| `pendingEmail` | String, opsional. Email baru yang link verifikasinya belum diklik; dihapus otomatis setelah penggantian selesai. |
| `photoUrl` | URL dari Cloudinary, atau tidak ada jika tidak ada foto. Foto profil akun Google memakai foto Google sampai pengguna menggantinya. |
| `photoName` | Nama file asli foto jurnal, ditampilkan di form edit. |
| `note` | Catatan jurnal, maksimal 2000 karakter. |
| `sender` | `"user"` atau `"nomi"`. |
| `createdAt`, `updatedAt` | Waktu ISO 8601 (UTC), contoh `"2026-10-02T08:30:00Z"`. |
| `stats.streak` | Jumlah hari berturut-turut yang punya jurnal. |
| `stats.lastCheckIn` | `dateKey` jurnal terbaru. |
| `dateKey` | Tanggal berformat `yyyy-mm-dd`. Karena jurnal hanya satu per tanggal, tanggal langsung dipakai sebagai kunci, jadi tidak perlu `journalId`. |

## Fungsi CRUD

### 12 Fungsi CRUD Utama

Sesuai persyaratan proyek, Senara memiliki 12 fungsi CRUD (3 Create, 3 Read, 3 Update, 3 Delete) yang terhubung ke Firebase Realtime Database.

| No. dan Operasi | Fungsi dan Fitur | Path dan Data (Realtime Database) |
|---|---|---|
| **Create 1** | Registrasi: membuat profil pengguna | `users/{uid}`: name, email, createdAt, stats awal |
| **Create 2** | Journaling: menyimpan jurnal baru | `journals/{uid}/{dateKey}` dan `journalDates/{uid}/{dateKey}` |
| **Create 3** | Chat Nomi: menyimpan pesan pengguna dan balasan Nomi | `chats/{uid}/{messageId}` |
| **Read 1** | Arsip: membuka jurnal pada tanggal terpilih (panel detail) | `journals/{uid}/{dateKey}` |
| **Read 2** | Arsip: menampilkan kalender bulanan | `journalDates/{uid}`, query per bulan |
| **Read 3** | Profil: membaca data diri dan statistik | `users/{uid}` |
| **Update 1** | Edit jurnal (catatan, foto) | `journals/{uid}/{dateKey}`: note, photoUrl, updatedAt |
| **Update 2** | Simpan perubahan profil (nama lengkap, bio) | `users/{uid}` |
| **Update 3** | Ganti foto profil (avatar) | `users/{uid}/photoUrl` |
| **Delete 1** | Hapus jurnal di panel detail, termasuk foto di Cloudinary | `journals`, `journalDates`, dan `stats` |
| **Delete 2** | Hapus satu pesan atau bersihkan riwayat chat Nomi | `chats/{uid}` |
| **Delete 3** | Hapus akun beserta seluruh datanya | `users`, `journals`, `journalDates`, `chats`, Cloudinary, Firebase Auth |

### Daftar Lengkap Operasi

Dalam alur website yang sebenarnya, ada lebih banyak operasi baca dan tulis ke Realtime Database dan Cloudinary. Totalnya **29 operasi: 6 Create, 11 Read, 7 Update, 5 Delete**. Kolom "Fungsi Utama" menunjukkan operasi mana yang termasuk dalam 12 fungsi di atas.

**Create**

| No. | Operasi | Path / Tempat | Fungsi di kode | Fungsi Utama |
|---|---|---|---|---|
| **C1** | Registrasi email: membuat profil pengguna | `users/{uid}`: name, email, createdAt, stats awal | form registrasi → `actions/register.php` | Create 1 |
| **C2** | Login Google pertama kali: membuat profil jika belum ada | `users/{uid}` | `googleAuth.signInWithGoogle` → `actions/google_login.php` | - |
| **C3** | Menyimpan jurnal baru | `journals/{uid}/{dateKey}` dan `journalDates/{uid}/{dateKey}` | `journalService.saveJournal` | Create 2 |
| **C4** | Mengunggah foto jurnal | Cloudinary, lalu photoUrl di jurnal | `journalService.saveJournal` | - |
| **C5** | Menyimpan pesan pengguna di chat Nomi | `chats/{uid}/{messageId}` | `chatService.sendMessage` | Create 3 |
| **C6** | Menyimpan balasan Nomi | `chats/{uid}/{messageId}` | `chatService.getNomiReply` | Create 3 |

**Read**

| No. | Operasi | Path / Tempat | Fungsi di kode | Fungsi Utama |
|---|---|---|---|---|
| **R1** | Nama dan avatar di sidebar (setiap halaman setelah login) | `users/{uid}` | `userService.getProfile` | - |
| **R2** | Profil: data diri dan statistik | `users/{uid}` | `userService.getProfile`, `journalService.getStreak` | Read 3 |
| **R3** | Dashboard: afirmasi acak | `affirmations/{n}` | `affirmationService.getRandomAffirmation` | - |
| **R4** | Dashboard: streak dan status 5 hari terakhir | `users/{uid}/stats` dan `journalDates/{uid}` | `journalService.getStreak` | - |
| **R5** | Journaling: membuka jurnal pada tanggal tertentu | `journals/{uid}/{dateKey}` | `journalService.getJournalByDate` | - |
| **R6** | Journaling: mode Sunting mencari jurnal terakhir | `journals/{uid}`, limitToLast(1) | `journalService.getJournals` | - |
| **R7** | Arsip: kalender bulanan (tanggal yang punya jurnal) | `journalDates/{uid}`, query per bulan | `journalService.getJournals` | Read 2 |
| **R8** | Arsip: ringkasan bulan (jumlah momen, konsistensi %) | `journalDates/{uid}`, query per bulan | `journalService.getMonthSummary` | - |
| **R9** | Arsip: panel detail jurnal pada tanggal terpilih | `journals/{uid}/{dateKey}` | `journalService.getJournals` | Read 1 |
| **R10** | Chat Nomi: memuat riwayat percakapan (3 hari terakhir, minimal 20 pesan) | `chats/{uid}`, orderByKey().startAt(), limitToLast | `chatService.getMessages` | - |
| **R11** | Chat Nomi: memuat 30 pesan lama saat menggulir ke atas | `chats/{uid}`, orderByKey().endAt(id), limitToLast(31) | `chatService.getOlderMessages` | - |

**Update**

| No. | Operasi | Path / Tempat | Fungsi di kode | Fungsi Utama |
|---|---|---|---|---|
| **U1** | Edit catatan jurnal | `journals/{uid}/{dateKey}`: note, updatedAt | `journalService.saveJournal` | Update 1 |
| **U2** | Ganti foto jurnal (foto lama ditimpa di Cloudinary) | Cloudinary dan `journals/{uid}/{dateKey}`: photoUrl | `journalService.saveJournal` | Update 1 |
| **U3** | Hapus foto dari jurnal tanpa menghapus jurnalnya | Cloudinary dan `journals/{uid}/{dateKey}`: photoUrl = null | `journalService.saveJournal` (removePhoto) | - |
| **U4** | Simpan perubahan profil (nama lengkap, bio) | `users/{uid}`: name, bio | `userService.updateProfile` | Update 2 |
| **U5** | Ganti foto profil (avatar) | Cloudinary dan `users/{uid}/photoUrl` | `userService.updateProfilePhoto` | Update 3 |
| **U6** | Hitung ulang streak setelah jurnal dibuat atau dihapus | `users/{uid}/stats`: streak, lastCheckIn | `journalService` (saat simpan/hapus) | - |
| **U7** | Ganti alamat email (berlaku setelah link verifikasi diklik) | Firebase Auth email, `users/{uid}`: pendingEmail, email | `userService.changeEmail` | - |

**Delete**

| No. | Operasi | Path / Tempat | Fungsi di kode | Fungsi Utama |
|---|---|---|---|---|
| **D1** | Hapus jurnal beserta fotonya (dari Journaling dan Arsip) | `journals`, `journalDates`, Cloudinary, dan stats | `journalService.deleteJournal` | Delete 1 |
| **D2** | Hapus satu pesan chat | `chats/{uid}/{messageId}` | `chatService.deleteMessage` | Delete 2 |
| **D3** | Bersihkan seluruh riwayat chat | `chats/{uid}` | `chatService.clearMessages` | Delete 2 |
| **D4** | Hapus akun beserta seluruh datanya | `users`, `journals`, `journalDates`, `chats`, Cloudinary, Firebase Auth | `userService.deleteAccount` | Delete 3 |
| **D5** | Hapus foto profil (avatar kembali ke inisial nama) | Cloudinary dan `users/{uid}/photoUrl` | `userService.removeProfilePhoto` | - |

**Tidak dihitung sebagai CRUD database**

- Operasi Firebase Auth: login email, login Google, logout, cek dan kirim ulang email verifikasi, reset password, dan login ulang sebelum hapus akun.
- Data statis di frontend: pertanyaan pemantik jurnal (`journalService.getRandomPrompt`), tombol pertanyaan cepat di chat Nomi (`chatService.getQuickPrompts`), dan langkah latihan napas Mode Tenang di chat Nomi.

## Keamanan

- **Security Rules menolak semua akses langsung dari browser** (`.read` dan `.write` bernilai `false`). Backend PHP memakai service account (Admin SDK) sehingga tetap bisa mengakses database.
- **Akses per pengguna:** setiap endpoint mengambil `uid` dari session login, bukan dari input browser, lalu hanya membaca atau menulis path milik `uid` tersebut.
- **Validasi di backend:** sebelum menulis, PHP memeriksa format dan isi data, misalnya `dateKey` berformat `yyyy-mm-dd` dan tanggalnya valid, `note` maksimal 2000 karakter, dan `sender` bernilai `"user"` atau `"nomi"`.
- **Afirmasi** juga dibaca lewat endpoint PHP, termasuk untuk landing page, sehingga node `affirmations` tidak perlu dibuka untuk umum.
- **Verifikasi dan konfirmasi akun:** login email diblokir sampai email terverifikasi. Ganti email meminta kata sandi dan baru berlaku setelah email baru diverifikasi; hapus akun meminta kata sandi atau login Google ulang; ubah kata sandi dilakukan lewat link yang dikirim ke email akun.
- **File rahasia** (`firebase_credentials.json`, `firebase_web_config.php`, `gemini_config.php`, `cloudinary_config.php`) tidak masuk git dan berada di luar folder `public`. Service account punya akses penuh ke database, jadi file ini tidak boleh dibagikan.

## Keputusan Desain

- Deploy tunggal di Render; Firebase dipakai sebagai layanan backend (Auth dan Realtime Database), bukan hosting.
- Foto disimpan di Cloudinary karena Firebase Storage pada project baru wajib paket Blaze.
- Web mailer hanya mengirim email verifikasi (dan link ganti email) lewat Firebase Authentication; tidak ada welcome email.
- Satu jurnal per tanggal, dengan `dateKey` (`yyyy-mm-dd`) sebagai kunci database. Jurnal berisi tanggal, foto, dan catatan.
- Afirmasi 365 kalimat diisi sekali lewat Firebase Console atau skrip admin, dan tidak disimpan per pengguna.
- Registrasi meminta nama lengkap; sapaan di aplikasi hanya memakai nama depan.
- Gemini dipilih sebagai mesin chatbot karena memiliki paket gratis.
