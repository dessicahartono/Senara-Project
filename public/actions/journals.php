<?php
/**
 * Jurnal harian milik pengguna yang sedang login (satu jurnal per tanggal).
 *
 * GET ?month=yyyy-mm   - daftar jurnal pada bulan itu, terbaru dulu.
 * GET ?date=yyyy-mm-dd - jurnal pada tanggal itu, atau null.
 * GET ?latest=1        - jurnal terbaru, atau null.
 * POST                 - buat atau perbarui jurnal: date, note, photo (file, opsional), removePhoto ("1").
 */
declare(strict_types=1);

require_once __DIR__ . '/../../src/session.php';

$uid = requireLoginUid();

require_once __DIR__ . '/../../config/firebase_config.php';
require_once __DIR__ . '/../../src/users.php';
require_once __DIR__ . '/../../src/journals.php';
require_once __DIR__ . '/../../src/cloudinary.php';

/** Foto biasanya sudah dikompres di browser (photoService.js); batas ini hanya pengaman. */
const JOURNAL_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

$journals = $database->getReference('journals/' . $uid);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if (isset($_GET['month'])) {
            $month = (string) $_GET['month'];
            if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
                jsonResponse(['success' => false, 'message' => 'Format bulan tidak valid.'], 400);
            }
            // Kunci jurnal berupa tanggal, jadi satu bulan cukup diambil dengan rentang kunci.
            $value = $journals->orderByKey()->startAt($month . '-01')->endAt($month . '-31')->getValue();
            jsonResponse(['success' => true, 'journals' => formatJournalList($value)]);
        }

        if (isset($_GET['date'])) {
            $date = (string) $_GET['date'];
            if (!isValidDateKey($date)) {
                jsonResponse(['success' => false, 'message' => 'Format tanggal tidak valid.'], 400);
            }
            $value = $journals->getChild($date)->getValue();
            jsonResponse(['success' => true, 'journal' => is_array($value) ? formatJournal($date, $value) : null]);
        }

        if (isset($_GET['latest'])) {
            $list = formatJournalList($journals->orderByKey()->limitToLast(1)->getValue());
            jsonResponse(['success' => true, 'journal' => $list[0] ?? null]);
        }
    } catch (Throwable $error) {
        error_log('Journal read failed: ' . $error->getMessage());
        jsonResponse(['success' => false, 'message' => 'Jurnal gagal dimuat. Coba lagi beberapa saat lagi.'], 500);
    }

    jsonResponse(['success' => false, 'message' => 'Parameter month, date, atau latest wajib diisi.'], 400);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    jsonResponse(['success' => false, 'message' => 'Metode tidak didukung.'], 405);
}

// ---------- Simpan jurnal ----------

$date = (string) ($_POST['date'] ?? '');
$note = trim((string) ($_POST['note'] ?? ''));
$removePhoto = ($_POST['removePhoto'] ?? '') === '1';
$hasNewPhoto = isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE;

if (!isValidDateKey($date)) {
    jsonResponse(['success' => false, 'message' => 'Format tanggal tidak valid.'], 400);
}
// Toleransi satu hari untuk pengguna di zona waktu yang lebih maju dari WIB.
if ($date > journalToday()->modify('+1 day')->format('Y-m-d')) {
    jsonResponse(['success' => false, 'message' => 'Jurnal tidak bisa dibuat untuk tanggal yang belum terjadi.'], 400);
}
if (mb_strlen($note) > JOURNAL_NOTE_MAX) {
    jsonResponse(['success' => false, 'message' => 'Catatan maksimal ' . JOURNAL_NOTE_MAX . ' karakter.'], 400);
}

$photoPath = null;
if ($hasNewPhoto) {
    try {
        $photoPath = validatedUploadedPhoto($_FILES['photo'], JOURNAL_PHOTO_MAX_BYTES);
    } catch (InvalidArgumentException $error) {
        jsonResponse(['success' => false, 'message' => $error->getMessage()], 400);
    }
}

try {
    ensureUserProfile($auth, $database, $uid);

    $existing = $journals->getChild($date)->getValue();
    $existing = is_array($existing) ? $existing : null;

    $photoUrl = $existing['photoUrl'] ?? null;
    $photoName = $existing['photoName'] ?? null;
    $photoId = 'journals/' . $uid . '/' . $date;

    // Dicek sebelum menyentuh Cloudinary agar foto lama tidak terhapus saat penyimpanan ditolak.
    $keepsPhoto = $photoPath !== null || ($photoUrl !== null && !$removePhoto);
    if ($note === '' && !$keepsPhoto) {
        jsonResponse(['success' => false, 'message' => 'Isi catatan atau tambahkan foto terlebih dahulu.'], 400);
    }

    if ($photoPath !== null) {
        // Foto baru menimpa foto lama di public_id yang sama.
        $photoUrl = cloudinaryUpload($photoPath, $photoId)['url'];
        $photoName = mb_substr(basename((string) $_FILES['photo']['name']), 0, 120);
    } elseif ($removePhoto && $photoUrl !== null) {
        cloudinaryDestroy(CLOUDINARY_ROOT . '/' . $photoId);
        $photoUrl = null;
        $photoName = null;
    }

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $journal = [
        'note' => $note,
        'photoUrl' => $photoUrl,
        'photoName' => $photoName,
        'createdAt' => $existing['createdAt'] ?? $now,
        'updatedAt' => $now,
    ];

    // Jurnal dan penanda kalendernya ditulis sekaligus agar selalu konsisten.
    $database->getReference()->update([
        'journals/' . $uid . '/' . $date => $journal,
        'journalDates/' . $uid . '/' . $date => true,
    ]);
    refreshJournalStats($database, $uid);
} catch (Throwable $error) {
    error_log('Journal save failed: ' . $error->getMessage());
    jsonResponse(['success' => false, 'message' => 'Jurnal gagal disimpan. Coba lagi beberapa saat lagi.'], 500);
}

jsonResponse(['success' => true, 'journal' => formatJournal($date, $journal)]);
