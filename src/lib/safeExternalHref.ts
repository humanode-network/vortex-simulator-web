const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function safeExternalHref(rawHref: string): string | null {
  try {
    const href = new URL(rawHref.trim());
    return SAFE_EXTERNAL_PROTOCOLS.has(href.protocol) ? href.href : null;
  } catch {
    return null;
  }
}
