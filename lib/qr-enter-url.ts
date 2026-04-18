/**
 * Validates that `url` is a same-origin link to the table QR entry route (/enter).
 */
export function isValidEnterUrl(url: string, baseOrigin: string): boolean {
  try {
    const parsed = new URL(url, baseOrigin);
    return parsed.origin === baseOrigin && parsed.pathname === "/enter";
  } catch {
    return false;
  }
}
