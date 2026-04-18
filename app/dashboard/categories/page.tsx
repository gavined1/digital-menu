import { createClient } from "@/lib/supabase/server";
import CategoriesManager from "./CategoriesManager";

export type CategoryRow = { id: number; name: string; sort_order: number };

export default async function DashboardCategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });
  const categories = (data ?? []) as CategoryRow[];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
        Categories
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Add, reorder, and edit menu categories. Order is used on the public menu.
      </p>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
