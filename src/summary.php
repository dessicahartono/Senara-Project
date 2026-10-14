<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Database;

require_once __DIR__ . '/chat.php';

/**
 * Rangkuman mingguan dari chat dengan Nomi, ditampilkan di dashboard.
 *
 * Yang dirangkum adalah minggu kalender sebelumnya (Senin sampai Minggu, WIB). Hasilnya disimpan di
 * summaries/{uid}, sehingga Gemini dipanggil paling banyak sekali per pengguna per minggu.
 */

/** Jumlah pesan pengguna minimal agar rangkuman dibuat. Di bawah ini Gemini tidak dipanggil. */
const SUMMARY_MIN_MESSAGES = 5;

/** Pesan lebih pendek dari ini (misalnya "ok", "hehe") dilewati karena tidak berisi cerita. */
const SUMMARY_MIN_CHARS = 10;

/** Setiap pesan dipotong sampai panjang ini; awal curhatan biasanya sudah menggambarkan isinya. */
const SUMMARY_MESSAGE_MAX_CHARS = 300;

/** Total teks yang dikirim ke Gemini (sekitar 1.500-2.000 token). Jika lebih, pesan terbaru yang diambil. */
const SUMMARY_INPUT_MAX_CHARS = 6000;

/** Batas token rangkuman. Rangkuman biasanya sekitar 150 token; ini hanya pengaman. */
const SUMMARY_MAX_OUTPUT_TOKENS = 300;

/** Jeda (detik) sebelum mencoba lagi setelah Gemini gagal, agar dashboard tidak memanggil Gemini terus-menerus. */
const SUMMARY_RETRY_DELAY = 3600;

const SUMMARY_TIMEZONE = 'Asia/Jakarta';

/** Rentang minggu yang dirangkum: Senin minggu lalu 00:00 sampai Senin minggu ini 00:00 (WIB). */
function summaryWeek(): array
{
    $thisMonday = (new DateTimeImmutable('now', new DateTimeZone(SUMMARY_TIMEZONE)))
        ->modify('monday this week')->setTime(0, 0);
    return ['start' => $thisMonday->modify('-7 days'), 'end' => $thisMonday];
}

/** Nama hari singkat (WIB) dari createdAt pesan, agar Gemini bisa melihat pola sepanjang minggu. */
function summaryDayLabel(?string $createdAt): string
{
    if ($createdAt === null) {
        return '-';
    }
    $date = (new DateTimeImmutable($createdAt))->setTimezone(new DateTimeZone(SUMMARY_TIMEZONE));
    return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][(int) $date->format('w')];
}

/**
 * Pesan pengguna yang dikirim ke Gemini, satu baris per pesan, urut dari yang terlama.
 * Balasan Nomi dan pesan yang sangat pendek dilewati. Jika total melebihi SUMMARY_INPUT_MAX_CHARS,
 * pesan terbaru yang diambil.
 */
function summaryInputLines(array $messages): array
{
    $lines = [];
    $total = 0;
    foreach (array_reverse($messages) as $message) {
        if ($message['sender'] !== 'user') {
            continue;
        }
        $text = trim((string) preg_replace('/\s+/u', ' ', $message['text']));
        if (mb_strlen($text) < SUMMARY_MIN_CHARS) {
            continue;
        }
        if (mb_strlen($text) > SUMMARY_MESSAGE_MAX_CHARS) {
            $text = mb_substr($text, 0, SUMMARY_MESSAGE_MAX_CHARS) . '…';
        }
        $line = summaryDayLabel($message['createdAt']) . ': ' . $text;
        if ($total + mb_strlen($line) > SUMMARY_INPUT_MAX_CHARS) {
            break;
        }
        $lines[] = $line;
        $total += mb_strlen($line) + 1;
    }
    return array_reverse($lines);
}

function summarySystemPrompt(string $firstName): string
{
    $name = $firstName !== '' ? $firstName : 'pengguna';

    return <<<PROMPT
        Rangkum curhatan seminggu {$name} di Senara, aplikasi refleksi diri. Tulis untuk {$name} dengan "kamu",
        hangat dan tidak menghakimi.
        - summary: 2-3 kalimat, maksimal 50 kata, tentang perasaan dan topik yang menonjol. Jangan mengutip pesan
          dan jangan mendiagnosis.
        - themes: maksimal 3 topik, masing-masing 1-3 kata.
        Jika ada tanda ingin menyakiti diri, jangan ulangi detailnya; tambahkan ajakan lembut untuk menghubungi
        orang yang dipercaya atau SEJIWA di 119 ekstensi 8.
    PROMPT;
}

/** Ambil summary dan themes dari jawaban JSON Gemini. Melempar RuntimeException jika tidak valid. */
function parseSummaryResponse(string $text): array
{
    $data = json_decode($text, true);
    $summary = is_array($data) && is_string($data['summary'] ?? null) ? trim($data['summary']) : '';
    if ($summary === '') {
        throw new RuntimeException('Rangkuman dari Gemini tidak valid.');
    }

    $themes = [];
    foreach (is_array($data['themes'] ?? null) ? $data['themes'] : [] as $theme) {
        if (is_string($theme) && trim($theme) !== '') {
            $themes[] = mb_substr(trim($theme), 0, 30);
        }
    }
    return ['text' => $summary, 'themes' => array_slice($themes, 0, 3)];
}

function generateSummaryText(array $lines, string $firstName): array
{
    $text = callGemini(
        summarySystemPrompt($firstName),
        [['role' => 'user', 'parts' => [['text' => implode("\n", $lines)]]]],
        [
            'maxOutputTokens' => SUMMARY_MAX_OUTPUT_TOKENS,
            'temperature' => 0.5,
            'responseMimeType' => 'application/json',
            'responseSchema' => [
                'type' => 'OBJECT',
                'properties' => [
                    'summary' => ['type' => 'STRING'],
                    'themes' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                ],
                'required' => ['summary', 'themes'],
            ],
        ]
    );
    return parseSummaryResponse($text);
}

/** Bentuk rangkuman untuk frontend. */
function formatSummary(array $stored): array
{
    return [
        'status' => $stored['status'] === 'ready' ? 'ready' : 'not_enough',
        'weekStart' => $stored['weekStart'] ?? null,
        'weekEnd' => $stored['weekEnd'] ?? null,
        'text' => $stored['text'] ?? null,
        'themes' => is_array($stored['themes'] ?? null) ? array_values($stored['themes']) : [],
        'messageCount' => (int) ($stored['messageCount'] ?? 0),
    ];
}

/**
 * Rangkuman minggu lalu milik pengguna. Diambil dari summaries/{uid} jika sudah ada untuk minggu itu;
 * jika belum, dibuat dari chat minggu itu lalu disimpan.
 *
 * Jika Gemini gagal, rangkuman minggu sebelumnya dikembalikan dengan stale = true. Jika tidak ada,
 * exception dilempar ulang.
 */
function weeklySummary(Database $database, string $uid, string $firstName): array
{
    $week = summaryWeek();
    $weekStart = $week['start']->format('Y-m-d');
    $reference = $database->getReference('summaries/' . $uid);
    $raw = $reference->getValue();
    $stored = is_array($raw) && isset($raw['status']) ? $raw : null;
    $retryAfter = is_array($raw) ? (int) ($raw['retryAfter'] ?? 0) : 0;

    if ($stored !== null && ($stored['weekStart'] ?? '') === $weekStart) {
        return formatSummary($stored);
    }

    // Masih dalam jeda setelah kegagalan sebelumnya: jangan panggil Gemini, dan jangan perpanjang jedanya.
    if ($retryAfter > time()) {
        if ($stored !== null && $stored['status'] === 'ready') {
            return formatSummary($stored) + ['stale' => true];
        }
        throw new RuntimeException('Menunggu jeda sebelum mencoba Gemini lagi.');
    }

    $record = [
        'weekStart' => $weekStart,
        'weekEnd' => $week['end']->modify('-1 day')->format('Y-m-d'),
        'generatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
    ];

    try {
        $messages = toMessageList(
            $database->getReference('chats/' . $uid)->orderByKey()
                ->startAt(pushKeyPrefix($week['start']->getTimestamp() * 1000))
                ->endAt(pushKeyPrefix($week['end']->getTimestamp() * 1000))
                ->limitToLast(CHAT_RECENT_MAX)->getValue()
        );
        $lines = summaryInputLines($messages);

        if (count($lines) < SUMMARY_MIN_MESSAGES) {
            $record += ['status' => 'not_enough', 'messageCount' => count($lines)];
        } else {
            $record += ['status' => 'ready', 'messageCount' => count($lines)] + generateSummaryText($lines, $firstName);
        }
    } catch (Throwable $error) {
        $reference->update(['retryAfter' => time() + SUMMARY_RETRY_DELAY]);
        if ($stored !== null && $stored['status'] === 'ready') {
            error_log('Weekly summary generation failed, serving previous week: ' . $error->getMessage());
            return formatSummary($stored) + ['stale' => true];
        }
        throw $error;
    }

    // set() menimpa seluruh node, termasuk retryAfter dari kegagalan sebelumnya.
    $reference->set($record);
    return formatSummary($record);
}
