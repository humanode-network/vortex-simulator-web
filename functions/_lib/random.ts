export function randomHex(bytes: number): string {
  const out = new Uint8Array(bytes);
  crypto.getRandomValues(out);
  return [...out].map((b) => b.toString(16).padStart(2, "0")).join("");
}
