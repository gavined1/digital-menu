import type { SupabaseClient } from "@supabase/supabase-js";
import { formatKhmerRiel } from "@/lib/format-currency";
import type { MenuItem } from "@/lib/menu";

/** Items per infinite-scroll batch after the first viewport-sized load (client). */
export const SCROLL_BATCH_SIZE = 12;

export const MENU_ITEMS_SELECT =
  "id, name, description, price, image, rating, time, categories(name)" as const;

export type MenuItemRow = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  rating: string;
  time: string;
  categories: { name: string } | { name: string }[] | null;
};

function getCategoryName(
  categories: MenuItemRow["categories"]
): string {
  if (!categories) return "";
  return Array.isArray(categories)
    ? categories[0]?.name ?? ""
    : categories.name;
}

/** Maps a Supabase `menu_items` row to `MenuItem` (contract-tested). */
export function mapMenuRowToItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: formatKhmerRiel(row.price),
    category: getCategoryName(row.categories),
    image: row.image ?? "",
    rating: Number(row.rating),
    time: row.time,
  };
}

/**
 * Keyset pagination: `afterId` exclusive (null = first page). Fetches `limit + 1` to detect `hasMore`.
 */
export async function fetchMenuItemsPage(
  supabase: SupabaseClient,
  options: {
    afterId: number | null;
    limit: number;
    categoryId: number | null;
  }
): Promise<{ items: MenuItem[]; hasMore: boolean }> {
  const { afterId, limit, categoryId } = options;

  let query = supabase
    .from("menu_items")
    .select(MENU_ITEMS_SELECT)
    .order("id", { ascending: true })
    .limit(limit + 1);

  if (categoryId != null) {
    query = query.eq("category_id", categoryId);
  }
  if (afterId != null) {
    query = query.gt("id", afterId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const rows = (data ?? []) as MenuItemRow[];
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = slice.map(mapMenuRowToItem);

  return { items, hasMore };
}
