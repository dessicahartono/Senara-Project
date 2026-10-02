<?php
/**
 * Mengirim email atur ulang kata sandi ke akun yang sedang login (tombol "Ubah kata sandi" di Profil).
 */
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'message' => 'Gunakan metode POST.']);
    exit;
}

$uid = $_SESSION['firebase_uid'] ?? '';
if (!is_string($uid) || $uid === '') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesi berakhir. Silakan masuk kembali.']);
    exit;
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/verification.php';

try {
    // Alamat email sengaja tidak diterima dari browser agar endpoint ini tidak bisa dipakai mengirim
    // email ke sembarang alamat. Email dibaca dari Auth, bukan dari session, karena bisa sudah diganti di Profil.
    $email = (string) $auth->getUser($uid)->email;
    $auth->sendPasswordResetLink($email, ['continueUrl' => appUrl('login.html')], 'id');
} catch (Throwable $error) {
    error_log('Firebase password reset email failed: ' . $error->getMessage());
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Email atur ulang kata sandi gagal dikirim. Coba lagi beberapa saat lagi.']);
    exit;
}

echo json_encode(['success' => true, 'email' => $email]);
