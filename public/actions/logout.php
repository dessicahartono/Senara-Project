<?php
/**
 * Logout: menghapus session login di server.
 */
declare(strict_types=1);

session_start();

require_once __DIR__ . '/../../src/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(['success' => false, 'message' => 'Gunakan metode POST.'], 405);
}

destroyLoginSession();
jsonResponse(['success' => true]);
