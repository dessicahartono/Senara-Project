# Senara: Product Requirement Document

Ruang tenang untuk jurnal harian, afirmasi, dan bercerita bersama Nomi.

| | |
|---|---|
| **Produk** | Senara, website refleksi diri |
| **Tim** | 2 orang |
| **Deadline** | 20 Oktober 2026 |
| **Dokumen terkait** | [Rancangan Teknis](../rancangan-teknis.md) (arsitektur, database, daftar lengkap CRUD) |

Dokumen ini menjelaskan **mengapa** Senara dibuat, **untuk siapa**, dan **apa** yang harus bisa dilakukan pengguna. Cara membangunnya ada di Rancangan Teknis.

## Daftar Isi

1. [Latar Belakang dan Masalah](#1-latar-belakang-dan-masalah)
2. [Tujuan](#2-tujuan)
3. [Target Pengguna](#3-target-pengguna)
4. [Ruang Lingkup](#4-ruang-lingkup)
5. [Persyaratan Proyek](#5-persyaratan-proyek)
6. [Alur Pengguna Utama](#6-alur-pengguna-utama)
7. [Kebutuhan Fungsional](#7-kebutuhan-fungsional)
8. [Kebutuhan Non-Fungsional](#8-kebutuhan-non-fungsional)
9. [Nada dan Konten](#9-nada-dan-konten)
10. [Batasan dan Asumsi](#10-batasan-dan-asumsi)
11. [Risiko dan Mitigasi](#11-risiko-dan-mitigasi)
12. [Jadwal](#12-jadwal)

---

## 1. Latar Belakang dan Masalah

Setiap orang memiliki pengalaman dan perasaan yang terkadang sulit dipahami atau diungkapkan. Namun, tidak semua orang terbiasa melakukan refleksi diri atau memiliki tempat untuk bercerita. Beberapa kendala yang sering dihadapi antara lain:

- **Sulit memulai kebiasaan menulis jurnal.** Pengguna terkadang tidak tahu harus menulis apa atau merasa kesulitan untuk menjaga konsistensi dalam mencatat pengalaman dan perasaannya.
- **Membutuhkan tempat untuk bercerita.** Tidak semua orang selalu memiliki waktu atau merasa nyaman untuk menceritakan apa yang sedang dialami kepada orang lain. Terkadang, pengguna hanya ingin mengungkapkan pikiran dan perasaannya melalui media yang lebih praktis.
- **Kesulitan melihat kembali proses yang telah dilalui.** Catatan yang tersebar atau tidak terdokumentasi dengan baik dapat membuat pengguna kesulitan mengingat pengalaman dan memahami perubahan yang terjadi dari waktu ke waktu.

Senara dikembangkan sebagai ruang digital yang membantu pengguna melakukan refleksi diri dengan cara yang sederhana dan fleksibel. Senara menyediakan afirmasi harian, Nomi sebagai teman bicara berbasis AI, serta fitur jurnal berupa foto dan catatan yang dapat disimpan dan dilihat kembali melalui kalender. Ketiga fitur ini dirancang untuk membantu pengguna mengekspresikan diri, mencatat pengalaman, dan melihat kembali perjalanan mereka sesuai kebutuhan masing-masing.

## 2. Tujuan

1. Membantu pengguna memulai dan membangun kebiasaan refleksi diri melalui aktivitas sederhana.
2. Menyediakan ruang untuk mengungkapkan pikiran dan perasaan melalui percakapan dengan Nomi.
3. Memudahkan pengguna menyimpan, mengakses, dan melihat kembali catatan serta pengalaman pribadi.
4. Menyediakan pengalaman penggunaan yang nyaman, mudah dipahami, dan dapat diakses melalui berbagai perangkat.

Untuk proyek ini, Senara dianggap berhasil apabila seluruh persyaratan pada Bagian 5 terpenuhi, fitur utama dapat didemonstrasikan dengan baik, serta website berhasil di-deploy dan dapat diakses secara publik sebelum tenggat waktu proyek.

## 3. Target Pengguna

Senara ditujukan bagi siapa saja yang ingin memiliki ruang pribadi untuk mengekspresikan diri, melakukan refleksi, dan mencatat pengalaman sehari-hari. Aplikasi ini dapat digunakan oleh individu dengan latar belakang, usia, aktivitas, dan kebutuhan yang beragam.

Senara dirancang agar mudah digunakan oleh pengguna berbahasa Indonesia, baik melalui ponsel maupun desktop, tanpa mengharuskan pengguna memiliki pengalaman sebelumnya dalam menulis jurnal atau melakukan refleksi diri.

## 4. Ruang Lingkup

**Termasuk**

- Landing page untuk pengunjung yang belum login.
- Registrasi, verifikasi email, login menggunakan email atau Google, dan pengaturan akun.
- Dashboard yang menampilkan sapaan, afirmasi harian, streak, dan Kilasan Mingguan bersama Nomi.
- Fitur percakapan dengan Nomi sebagai teman bicara berbasis AI, termasuk latihan pernapasan.
- Fitur jurnal untuk menyimpan foto dan/atau catatan pribadi.
- Arsip jurnal dalam tampilan kalender untuk memudahkan pengguna melihat kembali catatan berdasarkan tanggal.
- Halaman profil yang mencakup data diri, foto profil, penggantian email, penggantian kata sandi, logout, dan penghapusan akun.
- Antarmuka responsif yang dapat digunakan melalui desktop maupun ponsel.

**Tidak termasuk**

- Layanan konseling atau terapi profesional. Nomi bukan psikolog atau psikiater, tidak memberikan diagnosis, dan tidak meresepkan obat.
- Fitur sosial, seperti berbagi jurnal dengan pengguna lain, komentar, atau feed publik.
- Aplikasi mobile native dan notifikasi push.
- Email sambutan atau email selain yang diperlukan untuk verifikasi akun, penggantian email, dan reset kata sandi.
- Fitur ekspor jurnal, pelacak suasana hati (*mood tracker*), dan statistik lanjutan.
- Dukungan bahasa selain bahasa Indonesia.

## 5. Persyaratan Proyek

Senara dibangun untuk memenuhi persyaratan tugas berikut:

| Persyaratan | Cara Senara memenuhinya |
|---|---|
| Website berbasis layanan cloud, dengan Firebase wajib | Firebase Authentication dan Firebase Realtime Database, ditambah Cloudinary, Gemini API, dan Render |
| Minimal 12 fungsi CRUD (3 Create, 3 Read, 3 Update, 3 Delete) ke Firebase Realtime Database | Senara menjalankan 34 operasi (7 Create, 11 Read, 11 Update, 5 Delete). 12 fungsi utama dan daftar lengkapnya ada di [Rancangan Teknis Bagian 6](../rancangan-teknis.md#6-daftar-lengkap-operasi-crud) |
| Register dan login dengan Firebase Authentication | Registrasi email dan kata sandi, login email, dan Login with Google |
| Web mailer lewat Firebase: email verifikasi setelah register | Email verifikasi dikirim Firebase setelah registrasi; login email hanya bisa setelah email diverifikasi |

## 6. Alur Pengguna Utama

**Pengguna baru**

1. Membuka landing page, membaca tentang Senara dan contoh afirmasi.
2. Mendaftar dengan nama, email, dan kata sandi, lalu diarahkan ke halaman Cek Email.
3. Membuka email, mengklik link verifikasi, lalu diarahkan ke halaman Login.
4. Login dan masuk ke Dashboard.

Alternatif: daftar atau login dengan Google, yang langsung masuk ke Dashboard tanpa verifikasi email.

**Pengguna harian**

1. Login dan membaca afirmasi hari ini di Dashboard, melihat streak dan Kilasan Mingguan.
2. Menulis jurnal hari ini (foto dan/atau catatan).
3. Bercerita ke Nomi bila ingin, atau melakukan Latihan Napas.
4. Sesekali membuka Arsip untuk melihat kembali momen sebelumnya.

## 7. Kebutuhan Fungsional

Setiap fitur ditulis dengan *user story* dan kriteria penerimaan. Kriteria penerimaan adalah syarat yang harus terpenuhi agar fitur dianggap selesai.

### 7.1 Landing Page

**User story:** Sebagai pengunjung, aku ingin tahu apa itu Senara dan mencobanya dengan mudah, supaya aku bisa memutuskan untuk mendaftar.

**Kriteria penerimaan**

- Slider 4 slide: Tentang Senara, contoh afirmasi harian, perkenalan Nomi, dan ajakan mendaftar.
- Slider bisa digeser dengan panah keyboard, sentuhan, mouse, atau touchpad.
- Contoh afirmasi berganti acak setiap halaman dimuat dan tidak sama dengan yang terakhir tampil. Menu "Afirmasi Harian" di header langsung membuka slide ini.
- Tersedia tombol ke Registrasi dan Login.

### 7.2 Registrasi dan Verifikasi Email

**User story:** Sebagai pengguna baru, aku ingin membuat akun dengan cepat dan aman, supaya jurnal dan ceritaku tersimpan untukku sendiri.

**Kriteria penerimaan**

- Form berisi nama lengkap, email, kata sandi (minimal 6 karakter), dan konfirmasi kata sandi. Kesalahan isian ditampilkan di kolom yang bermasalah sebelum form dikirim.
- Tombol "Login with Google" tersedia sebagai alternatif, dan link "Sudah punya akun? Masuk di sini".
- Setelah daftar, pengguna menerima email verifikasi dan diarahkan ke halaman Cek Email yang menampilkan email tujuan.
- Email verifikasi bisa dikirim ulang dari halaman Cek Email atau Login, dengan jeda 60 detik.
- Setelah link verifikasi diklik, pengguna diarahkan ke halaman Login dengan pesan bahwa email sudah terverifikasi.
- Akun Google dianggap sudah terverifikasi.
- Sapaan di aplikasi hanya memakai nama depan, misalnya "Seno Prasetyo" menjadi "Hi, Seno!".

### 7.3 Login

**User story:** Sebagai pengguna, aku ingin masuk ke akunku dengan mudah, dan kalau salah ketik cukup memperbaiki bagian yang salah saja.

**Kriteria penerimaan**

- Login dengan email dan kata sandi, atau dengan Google.
- Login email hanya berhasil jika email sudah diverifikasi. Jika belum, tampil pesan beserta tombol kirim ulang email verifikasi.
- Akun yang tidak ditemukan dan kata sandi yang salah ditampilkan dengan pesan yang sama, "Email atau kata sandi salah", agar orang lain tidak bisa menebak email mana yang terdaftar.
- Jika login gagal, email yang sudah diketik tetap terisi dan kursor langsung berada di kolom yang perlu diperbaiki. Kata sandi selalu dikosongkan.
- Pesan khusus untuk format email salah, terlalu banyak percobaan, dan gangguan server.
- Semua halaman setelah login hanya bisa dibuka oleh pengguna yang sudah login; pengunjung lain diarahkan ke Login.

### 7.4 Dashboard

**User story:** Sebagai pengguna, aku ingin satu halaman yang menyapaku dan menunjukkan perkembanganku, supaya aku semangat merawat diri hari ini.

**Kriteria penerimaan**

- **Sapaan** dengan nama depan pengguna.
- **Afirmasi harian:** satu kalimat acak dari 365 afirmasi, ditulis miring tanpa tanda kutip, tidak sama dengan yang terakhir tampil. Bisa dibagikan lewat menu bagikan perangkat atau disalin.
- **Streak:** jumlah hari berturut-turut menulis jurnal. Jika hari ini belum menulis, streak belum putus sampai hari berakhir.
- **Status 7 hari minggu ini (Minggu sampai Sabtu):** setiap hari ditandai sudah menulis, terlewat, hari ini belum menulis, atau belum tiba. Hari yang belum tiba tampil pudar.
- **Kilasan Mingguanmu Bersama Nomi:**
  - Berisi rangkuman 2–3 kalimat dan maksimal 3 tema dari chat dengan Nomi minggu lalu (Minggu sampai Sabtu).
  - Tampil mulai Senin dan tidak berubah sampai Senin berikutnya.
  - Jika chat minggu lalu kurang dari 5 pesan, kartu mengajak pengguna ngobrol dengan Nomi.
  - Rangkuman tidak mendiagnosis dan tidak mengutip pesan. Bila ada tanda ingin menyakiti diri, rangkuman tidak mengulang detailnya dan mengajak menghubungi SEJIWA 119 ext. 8.
  - Kartu dimuat terpisah sehingga afirmasi dan streak tidak ikut menunggu.

### 7.5 Chat dengan Nomi

**User story:** Sebagai pengguna, aku ingin bercerita ke teman yang mendengarkan tanpa menghakimi, kapan pun aku butuh.

**Kriteria penerimaan**

- Pengguna mengirim pesan (maksimal 1.000 karakter) dan Nomi membalas dalam bahasa Indonesia santai.
- Gaya Nomi mengikuti Bagian 9.1: seperti teman dekat, singkat, dan tidak berlebihan.
- Riwayat chat tersimpan. Saat dibuka, tampil pesan 3 hari terakhir (minimal 20 pesan); pesan yang lebih lama dimuat saat menggulir ke atas.
- Pengguna bisa menghapus satu pesan atau membersihkan seluruh riwayat. Membersihkan riwayat juga menghapus Kilasan Mingguan.
- Jika Nomi tidak bisa membalas (misalnya kuota habis), pengguna mendapat pesan yang jelas dan pesannya tetap tersimpan.
- Batas pemakaian per pengguna: maksimal 100 balasan Nomi per hari, dengan jeda singkat antar pesan.
- **Latihan Napas:** dibuka dari menu opsi chat. Setelah ajakan bersiap 4 detik, lingkaran animasi memandu napas berulang (Tarik Napas, Tahan Sejenak, Hembuskan Perlahan, Rileks), masing-masing 3 detik, sampai pengguna menekan Selesai. Berjalan sepenuhnya di perangkat pengguna.

### 7.6 Journaling

**User story:** Sebagai pengguna, aku ingin mengabadikan momen hari ini dengan foto atau beberapa kalimat, tanpa ribet.

**Kriteria penerimaan**

- Form berisi tanggal, foto, dan catatan (maksimal 2.000 karakter). Minimal salah satu dari foto atau catatan harus diisi.
- Satu tanggal hanya punya satu jurnal. Jika tanggal yang dipilih sudah punya jurnal, form otomatis masuk mode Edit.
- **Jurnal baru hanya bisa ditulis untuk hari ini, kemarin, dan 2 hari lalu**, supaya streak tidak bisa diisi mundur. Tersedia tombol cepat "Hari Ini", "Kemarin", dan "2 Hari Lalu".
- Jurnal lama yang sudah ada tetap bisa diedit dan dihapus.
- Tanggal yang belum terjadi tidak bisa dipilih.
- Foto dikompres otomatis sebelum diunggah, sehingga foto HP sekitar 5 MB turun ke kisaran 200–400 KB tanpa langkah tambahan dari pengguna. File di atas 10 MB ditolak.
- Foto bisa diganti atau dihapus dari jurnal tanpa menghapus jurnalnya.
- Menghapus jurnal meminta konfirmasi dan menghapus fotonya juga.

### 7.7 Arsip

**User story:** Sebagai pengguna, aku ingin melihat kembali momen-momenku per tanggal, seperti membuka album.

**Kriteria penerimaan**

- Kalender bulanan dengan penanda di tanggal yang punya jurnal. Pengguna bisa berpindah bulan.
- Ringkasan bulan: jumlah momen dan persentase konsistensi.
- Klik tanggal menampilkan detail jurnal bergaya kartu postingan (foto di atas, catatan di bawah), dengan tombol Edit dan Hapus.
- Jika tanggal yang diklik belum punya jurnal:
  - Dalam 3 hari terakhir: ajakan menulis jurnal untuk tanggal itu.
  - Lebih lama dari itu: keterangan bahwa jurnal baru hanya bisa ditulis sampai 2 hari sebelumnya, tanpa tombol menulis.
  - Tanggal yang belum tiba: keterangan bahwa tanggal itu belum tiba.

### 7.8 Profil dan Akun

**User story:** Sebagai pengguna, aku ingin mengatur data diriku dan punya kendali penuh atas akun dan dataku.

**Kriteria penerimaan**

| Bagian | Kriteria |
|---|---|
| Nama lengkap | Bisa diubah (maksimal 40 karakter). |
| Bio | Bisa diubah langsung di banner profil (maksimal 160 karakter). Simpan dengan Enter atau tombol Simpan, batalkan dengan Esc atau tombol Batal. |
| Foto profil | Bisa diganti (dipotong persegi) atau dihapus sehingga avatar kembali menampilkan inisial. |
| Email | Ditampilkan beserta status Terverifikasi. Akun email dan kata sandi bisa menggantinya: email baru berlaku setelah link verifikasi di email baru diklik, dan selama menunggu tampil "Menunggu verifikasi {email baru}". Akun Google ditandai ikon gembok dan tidak bisa mengganti email. |
| Tanggal bergabung | Ditampilkan, tidak bisa diubah. Contoh: "Bagian dari Senara sejak 28 September 2026". |
| Statistik | Menampilkan streak refleksi. |
| Ubah kata sandi | Mengirim link reset kata sandi ke email akun. Hanya untuk akun email dan kata sandi. |
| Logout | Keluar dari sesi. |
| Hapus akun | Menghapus profil, jurnal, chat, rangkuman, foto, dan akun secara permanen. Wajib konfirmasi kata sandi, atau login Google ulang untuk akun Google. |

### 7.9 Navigasi

- **Desktop dan tablet (lebar 768 px ke atas):** sidebar kiri berisi Beranda, Nomi (Chat), Journaling, dan Arsip. Profil dibuka lewat kartu nama pengguna di kiri bawah sidebar.
- **HP (di bawah 768 px):** bottom nav dengan label pendek Beranda, Nomi, Journal, Arsip, dan Profil.
- Menu hanya berupa teks, tanpa emoji atau ikon.

## 8. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Privasi** | Jurnal dan chat hanya bisa dilihat pemiliknya. Pengguna bisa menghapus pesan, riwayat chat, jurnal, dan seluruh akunnya kapan saja, dan data yang dihapus benar-benar hilang. |
| **Keamanan** | Kunci rahasia layanan (Firebase, Gemini, Cloudinary) tidak pernah dikirim ke browser. Aksi sensitif (ganti email, hapus akun) meminta konfirmasi ulang. Login tidak membocorkan email mana yang terdaftar. |
| **Performa** | Halaman utama tampil tanpa menunggu bagian yang lambat (misalnya Kilasan Mingguan dimuat terpisah). Foto dikompres agar unggah dan tampil cepat. Riwayat chat dimuat bertahap. |
| **Responsif** | Semua halaman bisa dipakai dengan nyaman di HP (lebar sekitar 360 px) sampai desktop, tanpa geser horizontal. |
| **Aksesibilitas** | Bisa dipakai dengan keyboard (termasuk slider landing page), elemen interaktif punya label, dan pesan error ditampilkan di dekat kolom yang bermasalah. |
| **Bahasa** | Seluruh antarmuka dan Nomi memakai bahasa Indonesia. Waktu dan tanggal mengikuti WIB. |
| **Ketersediaan** | Website bisa diakses publik lewat Render. Server paket gratis bisa lambat beberapa detik saat pertama dibuka setelah lama tidak dipakai; ini diterima untuk lingkup tugas. |
| **Biaya** | Seluruh layanan memakai paket gratis. |

## 9. Nada dan Konten

### 9.1 Nomi

- Bicara seperti **teman dekat yang peduli**, bukan konselor atau customer service. Memakai "aku" dan "kamu" serta kata obrolan sehari-hari ("wah", "ga", "udah").
- Panjang balasan mengikuti pesan pengguna: pesan santai dibalas singkat (1–2 kalimat), cerita yang berat paling banyak sekitar 60 kata.
- Menanggapi isi cerita secara langsung, tidak selalu bertanya, dan tidak memberi saran kecuali diminta atau jelas dibutuhkan.
- **Hindari:** kalimat klise seperti "perasaanmu valid" atau "peluk virtual", menjelaskan niatnya sendiri, bahasa formal atau dramatis, dan emoji berlebihan.
- **Contoh nada yang diharapkan:**
  - Pengguna: "udah mendingan sih, kemarin sempet sakit"
  - Nomi: "Wah, kamu sakit apa kemarin? Sekarang udah enakan belum?"
- **Batasan keamanan:** Nomi bukan psikolog, tidak memberi diagnosis atau saran obat, dan menolak dengan sopan permintaan di luar peran teman bicara. Bila pengguna menyebut ingin menyakiti diri atau dalam bahaya, Nomi menanggapi dengan sungguh-sungguh dan mengarahkan ke orang terpercaya, layanan kesehatan jiwa **SEJIWA 119 ext. 8**, atau layanan darurat **112**.

### 9.2 Afirmasi

365 kalimat afirmasi berbahasa Indonesia, positif dan tidak menggurui, satu ditampilkan acak setiap halaman dimuat. Afirmasi hanya untuk dibaca dan dibagikan, tidak disimpan ke akun pengguna.

## 10. Batasan dan Asumsi

- Dikerjakan oleh 2 orang dengan deadline 20 Oktober 2026.
- Firebase wajib dipakai (persyaratan tugas). Layanan lain dipilih yang punya paket gratis tanpa kartu kredit.
- Pengguna diasumsikan memakai browser modern di HP atau laptop dan terhubung ke internet.
- Kuota gratis Gemini dan layanan lain cukup untuk jumlah pengguna selama penilaian tugas.
- Email verifikasi bisa masuk ke folder spam; pengguna diingatkan di halaman Cek Email.

## 11. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Pengguna dalam kondisi krisis bercerita ke Nomi | Tinggi | Nomi dan Kilasan Mingguan diarahkan untuk merujuk ke SEJIWA 119 ext. 8 dan 112; ruang lingkup menegaskan Nomi bukan layanan konseling. |
| Kuota gratis Gemini habis | Nomi tidak bisa membalas | Batas 100 balasan per pengguna per hari, jeda antar pesan, konteks dan output dibatasi, rangkuman maksimal sekali seminggu, dan pesan yang jelas saat Nomi tidak bisa membalas. |
| Kebocoran data pribadi (jurnal, curhat) | Tinggi | Database tidak bisa diakses langsung dari browser; setiap permintaan dibatasi ke data milik pengguna yang login; kunci rahasia hanya di server. |
| Server gratis lambat setelah lama tidak dipakai | Kesan pertama buruk | Diterima untuk lingkup tugas; dibuka sekali sebelum demo. |
| Email verifikasi masuk spam | Pengguna tidak bisa login | Pengingat di halaman Cek Email dan tombol kirim ulang. |
| Streak dicurangi dengan mengisi tanggal lama | Streak tidak bermakna | Jurnal baru dibatasi hari ini sampai 2 hari sebelumnya. |
