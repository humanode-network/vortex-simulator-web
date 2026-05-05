const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_MAP = new Map(
  [...BASE58_ALPHABET].map((char, index) => [char, index]),
);

function bytesToHex(bytes: Uint8Array): string {
  return `0x${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function decodeBase58(value: string): Uint8Array | null {
  let bytes = [0];
  for (const char of value) {
    const value = BASE58_MAP.get(char);
    if (value === undefined) return null;
    let carry = value;
    for (let i = 0; i < bytes.length; i += 1) {
      const next = bytes[i] * 58 + carry;
      bytes[i] = next & 0xff;
      carry = next >> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (const char of value) {
    if (char !== "1") break;
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

function ss58PublicKeyHex(address: string): string | null {
  const decoded = decodeBase58(address);
  if (!decoded) return null;
  const prefixLength = decoded[0] < 64 ? 1 : decoded[0] < 128 ? 2 : 0;
  if (prefixLength === 0) return null;
  const keyStart = prefixLength;
  const keyEnd = keyStart + 32;
  if (decoded.length < keyEnd + 1) return null;
  return bytesToHex(decoded.slice(keyStart, keyEnd));
}

export function addressIdentityKey(address: string | null | undefined): string {
  const normalized = (address ?? "").trim();
  if (!normalized) return "";
  return ss58PublicKeyHex(normalized) ?? normalized.toLowerCase();
}

export function addressesReferToSameIdentity(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const leftKey = addressIdentityKey(left);
  const rightKey = addressIdentityKey(right);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}
