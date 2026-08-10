/**
 * Entrar con huella en la PWA (WebAuthn + credenciales cifradas).
 *
 * Cómo funciona:
 *  1. Al activarla, el navegador crea una "passkey" en el equipo (huella / rostro / PIN).
 *  2. Guardamos el correo y la contraseña cifrados con AES-GCM (WebCrypto). La llave de
 *     cifrado es NO EXTRAÍBLE y vive en IndexedDB: el JavaScript no puede leerla ni copiarla.
 *  3. Para entrar, el navegador pide la huella; solo si es correcta desciframos y hacemos login.
 *
 * Nota honesta: un navegador no tiene un Keystore por hardware como Android, así que esto
 * protege bien frente a robo casual, pero no equivale al cifrado del sistema operativo.
 */

const DB = 'jormard_secure';
const STORE = 'keys';
const KEY_ID = 'aes-key';
const LS_CRED = 'bio_cred';      // credencial cifrada
const LS_PASSKEY = 'bio_passkey'; // id de la passkey
const LS_EMAIL = 'bio_email';     // correo (visible, para mostrarlo en el login)

// ── IndexedDB para guardar la llave AES no extraíble ──
function abrirDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function guardarLlave(key: CryptoKey) {
  const db = await abrirDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(key, KEY_ID);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function leerLlave(): Promise<CryptoKey | null> {
  try {
    const db = await abrirDB();
    return new Promise((res) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY_ID);
      req.onsuccess = () => res((req.result as CryptoKey) ?? null);
      req.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

async function borrarLlave() {
  try {
    const db = await abrirDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY_ID);
  } catch { /* nada */ }
}

// ── Utilidades ──
const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const desb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** ¿El equipo puede usar huella / rostro / PIN? */
export async function biometriaDisponible(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function biometriaActiva(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(LS_CRED) && !!localStorage.getItem(LS_PASSKEY);
}

export function emailGuardado(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LS_EMAIL);
}

/**
 * Activa la entrada con huella: crea la passkey y guarda las credenciales cifradas.
 * Devuelve true si todo salió bien.
 */
export async function activarBiometria(email: string, password: string): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Bodega Jormard', id: window.location.hostname },
        user: { id: userId, name: email, displayName: email },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!cred) return false;

    // Llave AES no extraíble para cifrar las credenciales
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const datos = new TextEncoder().encode(JSON.stringify({ email, password }));
    const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, datos);

    await guardarLlave(key);
    localStorage.setItem(LS_CRED, JSON.stringify({ iv: b64(iv.buffer), data: b64(cifrado) }));
    localStorage.setItem(LS_PASSKEY, b64(cred.rawId));
    localStorage.setItem(LS_EMAIL, email);
    return true;
  } catch (e) {
    console.warn('No se pudo activar la biometría', e);
    return false;
  }
}

/**
 * Pide la huella y devuelve las credenciales guardadas.
 * Devuelve null si el usuario cancela o falla.
 */
export async function entrarConBiometria(): Promise<{ email: string; password: string } | null> {
  try {
    const idPasskey = localStorage.getItem(LS_PASSKEY);
    const guardado = localStorage.getItem(LS_CRED);
    if (!idPasskey || !guardado) return null;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const ok = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: desb64(idPasskey) }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    if (!ok) return null;

    const key = await leerLlave();
    if (!key) return null;

    const { iv, data } = JSON.parse(guardado);
    const claro = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: desb64(iv) },
      key,
      desb64(data)
    );
    return JSON.parse(new TextDecoder().decode(claro));
  } catch (e) {
    console.warn('Fallo la entrada con huella', e);
    return null;
  }
}

/** Desactiva la entrada con huella y borra todo lo guardado. */
export async function desactivarBiometria() {
  localStorage.removeItem(LS_CRED);
  localStorage.removeItem(LS_PASSKEY);
  localStorage.removeItem(LS_EMAIL);
  await borrarLlave();
}
