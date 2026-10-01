<?php
declare(strict_types=1);

/**
 * Untuk endpoint JSON yang wajib login: mengembalikan uid dari session,
 * atau langsung menjawab 401 jika belum login. uid tidak pernah diambil dari input browser.
 */
function requireLoginUid(): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

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
