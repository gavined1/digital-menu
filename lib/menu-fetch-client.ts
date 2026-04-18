"use client";

import { createClient } from "@/lib/supabase/client";
import { formatKhmerRiel } from "@/lib/format-currency";
import type { MenuItem } from "./menu";

/** Items per infinite-scroll batch after the first viewport-sized load. */
export const SCROLL_BATCH_SIZE = 12;

type MenuRow = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  rating: string;
  time: string;
  categories: { name: string } | { name: string }[] | null;
};

function getCategoryName(categories: MenuRow["categories"]): string {
  if (!categories) return "";
  return Array.isArray(categories) ? categories[0]?.name ?? "" : categories.name;
}

function mapRow(row: MenuRow): MenuItem {
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
 * Fetch a slice of menu items by offset. Requests `limit + 1` rows to detect `hasMore`.
 * categoryId null = all categories.
 */
export async function fetchMenuRange(
  offset: number,
  limit: number,
  categoryId: number | null
): Promise<{ items: MenuItem[]; hasMore: boolean }> {
  const supabase = createClient();
  const from = offset;
  const to = offset + limit;

  let query = supabase
    .from("menu_items")
    .select("id, name, description, price, image, rating, time, categories(name)")
    .order("id", { ascending: true })
    .range(from, to);

  if (categoryId != null) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const rows = (data ?? []) as MenuRow[];
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = slice.map(mapRow);

  return { items, hasMore };
}
