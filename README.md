# Senara

Ruang tenang untuk jurnal harian, afirmasi, dan bercerita bersama Nomi.

Senara adalah website refleksi diri berbasis layanan cloud. Pengguna bisa membaca afirmasi harian, menulis jurnal lengkap dengan foto, melihat kembali jurnalnya di kalender arsip, dan bercerita kepada **Nomi**, teman bicara virtual yang hangat dan empatik (ditenagai Gemini API).

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Menjalankan dengan Docker](#menjalankan-dengan-docker)
- [Deploy ke Render](#deploy-ke-render)
- [Struktur Project](#struktur-project)
- [Keamanan](#keamanan)
- [Tim](#tim)

## Fitur

### Landing page

Slider 4 slide (Tentang Senara, contoh afirmasi harian, perkenalan Nomi, dan ajakan mendaftar). Bisa digeser dengan panah keyboard, sentuhan, mouse, atau touchpad.

### Registrasi dan login

- Daftar dengan **nama lengkap, email, dan kata sandi**, atau **Login with Google**.
- Setelah daftar, Firebase mengirim **email verifikasi**. Login dengan email baru bisa dilakukan setelah email diverifikasi.
- Email verifikasi bisa dikirim ulang dari halaman Cek Email atau Login, dengan jeda 60 detik.
- Semua halaman setelah login hanya bisa dibuka oleh pengguna yang sudah login.

### Dashboard

Sapaan dengan nama depan, afirmasi harian, dan **streak** (jumlah hari berturut-turut menulis jurnal) beserta status 5 hari terakhir.

### Afirmasi harian

Satu afirmasi acak dari **365 kalimat**, selalu berbeda dari afirmasi yang terakhir tampil. Bisa dibagikan, dan juga tampil di landing page tanpa login.

### Chat dengan Nomi

- Nomi adalah pendengar yang hangat dan menjawab singkat dalam bahasa Indonesia santai. Nomi **bukan psikolog**: tidak memberi diagnosis atau saran obat. Bila pengguna menyebut ingin menyakiti diri, Nomi mengarahkan ke orang terpercaya, layanan kesehatan jiwa **119 ext. 8**, atau layanan darurat **112**.
- Riwayat chat tersimpan per pengguna. Saat dibuka, yang tampil adalah pesan 3 hari terakhir (minimal 20 pesan). Pesan yang lebih lama dimuat 30 per sekali saat digulir ke atas.
- Hapus satu pesan atau bersihkan seluruh riwayat.
- **Mode Tenang:** latihan napas terpandu (Tarik Napas, Tahan, Hembuskan, Rileks). Berjalan sepenuhnya di browser.

### Journaling

- Satu jurnal per tanggal, berisi **foto** dan/atau **catatan** (maksimal 2000 karakter).
- Jika tanggal yang dipilih sudah punya jurnal, form otomatis masuk mode Edit.
- Tanggal bisa dipilih mundur, tetapi tidak untuk tanggal yang belum terjadi (WIB).
- Foto dikompres otomatis di browser (lebar maksimal 1080 px, WebP), lalu disimpan di Cloudinary.

### Arsip

Kalender bulanan dengan penanda di tanggal yang punya jurnal. Klik tanggal untuk melihat, mengedit, atau menghapus jurnal. Tersedia juga ringkasan bulan (jumlah momen dan persentase konsistensi).

### Profil

| Bagian | Keterangan |
|---|---|
| Nama dan bio | Bisa diubah. Bio maksimal 160 karakter. |
| Foto profil | Ganti (dipotong 400 × 400 px) atau hapus sehingga avatar kembali menampilkan inisial. |
| Ganti email | Untuk akun email dan kata sandi. Email baru berlaku setelah link verifikasi di email baru diklik. |
| Ubah kata sandi | Firebase mengirim link reset kata sandi ke email akun. |
| Logout | Keluar dari sesi. |
| Hapus akun | Menghapus profil, jurnal, chat, foto, dan akun Firebase. Wajib konfirmasi kata sandi atau login Google ulang. |

## Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | HTML, CSS, dan JavaScript (ES modules) tanpa framework |
| Backend | PHP 8.3 dengan [kreait/firebase-php](https://github.com/kreait/firebase-php) (Firebase Admin SDK) |
| Autentikasi dan email verifikasi | Firebase Authentication |
| Database | Firebase Realtime Database |
| Penyimpanan foto | Cloudinary |
| Chatbot AI | Google Gemini API |
| Hosting | Docker (PHP + Apache) di Render |

## Menjalankan Secara Lokal

### 1. Prasyarat

- PHP 8.3 atau lebih baru, dengan ekstensi `curl`, `mbstring`, dan `xml`
- [Composer](https://getcomposer.org/)
- Project Firebase dengan **Authentication** dan **Realtime Database** aktif
- Akun [Cloudinary](https://cloudinary.com/) dan API key Gemini dari [Google AI Studio](https://aistudio.google.com/apikey)

### 2. Pasang dependensi

```bash
composer install
```

### 3. Atur Firebase Console

- **Authentication → Sign-in method:** aktifkan *Email/Password* dan *Google*.
- **Authentication → Settings → Authorized domains:** tambahkan `localhost` dan domain hasil deploy. Domain ini dipakai oleh link verifikasi email dan ganti email.
- **Authentication → Settings → User actions:** aktifkan *Email enumeration protection*.
- **Realtime Database → Rules:** tolak semua akses langsung dari browser. Backend tetap bisa mengakses lewat Admin SDK.

  ```json
  {
    "rules": {
      ".read": false,
      ".write": false
    }
  }
  ```

- **Realtime Database → Data:** isi node `affirmations` dengan 365 kalimat afirmasi (kunci `1` sampai `365`).

### 4. Siapkan konfigurasi rahasia

Setiap konfigurasi dibaca dari **environment variable** lebih dulu. Jika env kosong, aplikasi membaca **file lokal di root project** (di luar folder `public`). File-file ini sudah ada di `.gitignore`, jadi tidak akan ikut ter-commit.

| Env | File lokal | Isi | Sumber |
|---|---|---|---|
| `FIREBASE_CREDENTIALS_JSON` | `firebase_credentials.json` | Service account Firebase Admin SDK | Firebase Console → Project settings → Service accounts → Generate new private key |
| `FIREBASE_WEB_CONFIG_JSON` | `firebase_web_config.php` | `apiKey`, `authDomain`, `projectId`, `appId` | Firebase Console → Project settings → General → Your apps |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `cloudinary_config.php` | Kredensial Cloudinary | Cloudinary Console → Dashboard |
| `GEMINI_API_KEY`, `GEMINI_MODEL` (opsional) | `gemini_config.php` | API key dan model Gemini | Google AI Studio |
| `FIREBASE_DATABASE_URL` (opsional) | – | URL Realtime Database | Firebase Console → Realtime Database |

Untuk development lokal, cara paling mudah adalah membuat file-file berikut:

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

Lalu letakkan file service account hasil unduhan Firebase sebagai `firebase_credentials.json` di root project.

### 5. Jalankan server

```bash
php -S localhost:8000 -t public
```

Buka `http://localhost:8000` di browser.

## Menjalankan dengan Docker

`Dockerfile` memakai PHP 8.3 + Apache dengan DocumentRoot di `public/`. File rahasia tidak ikut masuk image (lihat `.dockerignore`), jadi konfigurasi harus diberikan lewat env.

```bash
docker build -t senara .
docker run -p 8080:8080 --env-file .env senara
```

Isi `.env` memakai nama-nama env dari tabel di atas. Nilai `FIREBASE_CREDENTIALS_JSON` dan `FIREBASE_WEB_CONFIG_JSON` berupa JSON yang ditulis dalam **satu baris**.

Buka `http://localhost:8080` di browser.

## Deploy ke Render

1. Buat **Web Service** baru dari repository ini dengan runtime **Docker**.
2. Di menu **Environment**, isi semua env dari tabel [konfigurasi rahasia](#4-siapkan-konfigurasi-rahasia). Render mengatur `PORT` secara otomatis.
3. Tambahkan domain Render ke **Firebase Console → Authentication → Settings → Authorized domains**.

Render paket gratis akan "tidur" jika lama tidak dipakai, jadi permintaan pertama setelahnya bisa lambat beberapa detik.

## Struktur Project

```
Senara-Project/
├── config/firebase_config.php   # inisialisasi Firebase Admin SDK ($auth, $database)
├── src/                         # logika backend bersama (session, users, journals, chat, cloudinary, verification)
├── public/                      # root web yang disajikan ke browser
│   ├── *.html                   # halaman
│   ├── actions/                 # endpoint PHP yang dipanggil browser
│   ├── js/                      # pages, services, components, utils
│   ├── css/                     # design tokens, base, layout, components, per halaman
│   └── assets/images/
├── docs/                        # PRD dan penjelasan struktur file
├── Dockerfile
└── composer.json
```

Penjelasan lengkap setiap file ada di [docs/struktur-file.md](docs/struktur-file.md), dan kebutuhan produk ada di [docs/prd/Senara_PRD.md](docs/prd/Senara_PRD.md).

## Keamanan

- **Security Rules menolak semua akses langsung dari browser.** Semua data dibaca dan ditulis oleh backend PHP lewat Admin SDK.
- **Akses per pengguna:** setiap endpoint mengambil `uid` dari session login, bukan dari input browser, lalu hanya mengakses data milik `uid` tersebut.
- **Validasi di backend:** format tanggal, panjang catatan, jenis dan ukuran foto, dan lainnya diperiksa sebelum data disimpan.
- **Rahasia hanya ada di server:** service account Firebase, API key Gemini, dan API secret Cloudinary tidak pernah dikirim ke browser.
- **Konfirmasi untuk aksi sensitif:** ganti email dan hapus akun meminta kata sandi (atau login Google ulang).

## Tim

| Nama |
|---|
| Dessica Suhaedi Hartono |
| Khadijatul Kubro |
