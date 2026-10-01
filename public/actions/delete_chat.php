<?php
/**
 * Menghapus riwayat chat dengan Nomi.
 *
 * POST id=<id pesan> - hapus satu pesan.
 * POST all=1         - bersihkan seluruh riwayat.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/chat.php';

$clearAll = ($_POST['all'] ?? '') === '1';
$id = (string) ($_POST['id'] ?? '');

if (!$clearAll && !isValidMessageId($id)) {
    jsonResponse(['success' => false, 'message' => 'Pesan tidak valid.'], 400);
}

try {
    $path = $clearAll ? 'chats/' . $uid : 'chats/' . $uid . '/' . $id;
    $database->getReference($path)->remove();
} catch (Throwable $error) {
    error_log('Chat delete failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Pesan gagal dihapus. Coba lagi.'], 500);
}

jsonResponse(['success' => true]);
