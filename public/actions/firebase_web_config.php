<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$firebaseWebConfig = require __DIR__ . '/../../firebase_web_config.php';
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