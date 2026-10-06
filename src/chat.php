<?php
declare(strict_types=1);

use GuzzleHttp\Client;
use Kreait\Firebase\Contract\Database;

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

/** Jumlah pesan terakhir yang dikirim ke Gemini sebagai konteks percakapan. */
const NOMI_CONTEXT_MESSAGES = 10;

/** Batas token balasan Nomi. Panjang balasan utamanya diatur lewat system prompt; ini hanya pengaman. */
const NOMI_MAX_OUTPUT_TOKENS = 256;

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
        - Hangat, ramah, empatik, dan menenangkan. Gunakan bahasa Indonesia santai dengan "aku" dan "kamu".
        - Jawab singkat: 2 sampai 4 kalimat, paling banyak sekitar 60 kata.
        - Dengarkan dulu. Validasi perasaannya sebelum memberi saran, dan jangan menggurui.
        - Ajukan paling banyak satu pertanyaan lembut untuk membantu dia bercerita.
        - Bila cocok, tawarkan hal sederhana seperti latihan napas atau menuliskan perasaan di jurnal Senara.
        - Jangan memakai format markdown, daftar, atau emoji berlebihan.

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
    $apiKey = getenv('GEMINI_API_KEY'); 
    if (empty($apiKey)) { 
        $geminiFile = __DIR__ . '/../gemini_config.php'; 
        if (is_file($geminiFile)) { 
            $local = require $geminiFile; 
            if (is_array($local) && !empty($local['api_key'])) { 
                $apiKey = $local['api_key']; 
            } 
        } 
    } 
    if (empty($apiKey)) { 
        throw new RuntimeException('GEMINI_API_KEY belum diisi. Set env GEMINI_API_KEY di Render atau isi gemini_config.php lokal.'); // CHANGED: pesan menyebut dua sumber. WHY: user tahu harus set di mana.
    } 

    $model = getenv('GEMINI_MODEL'); 
    if (empty($model)) { 
        $geminiFile = __DIR__ . '/../gemini_config.php'; 
        if (is_file($geminiFile)) { 
            $localModel = require $geminiFile; 
            if (is_array($localModel) && !empty($localModel['model'])) { 
                $model = $localModel['model']; 
            } 
        } 
    } 
    if (empty($model)) { 
        $model = 'gemini-3.5-flash-lite'; 
    }

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

    $generationConfig = ['maxOutputTokens' => NOMI_MAX_OUTPUT_TOKENS, 'temperature' => 0.8];
    // Gemini 2.5 Flash menghitung token "thinking" ke dalam maxOutputTokens; dimatikan agar balasan tidak terpotong.
    if (str_contains($model, '2.5-flash')) {
        $generationConfig['thinkingConfig'] = ['thinkingBudget' => 0];
    }

    $response = (new Client(['timeout' => 30]))->post(
        'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent',
        [
            'headers' => ['x-goog-api-key' => $apiKey],
            'json' => [
                'system_instruction' => ['parts' => [['text' => nomiSystemPrompt($firstName)]]],
                'contents' => $contents,
                'generationConfig' => $generationConfig,
            ],
        ]
    );

    $result = json_decode((string) $response->getBody(), true);
    $text = '';
    foreach ($result['candidates'][0]['content']['parts'] ?? [] as $part) {
        $text .= $part['text'] ?? '';
    }
    $text = trim($text);

    if ($text === '') {
        $reason = $result['candidates'][0]['finishReason'] ?? $result['promptFeedback']['blockReason'] ?? 'unknown';
        throw new RuntimeException('Gemini tidak mengembalikan teks (' . $reason . ').');
    }
    return $text;
}