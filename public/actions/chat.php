<?php
/**
 * Riwayat chat dengan Nomi milik pengguna yang sedang login.
 *
 * GET  - pesan-pesan terakhir, urut dari yang terlama.
 * POST - simpan pesan pengguna (text). Balasan Nomi diminta terpisah lewat nomi_reply.php.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/chat.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $messages = recentMessages($database, $uid, CHAT_HISTORY_LIMIT);
    } catch (Throwable $error) {
        error_log('Chat read failed: ' . $error->getMessage());
        jsonResponse(['success' => false, 'message' => 'Riwayat chat gagal dimuat.'], 500);
    }
    jsonResponse(['success' => true, 'messages' => $messages]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    jsonResponse(['success' => false, 'message' => 'Metode tidak didukung.'], 405);
}

$text = trim((string) ($_POST['text'] ?? ''));
if ($text === '') {
    jsonResponse(['success' => false, 'message' => 'Pesan tidak boleh kosong.'], 400);
}
if (mb_strlen($text) > CHAT_MESSAGE_MAX) {
    jsonResponse(['success' => false, 'message' => 'Pesan maksimal ' . CHAT_MESSAGE_MAX . ' karakter.'], 400);
}

try {
    $message = saveMessage($database, $uid, 'user', $text);
} catch (Throwable $error) {
    error_log('Chat save failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Pesan gagal dikirim. Coba lagi.'], 500);
}

jsonResponse(['success' => true, 'message' => $message]);
