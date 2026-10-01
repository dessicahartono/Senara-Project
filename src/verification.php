<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Auth;

/** Jeda minimal (detik) antar pengiriman ulang email verifikasi, sama dengan hitungan mundur di cek-email.js. */
const VERIFICATION_RESEND_COOLDOWN = 60;

/** URL absolut ke halaman di folder public, misalnya appUrl('login.html?verified=1'). */
function appUrl(string $path): string
{
    $https = ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off';
    $scheme = $https || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
    // Endpoint berada di public/actions, jadi folder public adalah satu tingkat di atasnya.
    $base = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\');
    return $scheme . '://' . $_SERVER['HTTP_HOST'] . $base . '/' . ltrim($path, '/');
}

/**
 * Meminta Firebase mengirim email verifikasi (PRD 7.2 no. 7).
 * Link di email mengarahkan kembali ke halaman login. Domain aplikasi harus terdaftar
 * di Firebase Console > Authentication > Settings > Authorized domains.
 */
function sendVerificationEmail(Auth $auth, string $email): bool
{
    try {
        $auth->sendEmailVerificationLink($email, ['continueUrl' => appUrl('login.html?verified=1')], 'id');
        $_SESSION['verification_sent_at'] = time();
        return true;
    } catch (Throwable $error) {
        error_log('Firebase verification email failed: ' . $error->getMessage());
        return false;
    }
}

/** Menyimpan akun yang menunggu verifikasi agar tombol "Kirim ulang" tahu email tujuannya. */
function rememberPendingVerification(string $uid, string $email): void
{
    $_SESSION['pending_verification_uid'] = $uid;
    $_SESSION['pending_verification_email'] = $email;
}
