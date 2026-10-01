<?php
declare(strict_types=1);

use Kreait\Firebase\Contract\Database;

/** Batas panjang catatan jurnal; samakan dengan maxlength di journaling.html. */
const JOURNAL_NOTE_MAX = 2000;

/** Zona waktu untuk menentukan "hari ini" pada streak dan validasi tanggal. */
const JOURNAL_TIMEZONE = 'Asia/Jakarta';

function journalToday(): DateTimeImmutable
{
    return new DateTimeImmutable('today', new DateTimeZone(JOURNAL_TIMEZONE));
}

/** true jika $date berformat yyyy-mm-dd dan merupakan tanggal yang ada. */
function isValidDateKey(string $date): bool
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $m)) {
        return false;
    }
    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

/** Bentuk jurnal untuk frontend. Tanggal dipakai juga sebagai id karena satu jurnal per tanggal. */
function formatJournal(string $date, array $data): array
{
    return [
        'id' => $date,
        'date' => $date,
        'note' => (string) ($data['note'] ?? ''),
        'photoUrl' => $data['photoUrl'] ?? null,
        'photoName' => $data['photoName'] ?? null,
        'createdAt' => $data['createdAt'] ?? null,
        'updatedAt' => $data['updatedAt'] ?? null,
    ];
}

/** Ubah hasil query (dateKey => data) menjadi daftar jurnal, terbaru dulu. */
function formatJournalList(mixed $value): array
{
    if (!is_array($value)) {
        return [];
    }
    krsort($value, SORT_STRING);
    $list = [];
    foreach ($value as $date => $data) {
        if (is_array($data)) {
            $list[] = formatJournal((string) $date, $data);
        }
    }
    return $list;
}

/**
 * Hitung streak dari daftar tanggal yang punya jurnal.
 *
 * Streak dihitung mundur dari hari ini. Jika hari ini belum ada jurnal, hitungan dimulai
 * dari kemarin, sehingga streak tidak terputus sebelum hari berakhir.
 * lastDays berisi status 5 hari terakhir untuk tampilan dashboard.
 */
function computeStreak(array $dates): array
{
    $filled = array_flip($dates);
    $today = journalToday();
    $key = fn (int $daysAgo) => $today->modify("-{$daysAgo} day")->format('Y-m-d');

    $count = isset($filled[$key(0)]) ? 1 : 0;
    for ($i = 1; isset($filled[$key($i)]); $i++) {
        $count++;
    }

    $lastDays = [];
    foreach ([4, 3, 2, 1, 0] as $daysAgo) {
        $date = $key($daysAgo);
        $lastDays[] = ['date' => $date, 'done' => isset($filled[$date]), 'isToday' => $daysAgo === 0];
    }

    return ['count' => $count, 'lastDays' => $lastDays];
}

/** Semua tanggal yang punya jurnal milik pengguna (dari journalDates, node kecil berisi true). */
function journalDates(Database $database, string $uid): array
{
    $value = $database->getReference('journalDates/' . $uid)->getValue();
    return is_array($value) ? array_map('strval', array_keys($value)) : [];
}

/** Perbarui users/{uid}/stats setelah jurnal dibuat atau dihapus. */
function refreshJournalStats(Database $database, string $uid): array
{
    $dates = journalDates($database, $uid);
    $streak = computeStreak($dates);
    rsort($dates, SORT_STRING);

    $database->getReference('users/' . $uid . '/stats')->set([
        'streak' => $streak['count'],
        'lastCheckIn' => $dates[0] ?? null,
    ]);
    return $streak;
}
