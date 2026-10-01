<?php
/**
 * Mengganti foto profil. Foto diunggah ke Cloudinary, lalu URL-nya disimpan di users/{uid}/photoUrl.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/users.php';
require_once __DIR__ . '/../../src/cloudinary.php';

/** Foto biasanya sudah dikompres di browser (photoService.js); batas ini hanya pengaman. */
const AVATAR_MAX_BYTES = 3 * 1024 * 1024;

try {
    $path = validatedUploadedPhoto($_FILES['photo'] ?? null, AVATAR_MAX_BYTES);
} catch (InvalidArgumentException $error) {
    jsonResponse(['success' => false, 'message' => $error->getMessage()], 400);
}

try {
    // public_id tetap per pengguna, jadi foto baru langsung menimpa foto lama.
    ensureUserProfile($auth, $database, $uid);
    $photo = cloudinaryUpload($path, 'avatars/' . $uid, 'c_fill,g_auto,w_400,h_400,q_auto');
    $database->getReference('users/' . $uid)->update(['photoUrl' => $photo['url']]);
    $profile = getUserProfile($auth, $database, $uid);
} catch (Throwable $error) {
    error_log('Profile photo upload failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Foto profil gagal disimpan. Coba lagi beberapa saat lagi.'], 500);
}

jsonResponse(['success' => true, 'profile' => $profile]);
