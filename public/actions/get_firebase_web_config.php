<?php
/**
 * Mengirim konfigurasi Firebase Web ke browser untuk login Google.
 * Nilainya dibaca dari firebase_web_config.php di root project.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$firebaseWebConfig = json_decode(getenv('FIREBASE_WEB_CONFIG_JSON'), true) ?: require __DIR__ . '/../../firebase_web_config.php';
$requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];

foreach ($requiredKeys as $key) {
    if (!is_array($firebaseWebConfig) || empty($firebaseWebConfig[$key])) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Konfigurasi Firebase Web belum lengkap. Isi firebase_web_config.php.',
        ]);
        exit;
    }
}

echo json_encode($firebaseWebConfig, JSON_UNESCAPED_SLASHES);