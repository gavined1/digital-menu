"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import {
  DIGIMENU_EXPORT_VERSION,
  type DigimenuExportV1,
  parseDigimenuExport,
} from "@/lib/menu-export";
import { getStoragePathFromPublicUrl } from "@/lib/storage-utils";
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES, MENU_ITEMS_BUCKET } from "@/lib/storage-constants";

function revalidateMenuData() {
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hero");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/menu-items");
  revalidatePath("/dashboard/export-import");
}

export type HeroForm = {
  badgeText: string;
  locationText: string;
  title: string;
  subtitle: string;
  backgroundImageUrl: string;
  logoUrl: string;
  name: string;
};

export async function updateHero(form: HeroForm) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hero_section")
    .update({
      badge_text: form.badgeText,
      location_text: form.locationText,
      title: form.title,
      subtitle: form.subtitle,
      background_image_url: form.backgroundImageUrl || null,
      logo_url: form.logoUrl || null,
      name: form.name || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hero");
  return {};
}

export async function createCategory(name: string, sortOrder: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  return { id: data.id };
}

export async function updateCategory(id: number, name: string, sortOrder: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, sort_order: sortOrder })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  return {};
}

export async function reorderCategories(
  updates: { id: number; sort_order: number }[]
) {
  const supabase = await createClient();
  for (const { id, sort_order } of updates) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order })
      .eq("id", id);
    if (error) return { error: error.message };
  }
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  return {};
}

export async function deleteCategory(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/menu-items");
  return {};
}

export type MenuItemForm = {
  categoryId: number;
  name: string;
  description: string;
  price: string;
  image: string;
  rating: number;
  time: string;
};

export async function createMenuItem(form: MenuItemForm) {
  const supabase = await createClient();
  const priceNum = parseFloat(form.price) || 0;
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id: form.categoryId,
      name: form.name,
      description: form.description || null,
      price: priceNum,
      image: form.image || null,
      rating: form.rating ?? null,
      time: form.time || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/menu-items");
  return { id: data.id };
}

export async function updateMenuItem(id: number, form: MenuItemForm) {
  const supabase = await createClient();
  const priceNum = parseFloat(form.price) || 0;
  const { error } = await supabase
    .from("menu_items")
    .update({
      category_id: form.categoryId,
      name: form.name,
      description: form.description || null,
      price: priceNum,
      image: form.image || null,
      rating: form.rating ?? null,
      time: form.time || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/menu-items");
  return {};
}

export async function deleteMenuItem(id: number) {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { data: row } = await supabase
    .from("menu_items")
    .select("image")
    .eq("id", id)
    .maybeSingle();
  if (row?.image && baseUrl) {
    const path = getStoragePathFromPublicUrl(row.image, baseUrl);
    if (path) {
      await supabase.storage.from(MENU_ITEMS_BUCKET).remove([path]);
    }
  }
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/menu");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/menu-items");
  return {};
}

export async function uploadMenuItemImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) return { error: "No file provided" };
  if (file.size > MAX_FILE_BYTES) return { error: "File too large (max 10MB)" };
  const type = file.type?.toLowerCase();
  if (!type || !ALLOWED_MIME_TYPES.includes(type)) return { error: "Allowed types: JPEG, PNG, GIF, WebP" };

  const supabase = await createClient();
  const ext = type.replace("image/", "") === "jpeg" ? "jpg" : type.replace("image/", "");
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(MENU_ITEMS_BUCKET).upload(path, file, {
    contentType: type,
    upsert: false,
  });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from(MENU_ITEMS_BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl };
}

export async function updateMaxTables(maxTables: number) {
  const n = Math.max(1, Math.min(100, Math.round(maxTables)));
  const supabase = await createClient();
  // Use RPC so the DB function (SECURITY DEFINER) runs without RLS blocking it
  const { error } = await supabase.rpc("set_app_max_tables", { n });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/qr");
  return {};
}

export async function exportMenuSnapshot(): Promise<{ json?: string; error?: string }> {
  const supabase = await createClient();
  const [{ data: heroRow }, { data: cats }, { data: items }] = await Promise.all([
    supabase
      .from("hero_section")
      .select(
        "logo_url, name, badge_text, location_text, title, subtitle, background_image_url"
      )
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("categories").select("id, name, sort_order").order("sort_order", {
      ascending: true,
    }),
    supabase
      .from("menu_items")
      .select("name, description, price, image, rating, time, categories(name)")
      .order("id", { ascending: true }),
  ]);

  const hero = {
    name: (heroRow as { name?: string | null } | null)?.name ?? "",
    badgeText: (heroRow as { badge_text?: string } | null)?.badge_text ?? "",
    locationText: (heroRow as { location_text?: string } | null)?.location_text ?? "",
    title: (heroRow as { title?: string } | null)?.title ?? "",
    subtitle: (heroRow as { subtitle?: string } | null)?.subtitle ?? "",
    backgroundImageUrl:
      (heroRow as { background_image_url?: string } | null)?.background_image_url ?? "",
    logoUrl: (heroRow as { logo_url?: string | null } | null)?.logo_url ?? "",
  };

  const categories = (cats ?? []).map((c) => ({
    name: (c as { name: string }).name,
    sortOrder: (c as { sort_order: number }).sort_order,
  }));

  const menuItems: DigimenuExportV1["menuItems"] = [];
  for (const row of items ?? []) {
    const r = row as {
      name: string;
      description: string | null;
      price: number;
      image: string | null;
      rating: number | null;
      time: string | null;
      categories: { name: string } | { name: string }[] | null;
    };
    const catName = Array.isArray(r.categories)
      ? r.categories[0]?.name ?? ""
      : r.categories?.name ?? "";
    if (!catName) continue;
    menuItems.push({
      categoryName: catName,
      name: r.name,
      description: r.description,
      price: r.price,
      image: r.image,
      rating: r.rating,
      time: r.time,
    });
  }

  const payload: DigimenuExportV1 = {
    version: DIGIMENU_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    hero,
    categories,
    menuItems,
  };

  return { json: JSON.stringify(payload, null, 2) };
}

export async function importMenuSnapshot(
  jsonText: string,
  mode: "replace" | "merge"
): Promise<{
  error?: string;
  importedCategories?: number;
  importedItems?: number;
  skippedItems?: number;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    return { error: "Invalid JSON." };
  }
  const result = parseDigimenuExport(parsed);
  if (!result.ok) return { error: result.error };
  const data = result.data;

  const supabase = await createClient();

  if (mode === "replace") {
    const { error: delItems } = await supabase.from("menu_items").delete().neq("id", 0);
    if (delItems) return { error: delItems.message };
    const { error: delCats } = await supabase.from("categories").delete().neq("id", 0);
    if (delCats) return { error: delCats.message };

    const sortedCats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const nameToId = new Map<string, number>();
    for (let i = 0; i < sortedCats.length; i++) {
      const c = sortedCats[i];
      const { data: inserted, error } = await supabase
        .from("categories")
        .insert({ name: c.name, sort_order: i })
        .select("id")
        .single();
      if (error || !inserted) return { error: error?.message ?? "Failed to insert category." };
      nameToId.set(c.name, (inserted as { id: number }).id);
    }

    let itemCount = 0;
    for (const item of data.menuItems) {
      const categoryId = nameToId.get(item.categoryName);
      if (categoryId === undefined) {
        return { error: `Unknown category "${item.categoryName}" for item "${item.name}".` };
      }
      const { error } = await supabase.from("menu_items").insert({
        category_id: categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        rating: item.rating,
        time: item.time,
      });
      if (error) return { error: error.message };
      itemCount++;
    }

    const { error: heroErr } = await supabase
      .from("hero_section")
      .update({
        badge_text: data.hero.badgeText,
        location_text: data.hero.locationText,
        title: data.hero.title,
        subtitle: data.hero.subtitle,
        background_image_url: data.hero.backgroundImageUrl || null,
        logo_url: data.hero.logoUrl || null,
        name: data.hero.name || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (heroErr) return { error: heroErr.message };

    revalidateMenuData();
    return {
      importedCategories: sortedCats.length,
      importedItems: itemCount,
    };
  }

  const { data: existingCats } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });
  const nameToId = new Map<string, number>();
  let maxSort = -1;
  for (const c of existingCats ?? []) {
    const row = c as { id: number; name: string; sort_order: number };
    nameToId.set(row.name, row.id);
    maxSort = Math.max(maxSort, row.sort_order);
  }

  let newCatCount = 0;
  const sortedImportCats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const c of sortedImportCats) {
    if (nameToId.has(c.name)) continue;
    maxSort += 1;
    const { data: inserted, error } = await supabase
      .from("categories")
      .insert({ name: c.name, sort_order: maxSort })
      .select("id")
      .single();
    if (error || !inserted) return { error: error?.message ?? "Failed to insert category." };
    nameToId.set(c.name, (inserted as { id: number }).id);
    newCatCount++;
  }

  const { data: existingItems } = await supabase
    .from("menu_items")
    .select("id, name, category_id");
  const existingKeys = new Set(
    (existingItems ?? []).map((r) => {
      const row = r as { name: string; category_id: number };
      return `${row.category_id}:${row.name}`;
    })
  );

  let itemCount = 0;
  let skipped = 0;
  for (const item of data.menuItems) {
    const categoryId = nameToId.get(item.categoryName);
    if (categoryId === undefined) {
      return { error: `Unknown category "${item.categoryName}" for item "${item.name}".` };
    }
    const key = `${categoryId}:${item.name}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from("menu_items").insert({
      category_id: categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      rating: item.rating,
      time: item.time,
    });
    if (error) return { error: error.message };
    existingKeys.add(key);
    itemCount++;
  }

  revalidateMenuData();
  return {
    importedCategories: newCatCount,
    importedItems: itemCount,
    skippedItems: skipped,
  };
}
