<?php
declare(strict_types=1);

session_start();
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
    require_once __DIR__ . '/../config/firebase_config.php';
    $verifiedToken = $auth->verifyIdToken($idToken);
    $claims = $verifiedToken->claims();
    $uid = $claims->get('sub');
    $email = $claims->get('email');

    session_regenerate_id(true);
    $_SESSION['firebase_uid'] = $uid;
    $_SESSION['firebase_email'] = is_string($email) ? $email : '';

    echo json_encode(['success' => true]);
} catch (Throwable $error) {
    error_log('Firebase Google sign-in verification failed: ' . $error->getMessage());
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Verifikasi Google gagal. Silakan coba lagi.']);
}