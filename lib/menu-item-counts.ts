import { unstable_cache } from "next/cache";
import { PUBLIC_MENU_CACHE_TAG } from "@/lib/cache-tags";
import type { Category } from "@/lib/menu-data";
import { createPublicSupabaseReadClient } from "@/lib/supabase/public-read";

export type MenuItemCounts = {
  totalAll: number;
  byCategoryId: Record<number, number>;
};

async function fetchMenuItemCounts(categories: Category[]): Promise<MenuItemCounts> {
  const supabase = createPublicSupabaseReadClient();

  const { count: totalAll, error: totalErr } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true });

  if (totalErr) throw totalErr;

  const byCategoryId: Record<number, number> = {};
  await Promise.all(
    categories.map(async (c) => {
      const { count, error } = await supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .eq("category_id", c.id);
      if (error) throw error;
      byCategoryId[c.id] = count ?? 0;
    })
  );

  return { totalAll: totalAll ?? 0, byCategoryId };
}

/**
 * Exact menu item totals for the public menu badge (not limited to loaded scroll batches).
 * Cached with the same tag as the public menu payload so counts stay in sync after edits.
 */
export async function getMenuItemCounts(categories: Category[]): Promise<MenuItemCounts> {
  const cacheKey = categories
    .map((c) => c.id)
    .sort((a, b) => a - b)
    .join(",");

  return unstable_cache(
    () => fetchMenuItemCounts(categories),
    ["public-menu-item-counts", cacheKey],
    { revalidate: 60, tags: [PUBLIC_MENU_CACHE_TAG] }
  )();
}
