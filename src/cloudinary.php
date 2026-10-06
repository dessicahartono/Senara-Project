<?php
declare(strict_types=1);

use GuzzleHttp\Client;

/**
 * Cloudinary configuration read from environment variables.
 * On Render, set these as Environment Variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

function cloudinaryConfig(): array
{
    static $config = null;
    if ($config === null) {
        $config = [
            'cloud_name' => getenv('CLOUDINARY_CLOUD_NAME'),
            'api_key' => getenv('CLOUDINARY_API_KEY'),
            'api_secret' => getenv('CLOUDINARY_API_SECRET'),
        ];
        
        foreach (['cloud_name', 'api_key', 'api_secret'] as $key) {
            if (empty($config[$key])) {
                throw new RuntimeException('Cloudinary environment variables not set (' . $key . ').');
            }
        }
    }
    return $config;
}