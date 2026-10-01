<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Auth;
use Kreait\Firebase\Contract\Database;

/** Batas panjang field profil, sama dengan maxlength di profil.html. */
const PROFILE_NAME_MAX = 40;
const PROFILE_BIO_MAX = 160;

/**
 * Profil untuk frontend: data users/{uid} digabung dengan status akun dari Firebase Auth.
 * Mengembalikan null jika profil belum ada di database.
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
        // Email dari Auth adalah sumber utama; salinan di database hanya untuk referensi.
        'email' => (string) ($account->email ?? $profile['email'] ?? ''),
        'bio' => (string) ($profile['bio'] ?? ''),
        'photoUrl' => $profile['photoUrl'] ?? null,
        'createdAt' => $profile['createdAt'] ?? null,
        'emailVerified' => $account->emailVerified,
        // Akun Google tanpa kata sandi dikonfirmasi ulang lewat login Google saat hapus akun.
        'hasPassword' => in_array('password', $providers, true),
        'stats' => [
            'streak' => (int) ($profile['stats']['streak'] ?? 0),
            'lastCheckIn' => $profile['stats']['lastCheckIn'] ?? null,
        ],
    ];
}

/** Hapus seluruh data milik pengguna di Realtime Database (PRD 6 Delete 3) dalam satu multi-path update. */
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
 * Membuat profil users/{uid} (PRD Bagian 10) jika belum ada.
 * Mengembalikan true jika profil baru dibuat, false jika sudah ada sebelumnya.
 */
function createUserProfileIfMissing(Database $database, string $uid, string $name, string $email, ?string $photoUrl = null): bool
{
    $reference = $database->getReference('users/' . $uid);
    if ($reference->getSnapshot()->exists()) {
        return false;
    }

    // Field bernilai null tidak disimpan oleh Realtime Database, jadi photoUrl dan lastCheckIn
    // cukup tidak ada sampai pengguna mengunggah foto atau menulis jurnal pertama.
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
