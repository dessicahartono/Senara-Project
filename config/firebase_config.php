<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;

$renderCredentialsPath = '/etc/secrets/firebase_credentials.json';
$credentialsPath = file_exists($renderCredentialsPath)
    ? $renderCredentialsPath
    : __DIR__ . '/../firebase_credentials.json';

if (file_exists($credentialsPath)) {
    $firebaseCredentials = json_decode(file_get_contents($credentialsPath), true);
} else {
    throw new RuntimeException('Firebase credentials file not found at: ' . $credentialsPath);
}

// Database URL from environment variable, with fallback to default
$databaseUrl = getenv('FIREBASE_DATABASE_URL') ?? 'https://senara-alp-cloud-computing-default-rtdb.asia-southeast1.firebasedatabase.app/';

$factory = (new Factory)
    ->withServiceAccount($firebaseCredentials)
    ->withDatabaseUri($databaseUrl);

$db = $factory->createDatabase();
$auth = $factory->createAuth();