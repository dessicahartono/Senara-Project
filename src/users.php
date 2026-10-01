<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Database;

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
