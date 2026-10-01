/**
 * Login Google lewat popup Firebase. ID token-nya dikirim ke backend PHP untuk diverifikasi
 * (login/registrasi) atau sebagai konfirmasi ulang (hapus akun).
 */

let authPromise = null;

async function getFirebaseAuth() {
  authPromise ??= (async () => {
    const response = await fetch("actions/get_firebase_web_config.php");
    const config = await response.json();
    if (!response.ok) {
      throw new Error(config.message || "Konfigurasi Firebase Web belum tersedia.");
    }

    const [{ initializeApp }, { getAuth }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
    ]);
    return getAuth(initializeApp(config));
  })();

  try {
    return await authPromise;
  } catch (error) {
    authPromise = null; // izinkan mencoba lagi
    throw error;
  }
}

/** Buka popup login Google dan kembalikan ID token akun yang dipilih. */
export async function getGoogleIdToken() {
  const auth = await getFirebaseAuth();
  const { GoogleAuthProvider, signInWithPopup } = await import(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
  );
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user.getIdToken();
}

/** Login/registrasi dengan Google: popup, lalu buat session di backend PHP. */
export async function signInWithGoogle() {
  const formData = new FormData();
  formData.append("idToken", await getGoogleIdToken());

  const response = await fetch("actions/google_login.php", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Verifikasi akun gagal.");
  }
}
