<?php
/**
 * Login dengan email dan kata sandi.
 *
 * Berhasil: membuat session lalu mengarahkan ke dashboard.
 * Gagal: kembali ke login.html?error=<kode>, dan login.js menampilkan pesannya.
 */
declare(strict_types=1);

use Kreait\Firebase\Auth\SignIn\FailedToSignIn;
use Kreait\Firebase\Exception\InvalidArgumentException;

session_start();

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/verification.php';

function redirectWithError(string $code): never
{
    header('Location: ../login.html?error=' . rawurlencode($code));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Gunakan form login untuk masuk.');
}

$email = trim((string) ($_POST['email'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

// Validasi ulang di server karena validasi JavaScript bisa dilewati.
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirectWithError('invalidemail');
}
if ($password === '') {
    redirectWithError('invalid');
}

try {
    $signInResult = $auth->signInWithEmailAndPassword($email, $password);
    $uid = $signInResult->firebaseUserId();
    $emailVerified = $auth->getUser($uid)->emailVerified;
} catch (FailedToSignIn $error) {
    // Pesan error Firebase berupa kode, misalnya "INVALID_LOGIN_CREDENTIALS"
    // atau "TOO_MANY_ATTEMPTS_TRY_LATER : ...".
    $firebaseCode = strtok($error->getMessage(), ' :');
    if ($firebaseCode === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        redirectWithError('toomany');
    }
    if ($firebaseCode === 'INVALID_EMAIL') {
        redirectWithError('invalidemail');
    }
    // Akun tidak ditemukan dan kata sandi salah sengaja diberi pesan yang sama (Email Enumeration Protection).
    redirectWithError('invalid');
} catch (InvalidArgumentException) {
    // SDK menolak kata sandi kurang dari 6 karakter sebelum dikirim, jadi pasti salah.
    redirectWithError('invalid');
} catch (Throwable $error) {
    // Detail error hanya dicatat di log, tidak ditampilkan ke pengguna.
    error_log('Firebase email sign-in failed: ' . $error->getMessage());
    redirectWithError('server');
}

session_regenerate_id(true);

// Akun email harus sudah diverifikasi sebelum bisa login.
if (!$emailVerified) {
    rememberPendingVerification($uid, $email);
    redirectWithError('unverified');
}

$_SESSION['firebase_uid'] = $uid;
$_SESSION['firebase_email'] = $email;
header('Location: ../dashboard.html');
exit;
