<?php
require_once __DIR__ . '/../vendor/autoload.php'; 

use Kreait\Firebase\Factory; 
use Kreait\Firebase\Auth; 

$credentialsPath = '/etc/secrets/firebase_credentials.json'; 
if (!is_file($credentialsPath)) { 
    $credentialsPath = __DIR__ . '/../firebase_credentials.json'; 
}
if (!is_file($credentialsPath)) { 
    throw new RuntimeException('Firebase credentials file not found at: ' . $credentialsPath); 
}

$firebaseCredentials = json_decode(file_get_contents($credentialsPath), true); 

if (!is_array($firebaseCredentials)) { 
    throw new RuntimeException('Firebase credentials file is not valid JSON: ' . $credentialsPath); 
}

$databaseUrl = getenv('FIREBASE_DATABASE_URL') ?: 'https://senara-alp-cloud-computing-default-rtdb.asia-southeast1.firebasedatabase.app/'; 

$factory = (new Factory) 
    ->withServiceAccount($firebaseCredentials) 
    ->withDatabaseUri($databaseUrl); 

$database = $factory->createDatabase(); 
$auth = $factory->createAuth(); 
