<?php
// Fungsi: mengirim ulang email verifikasi untuk akun yang tersimpan di session
// (diisi oleh register.php atau login.php saat email belum diverifikasi).
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'message' => 'Gunakan metode POST.']);
    exit;
}

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/verification.php';

// Email tujuan diambil dari session, bukan dari input browser, agar endpoint ini
// tidak bisa dipakai untuk mengirim email ke alamat sembarang.
$email = $_SESSION['pending_verification_email'] ?? '';
if (!is_string($email) || $email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Sesi verifikasi tidak ditemukan. Silakan masuk kembali.']);
    exit;
}

$waitSeconds = (int) ($_SESSION['verification_sent_at'] ?? 0) + VERIFICATION_RESEND_COOLDOWN - time();
if ($waitSeconds > 0) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => "Tunggu {$waitSeconds} detik sebelum mengirim ulang.",
        'retryAfter' => $waitSeconds,
    ]);
    exit;
}

try {
    if ($auth->getUserByEmail($email)->emailVerified) {
        echo json_encode(['success' => true, 'alreadyVerified' => true, 'message' => 'Email sudah terverifikasi. Silakan masuk.']);
        exit;
    }
} catch (Throwable $error) {
    error_log('Resend verification lookup failed: ' . $error->getMessage());
}

if (!sendVerificationEmail($auth, $email)) {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Email verifikasi gagal dikirim. Coba lagi beberapa saat lagi.']);
    exit;
}

echo json_encode(['success' => true, 'retryAfter' => VERIFICATION_RESEND_COOLDOWN]);
