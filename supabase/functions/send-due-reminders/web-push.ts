/**
 * Web Push utility for Deno Edge Functions.
 *
 * Implements VAPID authentication (RFC 8292) and message encryption (RFC 8291)
 * using the Web Crypto API — no Node.js dependencies.
 *
 * Key derivation follows RFC 8291 §3.4: first HKDF-Extract/Expand combines
 * ECDH shared secret + auth secret; second stage uses the random salt per RFC 8188.
 */

/* ─── Helpers ─── */

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function concatUint8(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/** RFC 5869 HKDF-Extract: PRK = HMAC-Hash(salt, IKM); empty salt → HashLen zeros as HMAC key. */
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const macKeyMaterial = salt.length > 0 ? salt : new Uint8Array(32);
  const macKey = await crypto.subtle.importKey(
    "raw",
    macKeyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", macKey, ikm));
}

/** RFC 5869 HKDF-Expand (first L octets). */
async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const hashLen = 32;
  const n = Math.ceil(length / hashLen);
  const out = new Uint8Array(n * hashLen);
  const macKey = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  let t = new Uint8Array(0);
  for (let i = 0; i < n; i++) {
    const input = concatUint8(t, info, new Uint8Array([i + 1]));
    t = new Uint8Array(await crypto.subtle.sign("HMAC", macKey, input));
    out.set(t, i * hashLen);
  }
  return out.slice(0, length);
}

/* ─── VAPID JWT (ES256) ─── */

interface VapidKeys {
  privateKey: CryptoKey;
  publicKeyBytes: Uint8Array;
}

async function importVapidKeys(
  base64UrlPrivateKey: string,
  base64UrlPublicKey: string,
): Promise<VapidKeys> {
  const publicKeyBytes = base64UrlDecode(base64UrlPublicKey);

  const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
  const y = base64UrlEncode(publicKeyBytes.slice(33, 65));

  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d: base64UrlPrivateKey,
  };

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  return { privateKey, publicKeyBytes };
}

async function createVapidJwt(
  endpoint: string,
  subject: string,
  privateKey: CryptoKey,
  expSeconds = 12 * 60 * 60,
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: now + expSeconds,
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encoder.encode(unsignedToken),
  );

  const sigBytes = new Uint8Array(signature);
  const rawSig = derToRaw(sigBytes);
  const sigB64 = base64UrlEncode(rawSig);

  return `${unsignedToken}.${sigB64}`;
}

/**
 * Convert a DER-encoded ECDSA signature to raw r||s format (64 bytes).
 * Web Crypto returns DER format; Web Push expects raw.
 */
function derToRaw(der: Uint8Array): Uint8Array {
  if (der.length === 64) return der;

  const raw = new Uint8Array(64);
  let offset = 2;

  offset++;
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen > 32 ? 0 : 32 - rLen;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  offset++;
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen > 32 ? 32 : 64 - sLen;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

/* ─── Content Encryption (RFC 8291 §3.4 + RFC 8188 aes128gcm) ─── */

async function encryptPayload(
  payload: string,
  subscriberPublicKeyB64: string,
  subscriberAuthB64: string,
): Promise<{
  encrypted: Uint8Array;
  localPublicKey: Uint8Array;
  salt: Uint8Array;
}> {
  const subscriberPublicKeyBytes = base64UrlDecode(subscriberPublicKeyB64);
  const subscriberAuthBytes = base64UrlDecode(subscriberAuthB64);

  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey),
  );

  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256,
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  // §3.4: PRK_key = HKDF-Extract(salt=auth_secret, IKM=ecdh_secret);
  //       IKM_8188 = HKDF-Expand(PRK_key, key_info, 32)
  const keyInfo = concatUint8(
    encoder.encode("WebPush: info"),
    new Uint8Array([0]),
    subscriberPublicKeyBytes,
    localPublicKeyRaw,
  );
  const prkKey = await hkdfExtract(subscriberAuthBytes, sharedSecret);
  const ikmFor8188 = await hkdfExpand(prkKey, keyInfo, 32);

  // RFC 8188: PRK = HKDF-Extract(salt, IKM); CEK / nonce via HKDF-Expand
  const prk = await hkdfExtract(salt, ikmFor8188);
  const cekInfo = concatUint8(
    encoder.encode("Content-Encoding: aes128gcm"),
    new Uint8Array([0]),
  );
  const nonceInfo = concatUint8(
    encoder.encode("Content-Encoding: nonce"),
    new Uint8Array([0]),
  );
  const cek = await hkdfExpand(prk, cekInfo, 16);
  const nonce = await hkdfExpand(prk, nonceInfo, 12);

  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const plaintext = concatUint8(encoder.encode(payload), new Uint8Array([2]));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      plaintext,
    ),
  );

  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs, false);

  const encrypted = concatUint8(
    salt,
    rsBytes,
    new Uint8Array([localPublicKeyRaw.length]),
    localPublicKeyRaw,
    ciphertext,
  );

  return { encrypted, localPublicKey: localPublicKeyRaw, salt };
}

/* ─── Public API ─── */

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface SendPushResult {
  success: boolean;
  status?: number;
  gone?: boolean;
}

/**
 * Send a Web Push notification to a single subscription.
 */
export async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string,
): Promise<SendPushResult> {
  const { privateKey, publicKeyBytes } = await importVapidKeys(
    vapidPrivateKey,
    vapidPublicKey,
  );

  const jwt = await createVapidJwt(
    subscription.endpoint,
    vapidSubject,
    privateKey,
  );

  const vapidKeyB64 = base64UrlEncode(publicKeyBytes);

  const { encrypted } = await encryptPayload(
    payload,
    subscription.p256dh,
    subscription.auth,
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapidKeyB64}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: encrypted,
  });

  if (response.status === 410 || response.status === 404) {
    return { success: false, status: response.status, gone: true };
  }

  if (response.status >= 200 && response.status < 300) {
    return { success: true, status: response.status };
  }

  return { success: false, status: response.status, gone: false };
}
