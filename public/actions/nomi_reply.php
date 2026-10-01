<?php
/**
 * Membuat balasan Nomi (Gemini) untuk pesan terakhir pengguna, lalu menyimpannya di riwayat chat.
 */
declare(strict_types=1);

use GuzzleHttp\Exception\BadResponseException;

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/chat.php';

try {
    $messages = recentMessages($database, $uid, NOMI_CONTEXT_MESSAGES);
    $lastMessage = end($messages);
    if ($lastMessage === false || $lastMessage['sender'] !== 'user') {
        jsonResponse(['success' => false, 'message' => 'Belum ada pesan baru untuk dibalas.'], 400);
    }

    $name = $database->getReference('users/' . $uid . '/name')->getValue();
    $firstName = is_string($name) ? (explode(' ', trim($name))[0] ?? '') : '';
} catch (Throwable $error) {
    error_log('Nomi context read failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Nomi sedang tidak bisa membalas. Coba lagi sebentar.'], 500);
}

try {
    $replyText = generateNomiReply($messages, $firstName);
} catch (BadResponseException $error) {
    error_log('Gemini request failed: ' . $error->getMessage());
    // 429: batas request free tier terlampaui. 503: model Gemini sedang sibuk.
    if (in_array($error->getResponse()->getStatusCode(), [429, 503], true)) {
        jsonResponse(['success' => false, 'message' => 'Maaf, saat ini Nomi sedang tidak dapat membalas pesan kamu, coba lagi sebentar lagi.'], 429);
    }
    jsonResponse(['success' => false, 'message' => 'Nomi sedang tidak bisa membalas. Coba lagi sebentar.'], 502);
} catch (Throwable $error) {
    error_log('Gemini request failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Nomi sedang tidak bisa membalas. Coba lagi sebentar.'], 502);
}

try {
    $reply = saveMessage($database, $uid, 'nomi', $replyText);
} catch (Throwable $error) {
    error_log('Nomi reply save failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Balasan Nomi gagal disimpan. Coba lagi.'], 500);
}

jsonResponse(['success' => true, 'message' => $reply]);
