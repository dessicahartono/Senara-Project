<?php
/**
 * Streak jurnal pengguna yang sedang login: jumlah hari berturut-turut dan status 5 hari terakhir.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/journals.php';

try {
    // Dihitung ulang setiap kali karena streak bisa putus seiring berjalannya hari,
    // sedangkan users/{uid}/stats hanya diperbarui saat jurnal disimpan atau dihapus.
    $streak = computeStreak(journalDates($database, $uid));
} catch (Throwable $error) {
    error_log('Streak read failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Streak gagal dimuat.'], 500);
}

jsonResponse(['success' => true, 'streak' => $streak]);
