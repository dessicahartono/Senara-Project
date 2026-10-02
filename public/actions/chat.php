<?php
/**
 * Riwayat chat dengan Nomi milik pengguna yang sedang login.
 *
 * GET  - pesan 3 hari terakhir (minimal 20), urut dari yang terlama, beserta hasMore.
 *        ?before={id} - pesan-pesan sebelum id itu, untuk dimuat saat pengguna menggulir ke atas.
 * POST - simpan pesan pengguna (text). Balasan Nomi diminta terpisah lewat nomi_reply.php.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/chat.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $before = (string) ($_GET['before'] ?? '');
    if ($before !== '' && !isValidMessageId($before)) {
        jsonResponse(['success' => false, 'message' => 'Pesan tidak valid.'], 400);
    }
    try {
        if ($before === '') {
            $messages = initialMessages($database, $uid);
            $hasMore = $messages !== [] && hasMessagesBefore($database, $uid, $messages[0]['id']);
        } else {
            // Ambil satu lebih untuk tahu apakah masih ada pesan yang lebih lama.
            $messages = messagesBefore($database, $uid, $before, CHAT_PAGE_SIZE + 1);
            $hasMore = count($messages) > CHAT_PAGE_SIZE;
            $messages = array_slice($messages, -CHAT_PAGE_SIZE);
        }
    } catch (Throwable $error) {
        error_log('Chat read failed: ' . $error->getMessage());
        jsonResponse(['success' => false, 'message' => 'Riwayat chat gagal dimuat.'], 500);
    }
    jsonResponse(['success' => true, 'messages' => $messages, 'hasMore' => $hasMore]);
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
