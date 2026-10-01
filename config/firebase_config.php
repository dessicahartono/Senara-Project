<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;

$firebaseCredentials = __DIR__ . '/../firebase_credentials.json';
$databaseUrl = 'https://senara-alp-cloud-computing-default-rtdb.asia-southeast1.firebasedatabase.app/';

$factory = (new Factory)
    ->withServiceAccount($firebaseCredentials)
    ->withDatabaseUri($databaseUrl);

$database = $factory->createDatabase();
$auth = $factory->createAuth();
?>