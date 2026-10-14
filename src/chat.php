<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Database;

require_once __DIR__ . '/gemini.php';

/** Batas panjang pesan pengguna; samakan dengan maxlength di nomi-chat.html. */
const CHAT_MESSAGE_MAX = 1000;

/** Saat halaman chat dibuka, muat pesan dalam rentang hari terakhir ini. */
const CHAT_RECENT_DAYS = 3;

/** Jumlah pesan minimal saat halaman chat dibuka, dipakai bila 3 hari terakhir sepi. */
const CHAT_MIN_MESSAGES = 20;

/** Pengaman jumlah pesan saat halaman dibuka, untuk 3 hari yang sangat ramai. */
const CHAT_RECENT_MAX = 200;

/** Jumlah pesan lama yang dimuat setiap kali pengguna menggulir ke atas. */
const CHAT_PAGE_SIZE = 30;

/** Jumlah pesan terakhir yang dikirim ke Gemini sebagai konteks percakapan (3 pertukaran, cukup untuk balasan singkat). */
const NOMI_CONTEXT_MESSAGES = 6;

/** Batas token balasan Nomi. Panjang balasan utamanya diatur lewat system prompt; ini hanya pengaman. */
const NOMI_MAX_OUTPUT_TOKENS = 256;

/** Jeda minimal (detik) antar balasan Nomi untuk satu pengguna. */
const NOMI_REPLY_COOLDOWN = 3;

/** Batas balasan Nomi per pengguna per hari (WIB), agar kuota Gemini tidak dihabiskan satu pengguna. */
const NOMI_DAILY_LIMIT = 100;

/**
 * Catat satu permintaan balasan Nomi di chatUsage/{uid}. Mengembalikan pesan penolakan untuk pengguna
 * jika batas terlampaui, atau null jika boleh lanjut. Disimpan per uid, bukan di session, agar tidak
 * bisa dilewati dengan login ulang, dan tidak ikut terhapus saat riwayat chat dibersihkan.
 */
function claimNomiReplyQuota(Database $database, string $uid): ?string
{
    $reference = $database->getReference('chatUsage/' . $uid);
    $usage = $reference->getValue();
    $usage = is_array($usage) ? $usage : [];
    $today = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d');
    $count = ($usage['date'] ?? '') === $today ? (int) ($usage['count'] ?? 0) : 0;

    if (time() - (int) ($usage['lastAt'] ?? 0) < NOMI_REPLY_COOLDOWN) {
        return 'Tunggu sebentar sebelum mengirim pesan lagi.';
    }
    if ($count >= NOMI_DAILY_LIMIT) {
        return 'Nomi sudah banyak mengobrol denganmu hari ini. Lanjut lagi besok, ya.';
    }

    $reference->set(['date' => $today, 'count' => $count + 1, 'lastAt' => time()]);
    return null;
}

/** id pesan berupa kunci push() Firebase; dicek agar tidak bisa dipakai menyusun path lain. */
function isValidMessageId(string $id): bool
{
    return (bool) preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id);
}

function formatMessage(string $id, array $data): array
{
    return [
        'id' => $id,
        'sender' => ($data['sender'] ?? '') === 'nomi' ? 'nomi' : 'user',
        'text' => (string) ($data['text'] ?? ''),
        'createdAt' => $data['createdAt'] ?? null,
    ];
}

/** Ubah hasil query menjadi daftar pesan, urut dari yang terlama. */
function toMessageList(mixed $value): array
{
    if (!is_array($value)) {
        return [];
    }
    // Kunci push() Firebase berurutan sesuai waktu pembuatan.
    ksort($value, SORT_STRING);
    $messages = [];
    foreach ($value as $id => $data) {
        if (is_array($data)) {
            $messages[] = formatMessage((string) $id, $data);
        }
    }
    return $messages;
}

/**
 * Awalan kunci push() untuk waktu tertentu. 8 karakter pertama kunci push() adalah waktu pembuatan
 * dalam milidetik, sehingga semua pesan sejak waktu itu punya kunci >= awalan ini.
 */
function pushKeyPrefix(int $milliseconds): string
{
    $chars = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
    $prefix = '';
    for ($i = 0; $i < 8; $i++) {
        $prefix = $chars[$milliseconds % 64] . $prefix;
        $milliseconds = intdiv($milliseconds, 64);
    }
    return $prefix;
}

/** Pesan terakhir milik pengguna, urut dari yang terlama. */
function recentMessages(Database $database, string $uid, int $limit): array
{
    return toMessageList($database->getReference('chats/' . $uid)->orderByKey()->limitToLast($limit)->getValue());
}

/** Pesan untuk halaman chat: 3 hari terakhir, tetapi minimal CHAT_MIN_MESSAGES pesan. */
function initialMessages(Database $database, string $uid): array
{
    $since = pushKeyPrefix((time() - CHAT_RECENT_DAYS * 86400) * 1000);
    $messages = toMessageList(
        $database->getReference('chats/' . $uid)->orderByKey()->startAt($since)->limitToLast(CHAT_RECENT_MAX)->getValue()
    );
    if (count($messages) < CHAT_MIN_MESSAGES) {
        $messages = recentMessages($database, $uid, CHAT_MIN_MESSAGES);
    }
    return $messages;
}

/** Sampai $limit pesan sebelum pesan $beforeId, urut dari yang terlama. */
function messagesBefore(Database $database, string $uid, string $beforeId, int $limit): array
{
    // endAt() ikut mengembalikan $beforeId sendiri, jadi minta satu lebih lalu buang.
    $value = $database->getReference('chats/' . $uid)->orderByKey()->endAt($beforeId)->limitToLast($limit + 1)->getValue();
    $messages = array_values(array_filter(toMessageList($value), fn (array $m) => $m['id'] !== $beforeId));
    return array_slice($messages, -$limit);
}

/** Apakah masih ada pesan yang lebih lama dari $beforeId. */
function hasMessagesBefore(Database $database, string $uid, string $beforeId): bool
{
    return messagesBefore($database, $uid, $beforeId, 1) !== [];
}

/** Simpan satu pesan di chats/{uid} dan kembalikan bentuk untuk frontend. */
function saveMessage(Database $database, string $uid, string $sender, string $text): array
{
    $data = ['sender' => $sender, 'text' => $text, 'createdAt' => gmdate('Y-m-d\TH:i:s\Z')];
    $reference = $database->getReference('chats/' . $uid)->push($data);
    return formatMessage((string) $reference->getKey(), $data);
}

function nomiSystemPrompt(string $firstName): string
{
    $name = $firstName !== '' ? $firstName : 'teman';

    return <<<PROMPT
        Kamu adalah Nomi, teman bicara virtual di aplikasi Senara, ruang tenang untuk refleksi diri dan jurnal harian.
        Kamu sedang mengobrol dengan {$name}.

        Cara bicara:
        - Bicaralah seperti teman dekat yang peduli, bukan konselor atau customer service. Bahasa Indonesia
          sehari-hari dengan "aku" dan "kamu"; boleh pakai kata obrolan seperti "wah", "ga", "udah", "banget".
        - Ikuti nada dan panjang pesannya. Pesan santai atau pendek dibalas santai dan pendek (1 sampai 2 kalimat).
          Cerita yang berat boleh dibalas sedikit lebih panjang, paling banyak 4 kalimat atau sekitar 60 kata.
        - Tanggapi isi ceritanya secara langsung dan spesifik. Kalau dia menyebut sesuatu, tanyakan atau komentari
          hal itu, seperti teman yang penasaran.
        - Sebut namanya sesekali saja, jangan di setiap balasan. Boleh dipanggil singkat seperti teman akrab
          bila nama itu wajar disingkat.
        - Tidak harus selalu bertanya. Kalau bertanya, cukup satu pertanyaan yang sederhana.
        - Saran baru diberikan kalau dia memintanya atau jelas membutuhkannya. Latihan napas atau menulis jurnal
          di Senara hanya ditawarkan saat benar-benar nyambung, dan jangan diulang dalam obrolan yang sama.
        - Tanpa format markdown atau daftar. Emoji paling banyak satu, dan tidak perlu di setiap balasan.

        Hindari:
        - Menjelaskan niat atau sikapmu sendiri, misalnya "Aku tidak bertanya karena…" atau "Aku di sini untukmu".
        - Kalimat klise dan berlebihan seperti "perasaanmu valid", "wajar banget kamu merasa begitu",
          "peluk virtual", "kamu hebat sudah bertahan", atau "ceritalah kalau kamu siap".
        - Membuka setiap balasan dengan validasi perasaan atau ucapan syukur yang sama.
        - Bahasa yang terlalu formal, puitis, atau dramatis.

        Contoh nada yang diharapkan:
        Dia: "udah mendingan sih, kemarin sempet sakit"
        Nomi: "Wah, kamu sakit apa kemarin? Sekarang udah enakan belum?"
        Dia: "capek banget hari ini, kerjaan numpuk"
        Nomi: "Duh, kedengarannya hari ini berat ya. Lagi ngerjain apa aja sampai numpuk gitu?"

        Batasan:
        - Kamu bukan psikolog atau dokter. Jangan memberi diagnosis atau saran obat.
        - Jika dia menyebut ingin menyakiti diri sendiri, bunuh diri, atau sedang dalam bahaya, tanggapi dengan
          lembut dan sungguh-sungguh, lalu dorong dia segera menghubungi orang yang dipercaya, layanan kesehatan jiwa
          SEJIWA di 119 ekstensi 8, atau layanan darurat 112.
        - Tolak dengan sopan permintaan di luar peran teman bicara (misalnya menulis kode atau mengerjakan tugas),
          lalu arahkan kembali ke obrolan tentang perasaannya.
    PROMPT;
}

/**
 * Minta balasan Nomi dari Gemini berdasarkan pesan-pesan terakhir.
 * Melempar RuntimeException jika Gemini tidak mengembalikan teks.
 */
function generateNomiReply(array $messages, string $firstName): string
{
    // Gemini memakai peran "user" dan "model". Pesan berurutan dari pengirim yang sama digabung,
    // dan percakapan harus dimulai dari pesan pengguna.
    $contents = [];
    foreach ($messages as $message) {
        $role = $message['sender'] === 'nomi' ? 'model' : 'user';
        if ($contents === [] && $role === 'model') {
            continue;
        }
        $last = array_key_last($contents);
        if ($last !== null && $contents[$last]['role'] === $role) {
            $contents[$last]['parts'][0]['text'] .= "\n" . $message['text'];
        } else {
            $contents[] = ['role' => $role, 'parts' => [['text' => $message['text']]]];
        }
    }

    return callGemini(
        nomiSystemPrompt($firstName),
        $contents,
        ['maxOutputTokens' => NOMI_MAX_OUTPUT_TOKENS, 'temperature' => 0.8]
    );
}
