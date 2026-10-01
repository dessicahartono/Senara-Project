<?php
/**
 * Satu afirmasi acak dari affirmations/{1..365}.
 *
 * GET ?exclude=n - nomor afirmasi yang terakhir tampil, agar tidak muncul dua kali berturut-turut.
 *
 * Tidak memerlukan login karena afirmasi juga ditampilkan di landing page.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';
require_once __DIR__ . '/../../config/firebase_config.php';

const AFFIRMATION_COUNT = 365;

$exclude = (int) ($_GET['exclude'] ?? 0);

try {
    // Hanya satu node yang dibaca, bukan seluruh 365 kalimat.
    do {
        $number = random_int(1, AFFIRMATION_COUNT);
    } while ($number === $exclude);

    $text = $database->getReference('affirmations/' . $number)->getValue();
} catch (Throwable $error) {
    error_log('Affirmation read failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Afirmasi gagal dimuat.'], 500);
}

if (!is_string($text) || trim($text) === '') {
    error_log('Affirmation missing: affirmations/' . $number);
    jsonResponse(['success' => false, 'message' => 'Afirmasi gagal dimuat.'], 500);
}

jsonResponse(['success' => true, 'affirmation' => ['id' => $number, 'text' => trim($text)]]);
