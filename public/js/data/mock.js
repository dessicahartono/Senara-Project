/**
 * Data contoh untuk tahap UI.
 * HANYA boleh di-import oleh file di js/services/. Halaman tidak boleh
 * mengakses file ini langsung, supaya nanti cukup services yang diganti Firebase.
 *
 * Tanggal dibuat relatif terhadap hari ini agar kalender & streak selalu terlihat hidup.
 */

const today = new Date();

/** Tanggal ISO (YYYY-MM-DD) n hari sebelum hari ini. */
function daysAgo(n) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Timestamp ISO n hari lalu pada jam tertentu. */
function stamp(n, hh, mm) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

const IMG = "assets/images/mock/";

export const affirmations = [
  {
    id: "af_01",
    text: "Setiap hembusan napas adalah ruang untuk melepaskan yang berat, dan menerima ketenangan baru. Kamu sudah melangkah sejauh ini dengan baik.",
  },
  {
    id: "af_02",
    text: "Kamu tidak harus menyelesaikan semuanya hari ini. Satu langkah kecil pun tetap sebuah langkah.",
  },
  {
    id: "af_03",
    text: "Perasaanmu valid. Beri dirimu izin untuk merasakan, lalu biarkan ia berlalu dengan lembut.",
  },
  {
    id: "af_04",
    text: "Istirahat bukan kemunduran. Tubuh dan pikiranmu layak mendapatkan jeda yang tenang.",
  },
  {
    id: "af_05",
    text: "Hari ini kamu cukup. Tidak perlu sempurna untuk menjadi berharga.",
  },
  {
    id: "af_06",
    text: "Seperti bulan yang tetap bersinar meski tak selalu penuh, kamu tetap berarti di setiap fasemu.",
  },
  {
    id: "af_07",
    text: "Kebaikan kecil yang kamu berikan pada dirimu hari ini akan tumbuh menjadi ketenangan esok hari.",
  },
];

export const journalPrompts = [
  "Apa satu hal kecil yang membuatmu tersenyum hari ini?",
  "Momen apa yang ingin kamu ingat dari minggu ini?",
  "Apa yang sedang kamu syukuri saat ini, sekecil apa pun?",
  "Jika hatimu bisa bicara, apa yang ingin ia sampaikan hari ini?",
  "Hal apa yang ingin kamu lepaskan sebelum tidur malam ini?",
];

export const journals = [
  {
    id: "jr_01",
    date: daysAgo(1),
    note: "Duduk di beranda belakang ditemani secangkir teh hangat dan kicau burung pagi. Pikiran perlahan terasa hening dan damai setelah seminggu yang cukup padat.",
    photoUrl: IMG + "journal-teh-pagi.jpg",
    photoName: "teh_pagi.jpg",
    createdAt: stamp(1, 8, 30),
    updatedAt: stamp(1, 8, 30),
  },
  {
    id: "jr_02",
    date: daysAgo(2),
    note: "Pagi di balkon dengan buku catatan yang masih kosong. Aku menulis tiga hal yang kusyukuri dan rasanya dada jadi lebih lapang.",
    photoUrl: IMG + "journal-balkon.jpg",
    photoName: "pagi_di_balkon.jpg",
    createdAt: stamp(2, 9, 15),
    updatedAt: stamp(2, 9, 15),
  },
  {
    id: "jr_03",
    date: daysAgo(3),
    note: "Hari yang melelahkan di kantor, tapi sore tadi sempat jalan kaki sebentar di taman. Angin sorenya menenangkan.",
    photoUrl: null,
    photoName: null,
    createdAt: stamp(3, 19, 40),
    updatedAt: stamp(3, 19, 40),
  },
  {
    id: "jr_04",
    date: daysAgo(4),
    note: "Mencoba latihan napas 4-7-8 sebelum tidur. Belum terbiasa, tapi tidurku lebih nyenyak dari biasanya.",
    photoUrl: null,
    photoName: null,
    createdAt: stamp(4, 22, 5),
    updatedAt: stamp(4, 22, 5),
  },
  {
    id: "jr_05",
    date: daysAgo(6),
    note: "Makan siang bersama teman lama. Banyak tertawa, dan aku sadar betapa aku merindukan obrolan seperti ini.",
    photoUrl: IMG + "journal-balkon.jpg",
    photoName: "makan_siang.jpg",
    createdAt: stamp(6, 13, 20),
    updatedAt: stamp(6, 13, 20),
  },
  {
    id: "jr_06",
    date: daysAgo(9),
    note: "Hujan turun sejak siang. Aku menyeduh cokelat panas dan membaca novel yang lama tertunda.",
    photoUrl: null,
    photoName: null,
    createdAt: stamp(9, 16, 0),
    updatedAt: stamp(9, 16, 0),
  },
  {
    id: "jr_07",
    date: daysAgo(12),
    note: "Merasa cemas soal presentasi besok. Menuliskannya di sini membuatku sedikit lebih tenang.",
    photoUrl: null,
    photoName: null,
    createdAt: stamp(12, 21, 10),
    updatedAt: stamp(12, 21, 10),
  },
  {
    id: "jr_08",
    date: daysAgo(15),
    note: "Menanam bibit kemangi di pot kecil. Semoga tumbuh subur, sama seperti niat baikku minggu ini.",
    photoUrl: IMG + "journal-teh-pagi.jpg",
    photoName: "kemangi.jpg",
    createdAt: stamp(15, 7, 45),
    updatedAt: stamp(15, 7, 45),
  },
  {
    id: "jr_09",
    date: daysAgo(21),
    note: "Hari biasa, tapi aku berhasil menyelesaikan semua daftar tugas. Bangga pada diri sendiri.",
    photoUrl: null,
    photoName: null,
    createdAt: stamp(21, 20, 30),
    updatedAt: stamp(21, 20, 30),
  },
  {
    id: "jr_10",
    date: daysAgo(27),
    note: "Menonton matahari terbenam dari atap rumah. Langitnya jingga keunguan, persis warna yang menenangkan.",
    photoUrl: IMG + "journal-balkon.jpg",
    photoName: "senja.jpg",
    createdAt: stamp(27, 17, 50),
    updatedAt: stamp(27, 17, 50),
  },
];

/** Hari berturut-turut sebelum hari ini yang dianggap sudah check-in (untuk streak). */
export const streakDays = [1, 2, 3, 4, 5, 6, 7].map(daysAgo);

export const chatMessages = [
  {
    id: "msg_01",
    sender: "nomi",
    text: "Halo Seno, selamat datang kembali di ruang teduh ini. Bagaimana harimu terasa sejauh ini? Bila ada yang mengganjal atau ingin kamu ceritakan perlahan, aku ada di sini untuk mendengarkan tanpa tergesa-gesa.",
    createdAt: stamp(0, 8, 15),
  },
  {
    id: "msg_02",
    sender: "user",
    text: "Hai Nomi, pagi ini kepalaku terasa agak penuh dengan pekerjaan dan ekspektasi. Rasanya butuh jeda sebentar untuk bernapas.",
    createdAt: stamp(0, 8, 18),
  },
  {
    id: "msg_03",
    sender: "nomi",
    text: "Terima kasih sudah membagikannya padaku. Tarik napasmu perlahan, Seno... Lepaskan bahumu yang tegang. Ingatlah bahwa kamu tidak harus menyelesaikan segalanya dalam satu tarikan napas. Apa satu hal kecil yang paling membebani pundakmu saat ini?",
    createdAt: stamp(0, 8, 19),
  },
];

export const chatQuickPrompts = ["Tenggat waktu pekerjaan", "Rasa cemas berlebih", "Hanya ingin didengar"];

/** Balasan contoh Nomi (dipilih bergiliran oleh chatService). */
export const nomiReplies = [
  "Aku mendengarmu. Tidak apa-apa merasa seperti itu. Mau ceritakan lebih banyak tentang apa yang paling terasa berat?",
  "Terima kasih sudah jujur pada perasaanmu. Coba tarik napas dalam empat hitungan, tahan sebentar, lalu hembuskan perlahan. Bagaimana rasanya sekarang?",
  "Itu terdengar tidak mudah. Kamu sudah melakukan yang terbaik dengan apa yang kamu punya hari ini.",
  "Aku senang kamu mau berbagi. Apa satu hal kecil yang bisa membuatmu merasa sedikit lebih nyaman malam ini?",
  "Perasaanmu penting. Kalau kamu mau, kita bisa menuliskannya di jurnal agar pikiranmu terasa lebih lapang.",
];
