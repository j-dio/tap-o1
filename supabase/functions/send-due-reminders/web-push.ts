/**
 * Web Push utility for Deno Edge Functions.
 *
 * Implements VAPID authentication (RFC 8292) and message encryption (RFC 8291)
 * using the Web Crypto API — no Node.js dependencies.
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

  // The uncompressed public key is 65 bytes: 0x04 || x (32) || y (32)
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

  // Convert DER signature to raw r||s (64 bytes)
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
  // DER: 0x30 <len> 0x02 <rLen> <r> 0x02 <sLen> <s>
  // But Web Crypto may return raw 64 bytes directly on some platforms
  if (der.length === 64) return der;

  const raw = new Uint8Array(64);
  let offset = 2; // skip 0x30 and total length

  // Read r
  offset++; // skip 0x02
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen > 32 ? 0 : 32 - rLen;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  // Read s
  offset++; // skip 0x02
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen > 32 ? 32 : 64 - sLen;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

/* ─── Content Encryption (RFC 8291 — aes128gcm) ─── */

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

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  // Export local public key (uncompressed, 65 bytes)
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey),
  );

  // Import subscriber public key
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256,
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();

  // IKM = HKDF(auth, sharedSecret, "WebPush: info" || 0x00 || subscriberKey || localKey, 32)
  const authInfo = concatUint8(
    encoder.encode("WebPush: info\0"),
    subscriberPublicKeyBytes,
    localPublicKeyRaw,
  );

  const authHkdfKey = await crypto.subtle.importKey(
    "raw",
    subscriberAuthBytes,
    "HKDF",
    false,
    ["deriveBits"],
  );

  // PRK from auth
  const prkBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      salt: sharedSecret,
      info: authInfo,
      hash: "SHA-256",
    },
    authHkdfKey,
    256,
  );
  const prk = new Uint8Array(prkBits);

  // Import PRK for deriving CEK and nonce
  const prkKey = await crypto.subtle.importKey("raw", prk, "HKDF", false, [
    "deriveBits",
  ]);

  // CEK = HKDF(salt, PRK, "Content-Encoding: aes128gcm" || 0x00, 16)
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const cekBits = await crypto.subtle.deriveBits(
    { name: "HKDF", salt, info: cekInfo, hash: "SHA-256" },
    prkKey,
    128,
  );

  // Nonce = HKDF(salt, PRK, "Content-Encoding: nonce" || 0x00, 12)
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", salt, info: nonceInfo, hash: "SHA-256" },
    prkKey,
    96,
  );

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(cekBits),
    "AES-GCM",
    false,
    ["encrypt"],
  );

  // Pad the plaintext: content || 0x02 (delimiter)
  const plaintext = concatUint8(encoder.encode(payload), new Uint8Array([2]));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: new Uint8Array(nonceBits) },
      aesKey,
      plaintext,
    ),
  );

  // Build aes128gcm payload:
  // salt (16) || rs (4, big-endian uint32) || idlen (1) || keyid (65) || ciphertext
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
      Urgency: "normal",
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
