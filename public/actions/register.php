<?php
/**
 * Registrasi akun email.
 *
 * Membuat akun Firebase Auth dan profil users/{uid}, mengirim email verifikasi,
 * lalu mengarahkan ke halaman Cek Email.
 */
declare(strict_types=1);

session_start();

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/users.php';
require_once __DIR__ . '/../../src/verification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Gunakan form pendaftaran untuk membuat akun.');
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$password = (string) ($_POST['password'] ?? '');
$confirmPassword = (string) ($_POST['confirmPassword'] ?? '');

// Validasi ulang di server karena validasi JavaScript bisa dilewati.
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    http_response_code(400);
    exit('Nama, format email, atau kata sandi tidak valid. <a href="../registrasi.html">Kembali</a>');
}

try {
    $user = $auth->createUser([
        'displayName' => $name,
        'email' => $email,
        'password' => $password,
    ]);

    try {
        createUserProfileIfMissing($database, $user->uid, $name, $email);
    } catch (Throwable $profileError) {
        // Hapus lagi akun Auth-nya agar tidak ada akun tanpa profil.
        $auth->deleteUser($user->uid);
        throw $profileError;
    }
} catch (Throwable $error) {
    // Detail error hanya dicatat di log, tidak ditampilkan ke pengguna.
    error_log('Firebase registration failed: ' . $error->getMessage());
    http_response_code(400);
    exit('Registrasi gagal. Periksa email dan kata sandi, lalu coba lagi. <a href="../registrasi.html">Kembali</a>');
}

// Gagal mengirim email verifikasi tidak membatalkan registrasi;
// email bisa dikirim ulang dari halaman Cek Email.
session_regenerate_id(true);
rememberPendingVerification($user->uid, $email);
$verificationSent = sendVerificationEmail($auth, $email);

$query = 'email=' . rawurlencode($email) . ($verificationSent ? '' : '&verification=failed');
header('Location: ../cek-email.html?' . $query);
exit;
