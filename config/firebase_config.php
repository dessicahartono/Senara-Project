<?php
require_once __DIR__ . '/../vendor/autoload.php'; 

use Kreait\Firebase\Factory; 
use Kreait\Firebase\Auth; 

$credentialsJson = getenv('FIREBASE_CREDENTIALS_JSON');
if ($credentialsJson === false || trim($credentialsJson) === '') {
    throw new RuntimeException('FIREBASE_CREDENTIALS_JSON environment variable is not set.');
}

try {
    $firebaseCredentials = json_decode($credentialsJson, true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $exception) {
    throw new RuntimeException('FIREBASE_CREDENTIALS_JSON must contain valid JSON.', 0, $exception);
}

if (!is_array($firebaseCredentials)) {
    throw new RuntimeException('FIREBASE_CREDENTIALS_JSON must contain a JSON object.');
}

$databaseUrl = getenv('FIREBASE_DATABASE_URL') ?: 'https://senara-alp-cloud-computing-default-rtdb.asia-southeast1.firebasedatabase.app/'; 

$factory = (new Factory) 
    ->withServiceAccount($firebaseCredentials) 
    ->withDatabaseUri($databaseUrl); 

$database = $factory->createDatabase(); 
$auth = $factory->createAuth(); 
