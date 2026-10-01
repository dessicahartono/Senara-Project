<?php
/**
 * Menghapus jurnal pada satu tanggal beserta fotonya.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/journals.php';
require_once __DIR__ . '/../../src/cloudinary.php';

$date = (string) ($_POST['date'] ?? '');
if (!isValidDateKey($date)) {
    jsonResponse(['success' => false, 'message' => 'Format tanggal tidak valid.'], 400);
}

try {
    $existing = $database->getReference('journals/' . $uid . '/' . $date)->getValue();
    if (!is_array($existing)) {
        jsonResponse(['success' => false, 'message' => 'Jurnal tidak ditemukan.'], 404);
    }

    $database->getReference()->update([
        'journals/' . $uid . '/' . $date => null,
        'journalDates/' . $uid . '/' . $date => null,
    ]);
    refreshJournalStats($database, $uid);
} catch (Throwable $error) {
    error_log('Journal delete failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Jurnal gagal dihapus. Coba lagi beberapa saat lagi.'], 500);
}

if (!empty($existing['photoUrl'])) {
    try {
        cloudinaryDestroy(CLOUDINARY_ROOT . '/journals/' . $uid . '/' . $date);
    } catch (Throwable $error) {
        // Jurnal sudah terhapus; foto yang gagal dihapus cukup dicatat.
        error_log('Journal photo delete failed: ' . $error->getMessage());
    }
}

jsonResponse(['success' => true]);
