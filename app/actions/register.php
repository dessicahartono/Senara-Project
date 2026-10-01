<?php
// Perubahan: pendaftaran memakai createUser() yang tersedia pada Kreait SDK 8.5
// dan memvalidasi input di server; alur email verifikasi sementara dinonaktifkan.
// Alasan: method lama createUserWithNameAndEmailAndPassword() tidak ada dan fatal.
// Fungsi: membuat akun Firebase dari POST form lalu mengarahkan pengguna ke halaman login.
declare(strict_types=1);

// session_start() tidak diperlukan karena tahap ini hanya membuat akun, belum membuat session login.
require_once __DIR__ . '/../config/firebase_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Gunakan form pendaftaran untuk membuat akun.');
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$password = (string) ($_POST['password'] ?? '');
$confirmPassword = (string) ($_POST['confirmPassword'] ?? '');

// Validasi server wajib dilakukan karena validasi JavaScript dapat dilewati.
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

    /*
     * Dinonaktifkan sementara: pengguna meminta proses create account saja,
     * tanpa mengirim email verifikasi atau membuat session pending-verification.
     * Aktifkan kembali bagian ini saat alur verifikasi email siap digunakan:
     *
     * $auth->sendEmailVerificationLink($email);
     * session_start();
     * session_regenerate_id(true);
     * $_SESSION['pending_verification_email'] = $user->email ?? $email;
     * $_SESSION['pending_verification_uid'] = $user->uid;
     * $_SESSION['pending_verification_name'] = $user->displayName ?? $name;
     * header('Location: ../cek-email.html?email=' . rawurlencode($email));
     */

    // Arahkan ke login karena akun sudah dibuat, tetapi belum dibuatkan session login.
    header('Location: ../login.html?registered=1');
    exit;
} catch (Throwable $error) {
    // Detail disimpan di server log; jangan tampilkan pesan internal Firebase ke pengguna.
    error_log('Firebase registration failed: ' . $error->getMessage());
    http_response_code(400);
    exit('Registrasi gagal. Periksa email dan kata sandi, lalu coba lagi. <a href="../registrasi.html">Kembali</a>');
}
