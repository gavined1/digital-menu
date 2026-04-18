import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Category = { id: number; name: string };

export const getCategories = cache(async (): Promise<{
  categories: Category[];
  categoryNames: string[];
}> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const categories = (data ?? []) as Category[];
  const categoryNames = ["All", ...categories.map((c) => c.name)];

  return { categories, categoryNames };
});
