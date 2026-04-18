/**
 * Signed 12H access cookie for table QR flow.
 * Uses Web Crypto so it works in Edge (middleware) and Node.
 * Cookie value: base64url(payload).base64url(signature)
 */

const COOKIE_NAME = "menu_access";
const MAX_AGE_SEC = 12 * 60 * 60; // 12 hours

function getSecret(required: boolean = true): string {
  const secret = process.env.MENU_ACCESS_SECRET ?? "";
  if (required && (!secret || secret.length < 16)) {
    throw new Error(
      "MENU_ACCESS_SECRET must be set and at least 16 characters (e.g. openssl rand -base64 24)"
    );
  }
  return secret;
}

function base64UrlEncode(data: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(data, "utf8").toString("base64url");
  }
  const bin = new TextEncoder().encode(data);
  return btoa(String.fromCharCode(...bin))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf8");
  }
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);
  const bin = Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bin);
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const bytes = new Uint8Array(sig);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmacVerify(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = (() => {
    const raw = signature.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(raw);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  })();
  return crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(payload)
  );
}

export function getAccessCookieName(): string {
  return COOKIE_NAME;
}

export async function createAccessCookieValue(): Promise<string> {
  const secret = getSecret(true);
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = JSON.stringify({ exp });
  const encoded = base64UrlEncode(payload);
  const signature = await hmacSign(encoded, secret);
  return `${encoded}.${signature}`;
}

/** Use in middleware (Edge) and server. Returns true if cookie is valid and not expired. */
export async function verifyAccessCookieValue(value: string): Promise<boolean> {
  try {
    const secret = getSecret(false);
    if (!secret || secret.length < 16) return false;
    const [encoded, sig] = value.split(".");
    if (!encoded || !sig) return false;
    const valid = await hmacVerify(encoded, sig, secret);
    if (!valid) return false;
    const payload = JSON.parse(base64UrlDecode(encoded)) as { exp: number };
    return (
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function getAccessCookieMaxAge(): number {
  return MAX_AGE_SEC;
}
