<?php
/**
 * Mengirim email atur ulang kata sandi ke akun yang sedang login (tombol "Ganti Password" di Profil).
 * Hanya untuk akun email dan kata sandi; akun Google tidak punya kata sandi.
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/verification.php';

$waitSeconds = (int) ($_SESSION['password_reset_sent_at'] ?? 0) + VERIFICATION_RESEND_COOLDOWN - time();
if ($waitSeconds > 0) {
    jsonResponse(['success' => false, 'message' => "Tunggu {$waitSeconds} detik sebelum mengirim ulang."], 429);
}

try {
    $account = $auth->getUser($uid);
} catch (Throwable $error) {
    error_log('Password reset lookup failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Akun tidak ditemukan.'], 404);
}

// Reset kata sandi pada akun Google akan menambahkan kata sandi baru ke akun itu.
$providers = array_map(fn ($provider) => $provider->providerId, $account->providerData);
if (!in_array('password', $providers, true)) {
    jsonResponse(['success' => false, 'message' => 'Akun Google masuk lewat Google dan tidak memakai kata sandi.'], 400);
}

try {
    // Alamat email sengaja tidak diterima dari browser agar endpoint ini tidak bisa dipakai mengirim
    // email ke sembarang alamat. Email dibaca dari Auth, bukan dari session, karena bisa sudah diganti di Profil.
    $email = (string) $account->email;
    $auth->sendPasswordResetLink($email, ['continueUrl' => appUrl('login.html')], 'id');
} catch (Throwable $error) {
    error_log('Firebase password reset email failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Email atur ulang kata sandi gagal dikirim. Coba lagi beberapa saat lagi.'], 502);
}

$_SESSION['password_reset_sent_at'] = time();

jsonResponse(['success' => true, 'email' => $email]);
