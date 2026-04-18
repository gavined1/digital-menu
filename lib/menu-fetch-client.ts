"use client";

import { createClient } from "@/lib/supabase/client";
import { fetchMenuItemsPage } from "@/lib/fetch-menu-items-page";

export { SCROLL_BATCH_SIZE } from "@/lib/fetch-menu-items-page";

/**
 * Browser fetch for menu list. Pass `afterId` from the last loaded item's `id`, or `null` for the first page.
 */
export async function fetchMenuRange(
  afterId: number | null,
  limit: number,
  categoryId: number | null
) {
  const supabase = createClient();
  return fetchMenuItemsPage(supabase, { afterId, limit, categoryId });
}
