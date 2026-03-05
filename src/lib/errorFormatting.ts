export function formatLoadError(
  error: string | null | undefined,
  fallback = "Request failed",
): string {
  const raw = (error ?? "").trim();
  if (!raw) return fallback;
  const stripped = raw.replace(/^HTTP\s+\d+\s*:\s*/i, "").trim();
  if (stripped) return stripped;
  return fallback;
}
