import { MENU_ITEMS_BUCKET } from "./storage-constants";

/**
 * Returns the storage object path if the URL is from our menu-items bucket, else null.
 * Use from server or client with the appropriate base URL (e.g. NEXT_PUBLIC_SUPABASE_URL).
 */
export function getStoragePathFromPublicUrl(
  url: string,
  baseUrl: string,
  bucket = MENU_ITEMS_BUCKET
): string | null {
  if (!url?.trim() || !baseUrl) return null;
  const prefix = `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/`;
  const clean = url.split("?")[0].split("#")[0].trim();
  if (!clean.startsWith(prefix)) return null;
  const path = decodeURIComponent(clean.slice(prefix.length));
  return path || null;
}
