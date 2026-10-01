<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Auth;
use Kreait\Firebase\Contract\Database;

/** Batas panjang field profil; samakan dengan maxlength di profil.html. */
const PROFILE_NAME_MAX = 40;
const PROFILE_BIO_MAX = 160;

/**
 * Profil untuk frontend: data users/{uid} digabung dengan status akun dari Firebase Auth.
 * Mengembalikan null jika profil belum ada.
 */
function getUserProfile(Auth $auth, Database $database, string $uid): ?array
{
    $profile = $database->getReference('users/' . $uid)->getValue();
    if (!is_array($profile)) {
        return null;
    }

    $account = $auth->getUser($uid);
    $providers = array_map(fn ($provider) => $provider->providerId, $account->providerData);

    return [
        'name' => (string) ($profile['name'] ?? ''),
        // Email di Auth yang dipakai; salinan di database hanya untuk referensi.
        'email' => (string) ($account->email ?? $profile['email'] ?? ''),
        'bio' => (string) ($profile['bio'] ?? ''),
        'photoUrl' => $profile['photoUrl'] ?? null,
        'createdAt' => $profile['createdAt'] ?? null,
        'emailVerified' => $account->emailVerified,
        // Akun tanpa kata sandi (login Google) dikonfirmasi lewat login Google saat hapus akun.
        'hasPassword' => in_array('password', $providers, true),
        'stats' => [
            'streak' => (int) ($profile['stats']['streak'] ?? 0),
            'lastCheckIn' => $profile['stats']['lastCheckIn'] ?? null,
        ],
    ];
}

/**
 * Pastikan users/{uid} ada. Jika belum, profil dibuat dari data Firebase Auth.
 */
function ensureUserProfile(Auth $auth, Database $database, string $uid): void
{
    if ($database->getReference('users/' . $uid)->getSnapshot()->exists()) {
        return;
    }
    $account = $auth->getUser($uid);
    $email = (string) ($account->email ?? '');
    $name = (string) ($account->displayName ?: strtok($email, '@'));
    createUserProfileIfMissing($database, $uid, $name, $email, $account->photoUrl);
}

/** Hapus seluruh data milik pengguna di Realtime Database dalam satu multi-path update. */
function deleteUserData(Database $database, string $uid): void
{
    $database->getReference()->update([
        'users/' . $uid => null,
        'journals/' . $uid => null,
        'journalDates/' . $uid => null,
        'chats/' . $uid => null,
    ]);
}

/**
 * Membuat profil users/{uid} jika belum ada.
 * Mengembalikan true jika profil baru dibuat, false jika sudah ada.
 */
function createUserProfileIfMissing(Database $database, string $uid, string $name, string $email, ?string $photoUrl = null): bool
{
    $reference = $database->getReference('users/' . $uid);
    if ($reference->getSnapshot()->exists()) {
        return false;
    }

    // Realtime Database tidak menyimpan nilai null, jadi photoUrl dan lastCheckIn
    // baru muncul setelah pengguna mengunggah foto atau menulis jurnal.
    $reference->set([
        'name' => $name,
        'email' => $email,
        'bio' => '',
        'photoUrl' => $photoUrl,
        'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'stats' => [
            'streak' => 0,
            'lastCheckIn' => null,
        ],
    ]);
    return true;
}
