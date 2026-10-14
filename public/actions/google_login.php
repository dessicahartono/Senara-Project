<?php
/**
 * Login dengan Google: memverifikasi ID token dari browser lalu membuat session.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';
startSession();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'message' => 'Gunakan metode POST.']);
    exit;
}

$idToken = $_POST['idToken'] ?? '';
if (!is_string($idToken) || $idToken === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID token tidak ditemukan.']);
    exit;
}

try {
    require_once __DIR__ . '/../../config/firebase_config.php';
    require_once __DIR__ . '/../../src/users.php';
    $verifiedToken = $auth->verifyIdToken($idToken);
    $claims = $verifiedToken->claims();

    // Hanya token dari login Google yang diterima. Token akun email dan kata sandi ditolak agar
    // syarat verifikasi email di login.php tidak bisa dilewati lewat endpoint ini.
    $firebaseClaim = $claims->get('firebase');
    if (!is_array($firebaseClaim) || ($firebaseClaim['sign_in_provider'] ?? null) !== 'google.com') {
        throw new RuntimeException('ID token is not from Google sign-in.');
    }

    $uid = $claims->get('sub');
    $email = $claims->get('email');
    $name = $claims->get('name');
    $picture = $claims->get('picture');

    // Profil hanya dibuat saat login pertama. Akun Google tidak perlu verifikasi email.
    $email = is_string($email) ? $email : '';
    $name = is_string($name) && $name !== '' ? $name : strtok($email, '@');
    createUserProfileIfMissing($database, $uid, $name, $email, is_string($picture) ? $picture : null);

    session_regenerate_id(true);
    $_SESSION['firebase_uid'] = $uid;
    $_SESSION['firebase_email'] = $email;

    echo json_encode(['success' => true]);
} catch (Throwable $error) {
    error_log('Firebase Google sign-in verification failed: ' . $error->getMessage());
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Verifikasi Google gagal. Silakan coba lagi.']);
}