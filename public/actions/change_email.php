<?php
/**
 * Mengganti alamat email akun yang sedang login (akun email dan kata sandi).
 *
 * POST newEmail, password - kirim link verifikasi ke email baru. Email akun baru berganti setelah
 * link diklik, jadi email baru selalu terverifikasi. Sampai saat itu email lama tetap dipakai untuk login.
 */
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
require_once __DIR__ . '/../../src/verification.php';

$newEmail = mb_strtolower(trim((string) ($_POST['newEmail'] ?? '')));
$password = (string) ($_POST['password'] ?? '');

if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'message' => 'Format email belum benar.'], 400);
}
if ($password === '') {
    jsonResponse(['success' => false, 'message' => 'Masukkan kata sandi terlebih dahulu.'], 400);
}

try {
    $account = $auth->getUser($uid);
} catch (Throwable $error) {
    error_log('Change email lookup failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Akun tidak ditemukan.'], 404);
}

$providers = array_map(fn ($provider) => $provider->providerId, $account->providerData);
if (!in_array('password', $providers, true)) {
    jsonResponse(['success' => false, 'message' => 'Email akun Google mengikuti akun Google-mu dan tidak bisa diganti di sini.'], 400);
}
if ($newEmail === mb_strtolower((string) $account->email)) {
    jsonResponse(['success' => false, 'message' => 'Email baru sama dengan email yang sedang dipakai.'], 400);
}

$waitSeconds = (int) ($_SESSION['email_change_sent_at'] ?? 0) + VERIFICATION_RESEND_COOLDOWN - time();
if ($waitSeconds > 0) {
    jsonResponse(['success' => false, 'message' => "Tunggu {$waitSeconds} detik sebelum mengirim ulang."], 429);
}

try {
    $idToken = $auth->signInWithEmailAndPassword((string) $account->email, $password)->idToken();
} catch (FailedToSignIn | InvalidArgumentException) {
    // SDK menolak kata sandi kurang dari 6 karakter dengan InvalidArgumentException.
    jsonResponse(['success' => false, 'message' => 'Kata sandi tidak cocok.'], 403);
} catch (Throwable $error) {
    error_log('Change email sign-in failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Konfirmasi kata sandi gagal. Coba lagi beberapa saat lagi.'], 502);
}

try {
    sendEmailChangeLink((string) $idToken, $newEmail);
} catch (RuntimeException $error) {
    $code = $error->getMessage();
    if ($code === 'EMAIL_EXISTS') {
        jsonResponse(['success' => false, 'message' => 'Email ini sudah dipakai akun lain.'], 409);
    }
    if ($code === 'INVALID_NEW_EMAIL' || $code === 'INVALID_EMAIL') {
        jsonResponse(['success' => false, 'message' => 'Format email belum benar.'], 400);
    }
    if ($code === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        jsonResponse(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi nanti.'], 429);
    }
    error_log('Change email link failed: ' . $code);
    jsonResponse(['success' => false, 'message' => 'Email verifikasi gagal dikirim. Coba lagi beberapa saat lagi.'], 502);
} catch (Throwable $error) {
    error_log('Change email link failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Email verifikasi gagal dikirim. Coba lagi beberapa saat lagi.'], 502);
}

$_SESSION['email_change_sent_at'] = time();

try {
    // Ditampilkan di Profil sebagai "menunggu verifikasi" sampai link diklik.
    $database->getReference('users/' . $uid)->update(['pendingEmail' => $newEmail]);
} catch (Throwable $error) {
    error_log('Change email pending save failed: ' . $error->getMessage());
}

jsonResponse(['success' => true, 'pendingEmail' => $newEmail]);
