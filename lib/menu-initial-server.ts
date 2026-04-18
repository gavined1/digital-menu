import { createClient } from "@/lib/supabase/server";
import { fetchMenuItemsPage } from "@/lib/fetch-menu-items-page";
import { getInitialMenuBatchSize } from "@/lib/menu-viewport";

/**
 * First menu page for "All", rendered on the server for faster first paint.
 * Uses the same keyset pagination and batch size as the client (SSR batch size comes from `menu-viewport`).
 */
export async function getInitialMenuItemsForAllCategory() {
  const supabase = await createClient();
  const limit = getInitialMenuBatchSize();
  return fetchMenuItemsPage(supabase, {
    afterId: null,
    limit,
    categoryId: null,
  });
}
