<?php
declare(strict_types=1);

use GuzzleHttp\Client;

/**
 * API key dan model Gemini dari env GEMINI_API_KEY dan GEMINI_MODEL, atau dari gemini_config.php
 * di root project jika env kosong. Model memakai bawaan jika keduanya kosong.
 */
function geminiConfig(): array
{
    static $config = null;
    if ($config === null) {
        $config = ['api_key' => getenv('GEMINI_API_KEY'), 'model' => getenv('GEMINI_MODEL')];
        if (empty($config['api_key']) || empty($config['model'])) {
            $file = __DIR__ . '/../gemini_config.php';
            $local = is_file($file) ? require $file : null;
            if (is_array($local)) {
                foreach (['api_key', 'model'] as $key) {
                    if (empty($config[$key]) && !empty($local[$key])) {
                        $config[$key] = $local[$key];
                    }
                }
            }
        }
        if (empty($config['api_key'])) {
            throw new RuntimeException('GEMINI_API_KEY belum diisi. Set env GEMINI_API_KEY di Render atau isi gemini_config.php lokal.');
        }
        if (empty($config['model'])) {
            $config['model'] = 'gemini-3.5-flash-lite';
        }
    }
    return $config;
}

/**
 * Pengaturan thinking serendah mungkin agar token tidak terbuang untuk tugas ringan seperti chat dan rangkuman.
 * Token thinking ikut dihitung ke maxOutputTokens, jadi thinking yang besar juga bisa memotong jawaban.
 *
 * thinkingBudget (Gemini 2.5) dan thinkingLevel (Gemini 3 ke atas) tidak boleh dikirim bersamaan.
 * Model "lite" dibiarkan memakai bawaannya, yang sudah mati atau minimal. Model 3 ke atas lainnya memakai
 * "low", karena "minimal" tidak didukung semua model.
 */
function geminiThinkingConfig(string $model): ?array
{
    if (str_contains($model, '2.5-flash')) {
        return ['thinkingBudget' => 0];
    }
    if (str_contains($model, 'lite')) {
        return null;
    }
    if (preg_match('/^gemini-([3-9]|\d{2,})/', $model)) {
        return ['thinkingLevel' => 'low'];
    }
    return null;
}

/**
 * Kirim satu permintaan generateContent dan kembalikan teks jawabannya.
 * Melempar RuntimeException jika Gemini tidak mengembalikan teks, dan BadResponseException dari Guzzle
 * jika Gemini menjawab dengan status error (misalnya 429 saat kuota habis).
 */
function callGemini(string $systemPrompt, array $contents, array $generationConfig): string
{
    ['api_key' => $apiKey, 'model' => $model] = geminiConfig();

    $thinkingConfig = geminiThinkingConfig($model);
    if ($thinkingConfig !== null) {
        $generationConfig['thinkingConfig'] = $thinkingConfig;
    }

    $response = (new Client(['timeout' => 30]))->post(
        'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent',
        [
            'headers' => ['x-goog-api-key' => $apiKey],
            'json' => [
                'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
                'contents' => $contents,
                'generationConfig' => $generationConfig,
            ],
        ]
    );

    $result = json_decode((string) $response->getBody(), true);
    $text = '';
    foreach ($result['candidates'][0]['content']['parts'] ?? [] as $part) {
        // Bagian "thought" adalah proses berpikir model, bukan jawaban.
        if (empty($part['thought'])) {
            $text .= $part['text'] ?? '';
        }
    }
    $text = trim($text);

    if ($text === '') {
        $reason = $result['candidates'][0]['finishReason'] ?? $result['promptFeedback']['blockReason'] ?? 'unknown';
        throw new RuntimeException('Gemini tidak mengembalikan teks (' . $reason . ').');
    }
    return $text;
}
