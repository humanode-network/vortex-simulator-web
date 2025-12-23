type SameSite = "Lax" | "Strict" | "None";

export function parseCookieHeader(
  headerValue: string | null,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!headerValue) return map;
  for (const part of headerValue.split(";")) {
    const [rawKey, ...rawRest] = part.trim().split("=");
    if (!rawKey) continue;
    map.set(rawKey, decodeURIComponent(rawRest.join("=")));
  }
  return map;
}

export function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: SameSite;
    maxAgeSeconds?: number;
    path?: string;
  } = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? "/"}`);
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (typeof options.maxAgeSeconds === "number")
    parts.push(`Max-Age=${options.maxAgeSeconds}`);
  return parts.join("; ");
}
