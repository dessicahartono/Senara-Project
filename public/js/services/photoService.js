/**
 * Kompres foto (jurnal & avatar) di browser sebelum dikirim ke backend.
 */
/** Pengaturan kompres foto. */
const MAX_WIDTH = 1080;
const QUALITY = 0.8;

/**
 * Kecilkan foto ke lebar maks 1080 px dan kompres ke WebP (cadangan JPEG, kualitas 0.8).
 * Foto yang lebih kecil dari 1080 px tidak diperbesar.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressPhoto(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.");
  }

  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  // Latar putih agar area transparan (PNG) tidak menjadi hitam saat jatuh ke JPEG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Browser yang belum bisa membuat WebP (mis. Safari lama) diam-diam mengembalikan PNG
  let blob = await toBlob(canvas, "image/webp");
  if (blob?.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
  if (!blob) throw new Error("Foto gagal diproses. Coba foto lain.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}

function toBlob(canvas, type) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}
