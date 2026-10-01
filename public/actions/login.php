<?php
session_start();

require_once __DIR__ . '/../../config/firebase_config.php';

$message = '';

//Get user input from form submission
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    try {
        $signInResult = $auth->signInWithEmailAndPassword($email,$password);
        $message = "Login berhasil!";

        session_regenerate_id(true);
        $_SESSION['firebase_uid'] = $signInResult->firebaseUserId();
        $_SESSION['firebase_email'] = $email;
        header('Location: ../dashboard.html');
        exit;
    }catch (Exception $e){
        $message = "Login gagal: " . $e->getMessage();
    }
}

?>