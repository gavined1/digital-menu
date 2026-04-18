import { createClient } from "@/lib/supabase/server";
import MenuItemsManager from "./MenuItemsManager";

export type MenuItemRow = {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  rating: number | null;
  time: string | null;
};

export type CategoryOption = { id: number; name: string };

export default async function DashboardMenuItemsPage() {
  const supabase = await createClient();
  const [
    { data: itemsData },
    { data: categoriesData },
  ] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, image, rating, time")
      .order("id", { ascending: false }),
    supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
  ]);
  const items = (itemsData ?? []) as MenuItemRow[];
  const categories = (categoriesData ?? []) as CategoryOption[];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
        Menu items
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Add and edit dishes. Assign each item to a category.
      </p>
      <MenuItemsManager
        initialItems={items}
        categories={categories}
      />
    </div>
  );
}
