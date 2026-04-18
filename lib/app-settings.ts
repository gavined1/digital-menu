import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AppSettings = {
  maxTables: number;
};

export const getAppSettings = cache(async (): Promise<AppSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("max_tables")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { maxTables: 10 };
  }
  const raw = (data as { max_tables: number }).max_tables;
  return { maxTables: Math.max(1, Math.min(100, Number(raw) ?? 10)) };
});
