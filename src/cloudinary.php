<?php
declare(strict_types=1);

use GuzzleHttp\Client;

/**
 * Penyimpanan foto di Cloudinary. Database hanya menyimpan URL foto.
 *
 * Struktur folder:
 *   senara/avatars/{uid}                 foto profil (selalu ditimpa, jadi tidak ada file lama tersisa)
 *   senara/journals/{uid}/{dateKey}      foto jurnal
 */

const CLOUDINARY_ROOT = 'senara';

function cloudinaryConfig(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/../cloudinary_config.php';
        $config = is_file($file) ? require $file : [];
        foreach (['cloud_name', 'api_key', 'api_secret'] as $key) {
            if (empty($config[$key])) {
                throw new RuntimeException('cloudinary_config.php belum diisi (' . $key . ').');
            }
        }
    }
    return $config;
}

/** Signature Cloudinary: parameter diurutkan, digabung, lalu di-hash SHA-1 bersama api_secret. */
function cloudinarySign(array $params): string
{
    ksort($params);
    $pairs = [];
    foreach ($params as $key => $value) {
        $pairs[] = $key . '=' . $value;
    }
    return sha1(implode('&', $pairs) . cloudinaryConfig()['api_secret']);
}

function cloudinaryClient(): Client
{
    return new Client(['base_uri' => 'https://api.cloudinary.com/v1_1/' . cloudinaryConfig()['cloud_name'] . '/', 'timeout' => 30]);
}

/**
 * Unggah foto dan kembalikan ['url' => ..., 'publicId' => ...].
 * $transformation diterapkan sebelum disimpan, misalnya untuk memotong avatar menjadi persegi.
 */
function cloudinaryUpload(string $filePath, string $publicId, ?string $transformation = null): array
{
    $params = [
        'public_id' => CLOUDINARY_ROOT . '/' . $publicId,
        'overwrite' => 'true',
        'invalidate' => 'true',
        'timestamp' => (string) time(),
    ];
    if ($transformation !== null) {
        $params['transformation'] = $transformation;
    }

    $multipart = [['name' => 'file', 'contents' => fopen($filePath, 'rb')]];
    foreach ($params + ['api_key' => cloudinaryConfig()['api_key'], 'signature' => cloudinarySign($params)] as $name => $value) {
        $multipart[] = ['name' => $name, 'contents' => $value];
    }

    $response = cloudinaryClient()->post('image/upload', ['multipart' => $multipart]);
    $result = json_decode((string) $response->getBody(), true);
    return ['url' => $result['secure_url'], 'publicId' => $result['public_id']];
}

/** Hapus satu foto. Foto yang sudah tidak ada dianggap berhasil. */
function cloudinaryDestroy(string $publicId): void
{
    $params = ['public_id' => $publicId, 'invalidate' => 'true', 'timestamp' => (string) time()];
    cloudinaryClient()->post('image/destroy', [
        'form_params' => $params + ['api_key' => cloudinaryConfig()['api_key'], 'signature' => cloudinarySign($params)],
    ]);
}

/** Hapus semua foto milik pengguna. */
function cloudinaryDestroyUserPhotos(string $uid): void
{
    cloudinaryDestroy(CLOUDINARY_ROOT . '/avatars/' . $uid);

    // Admin API menghapus berdasarkan prefix, maksimal 1000 file per permintaan.
    $config = cloudinaryConfig();
    cloudinaryClient()->delete('resources/image/upload', [
        'auth' => [$config['api_key'], $config['api_secret']],
        'query' => ['prefix' => CLOUDINARY_ROOT . '/journals/' . $uid . '/'],
    ]);
}

/**
 * Validasi file foto dari $_FILES. Mengembalikan path file sementara, atau melempar
 * InvalidArgumentException berisi pesan untuk pengguna.
 */
function validatedUploadedPhoto(?array $file, int $maxBytes): string
{
    if ($file === null || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        throw new InvalidArgumentException('Pilih foto terlebih dahulu.');
    }
    if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE || $file['size'] > $maxBytes) {
        throw new InvalidArgumentException('Ukuran foto maksimal ' . round($maxBytes / 1024 / 1024) . ' MB.');
    }
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        throw new InvalidArgumentException('Foto gagal diunggah. Coba lagi.');
    }

    // Periksa isi file, bukan nama atau MIME type kiriman browser yang bisa dipalsukan.
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true) || getimagesize($file['tmp_name']) === false) {
        throw new InvalidArgumentException('Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.');
    }
    return $file['tmp_name'];
}
