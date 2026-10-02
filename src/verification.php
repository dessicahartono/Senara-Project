<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Auth;

/** Jeda minimal (detik) antar pengiriman ulang email verifikasi; samakan dengan COOLDOWN_SECONDS di cek-email.js. */
const VERIFICATION_RESEND_COOLDOWN = 60;

/** URL absolut ke halaman di folder public, misalnya appUrl('login.html?verified=1'). */
function appUrl(string $path): string
{
    $https = ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off';
    $scheme = $https || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
    // Endpoint ada di public/actions, jadi folder public satu tingkat di atasnya.
    $base = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\');
    return $scheme . '://' . $_SERVER['HTTP_HOST'] . $base . '/' . ltrim($path, '/');
}

/**
 * Meminta Firebase mengirim email verifikasi. Link di email mengarah kembali ke halaman login.
 *
 * Domain aplikasi harus terdaftar di Firebase Console > Authentication > Settings > Authorized domains.
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

/** Simpan akun yang menunggu verifikasi untuk dipakai resend_verification.php. */
function rememberPendingVerification(string $uid, string $email): void
{
    $_SESSION['pending_verification_uid'] = $uid;
    $_SESSION['pending_verification_email'] = $email;
}

/**
 * Minta Firebase mengirim link verifikasi ke email baru. Email akun baru berganti setelah link itu diklik,
 * dan Firebase juga mengirim pemberitahuan ke email lama.
 *
 * Admin SDK tidak mendukung alur ini, jadi dipanggil lewat REST API Identity Toolkit memakai
 * ID token pengguna (dari login ulang dengan kata sandi) dan API key web.
 *
 * Melempar RuntimeException berisi kode error Firebase, misalnya EMAIL_EXISTS.
 */
function sendEmailChangeLink(string $idToken, string $newEmail): void
{
    $config = require __DIR__ . '/../firebase_web_config.php';
    $response = (new GuzzleHttp\Client(['timeout' => 15, 'http_errors' => false]))->post(
        'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' . rawurlencode($config['apiKey']),
        [
            'headers' => ['X-Firebase-Locale' => 'id'],
            'json' => [
                'requestType' => 'VERIFY_AND_CHANGE_EMAIL',
                'idToken' => $idToken,
                'newEmail' => $newEmail,
                'continueUrl' => appUrl('profil.html?emailChanged=1'),
            ],
        ]
    );
    if ($response->getStatusCode() !== 200) {
        $result = json_decode((string) $response->getBody(), true);
        // Pesan error Firebase berupa kode, misalnya "EMAIL_EXISTS" atau "TOO_MANY_ATTEMPTS_TRY_LATER : ...".
        throw new RuntimeException((string) strtok((string) ($result['error']['message'] ?? 'UNKNOWN'), ' :'));
    }
}
