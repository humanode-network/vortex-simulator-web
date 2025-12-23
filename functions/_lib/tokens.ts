import { base64UrlDecode, base64UrlEncode } from "./base64url.ts";

const encoder = new TextEncoder();

export type SignedTokenPayload = Record<string, unknown>;

export async function signToken(
  payload: SignedTokenPayload,
  secret: string,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const sig = await hmacSha256(data, secret);
  return `${data}.${base64UrlEncode(sig)}`;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<SignedTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = await hmacSha256(data, secret);
  const actualSig = base64UrlDecode(sigB64);
  if (!timingSafeEqual(expectedSig, actualSig)) return null;

  try {
    const payloadRaw = new TextDecoder().decode(base64UrlDecode(payloadB64));
    return JSON.parse(payloadRaw) as SignedTokenPayload;
  } catch {
    return null;
  }
}

async function hmacSha256(data: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
