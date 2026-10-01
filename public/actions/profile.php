<?php
/**
 * Profil pengguna yang sedang login.
 *
 * GET  - membaca profil (users/{uid}).
 * POST - memperbarui nama dan bio.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/users.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    jsonResponse(['success' => false, 'message' => 'Metode tidak didukung.'], 405);
}

try {
    ensureUserProfile($auth, $database, $uid);

    if ($method === 'POST') {
        $name = trim((string) ($_POST['name'] ?? ''));
        $bio = trim((string) ($_POST['bio'] ?? ''));

        if ($name === '' || mb_strlen($name) > PROFILE_NAME_MAX) {
            jsonResponse(['success' => false, 'message' => 'Nama wajib diisi, maksimal ' . PROFILE_NAME_MAX . ' karakter.'], 400);
        }
        if (mb_strlen($bio) > PROFILE_BIO_MAX) {
            jsonResponse(['success' => false, 'message' => 'Bio maksimal ' . PROFILE_BIO_MAX . ' karakter.'], 400);
        }

        $database->getReference('users/' . $uid)->update(['name' => $name, 'bio' => $bio]);
    }

    $profile = getUserProfile($auth, $database, $uid);
} catch (Throwable $error) {
    error_log('Profile request failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Profil gagal dimuat. Coba lagi beberapa saat lagi.'], 500);
}

if ($profile === null) {
    jsonResponse(['success' => false, 'message' => 'Profil tidak ditemukan.'], 404);
}
jsonResponse(['success' => true, 'profile' => $profile]);
