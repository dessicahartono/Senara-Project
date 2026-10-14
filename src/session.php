<?php
declare(strict_types=1);

/** true jika permintaan datang lewat HTTPS, termasuk di balik proxy seperti Render. */
function isHttpsRequest(): bool
{
    $https = ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off';
    return $https || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

/**
 * Tolak permintaan yang mengubah data (selain GET/HEAD) jika dikirim dari situs lain (CSRF).
 * Permintaan tanpa header Origin (browser lama atau bukan browser) tetap diterima.
 */
function rejectCrossSiteRequest(): void
{
    if (in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
        return;
    }
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') {
        return;
    }
    $host = (string) parse_url($origin, PHP_URL_HOST);
    $port = parse_url($origin, PHP_URL_PORT);
    $originHost = $port !== null && $port !== false ? $host . ':' . $port : $host;
    if (strcasecmp($originHost, (string) ($_SERVER['HTTP_HOST'] ?? '')) !== 0) {
        jsonResponse(['success' => false, 'message' => 'Permintaan ditolak.'], 403);
    }
}

/**
 * Mulai session dengan cookie yang aman. SameSite=Lax membuat browser tidak mengirim cookie session
 * pada POST dari situs lain, dan cek Origin menjadi lapisan kedua, termasuk untuk login dan registrasi.
 */
function startSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    rejectCrossSiteRequest();
    ini_set('session.use_strict_mode', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isHttpsRequest(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/**
 * Mengembalikan uid pengguna yang sedang login, atau langsung menjawab 401 jika belum login.
 * uid selalu diambil dari session, tidak pernah dari input browser.
 */
function requireLoginUid(): string
{
    startSession();

    $uid = $_SESSION['firebase_uid'] ?? null;
    if (!is_string($uid) || $uid === '') {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'Sesi berakhir. Silakan masuk kembali.']);
        exit;
    }
    return $uid;
}

/** Kirim respons JSON lalu hentikan script. */
function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** Hapus session login beserta cookie-nya. */
function destroyLoginSession(): void
{
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite'] ?: 'Lax',
    ]);
    session_destroy();
}
