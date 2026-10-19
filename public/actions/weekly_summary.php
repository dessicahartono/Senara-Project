<?php
/**
 * Rangkuman mingguan chat dengan Nomi untuk dashboard (minggu lalu, Minggu sampai Sabtu WIB; berganti setiap Senin).
 *
 * GET - rangkuman yang tersimpan, atau dibuat lewat Gemini jika minggu itu belum dirangkum.
 *       status "ready" berisi text; "not_enough" jika chat minggu itu terlalu sedikit.
 *       stale = true jika rangkuman minggu ini gagal dibuat dan yang dikirim adalah rangkuman sebelumnya.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode GET.'], 405);
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/summary.php';

try {
    $name = $database->getReference('users/' . $uid . '/name')->getValue();
    $firstName = is_string($name) ? (explode(' ', trim($name))[0] ?? '') : '';
    $summary = weeklySummary($database, $uid, $firstName);
} catch (Throwable $error) {
    error_log('Weekly summary failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Rangkuman mingguan belum bisa dibuat. Coba lagi nanti.'], 502);
}

jsonResponse(['success' => true, 'summary' => $summary]);
