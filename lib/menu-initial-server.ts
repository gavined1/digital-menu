import { unstable_cache } from "next/cache";
import { PUBLIC_MENU_CACHE_TAG } from "@/lib/cache-tags";
import { fetchMenuItemsPage } from "@/lib/fetch-menu-items-page";
import { getInitialMenuBatchSize } from "@/lib/menu-viewport";
import { createPublicSupabaseReadClient } from "@/lib/supabase/public-read";

/**
 * First menu page for "All", rendered on the server for faster first paint.
 * Cached across requests (60s) via anon client — invalidate with `revalidateTag(PUBLIC_MENU_CACHE_TAG)`.
 */
export async function getInitialMenuItemsForAllCategory() {
  return unstable_cache(
    async () => {
      const supabase = createPublicSupabaseReadClient();
      const limit = getInitialMenuBatchSize();
      return fetchMenuItemsPage(supabase, {
        afterId: null,
        limit,
        categoryId: null,
      });
    },
    ["public-menu-initial-all-v1"],
    { revalidate: 60, tags: [PUBLIC_MENU_CACHE_TAG] }
  )();
}
