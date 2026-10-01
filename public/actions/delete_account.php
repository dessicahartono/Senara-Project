<?php
// Fungsi: menghapus akun yang sedang login beserta seluruh datanya (PRD 6 Delete 3).
// Wajib konfirmasi ulang: kata sandi untuk akun email, atau login Google baru (idToken) untuk akun Google.
declare(strict_types=1);

use Kreait\Firebase\Auth\SignIn\FailedToSignIn;
use Kreait\Firebase\Exception\InvalidArgumentException;

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/users.php';

/** Login Google untuk konfirmasi harus baru saja dilakukan. */
const GOOGLE_REAUTH_MAX_AGE = 300;

try {
    $account = $auth->getUser($uid);
} catch (Throwable $error) {
    error_log('Delete account lookup failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Akun tidak ditemukan.'], 404);
}

$providers = array_map(fn ($provider) => $provider->providerId, $account->providerData);

if (in_array('password', $providers, true)) {
    $password = (string) ($_POST['password'] ?? '');
    if ($password === '') {
        jsonResponse(['success' => false, 'message' => 'Masukkan kata sandi terlebih dahulu.'], 400);
    }
    try {
        $auth->signInWithEmailAndPassword((string) $account->email, $password);
    } catch (FailedToSignIn | InvalidArgumentException) {
        // InvalidArgumentException: kata sandi kurang dari 6 karakter ditolak SDK sebelum dikirim ke Firebase.
        jsonResponse(['success' => false, 'message' => 'Kata sandi tidak cocok.'], 403);
    }
} else {
    $idToken = (string) ($_POST['idToken'] ?? '');
    try {
        $claims = $auth->verifyIdToken($idToken)->claims();
    } catch (Throwable) {
        jsonResponse(['success' => false, 'message' => 'Konfirmasi Google gagal. Coba lagi.'], 403);
    }
    $authTime = (int) $claims->get('auth_time');
    if ($claims->get('sub') !== $uid || time() - $authTime > GOOGLE_REAUTH_MAX_AGE) {
        jsonResponse(['success' => false, 'message' => 'Konfirmasi Google gagal. Gunakan akun Google yang sama.'], 403);
    }
}

try {
    // Data dihapus lebih dulu: jika penghapusan akun Auth gagal, pengguna masih bisa login dan mencoba lagi.
    // TODO: hapus juga foto di Storage setelah upload foto tersedia.
    deleteUserData($database, $uid);
    $auth->deleteUser($uid);
} catch (Throwable $error) {
    error_log('Delete account failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Akun gagal dihapus. Coba lagi beberapa saat lagi.'], 500);
}

destroyLoginSession();
jsonResponse(['success' => true]);
