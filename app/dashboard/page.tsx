import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Image, FolderTree, UtensilsCrossed, QrCode, Download } from "lucide-react";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const [
    { count: categoriesCount },
    { count: menuItemsCount },
  ] = await Promise.all([
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("menu_items").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      href: "/dashboard/hero",
      label: "Hero",
      count: "1 section",
      icon: Image,
    },
    {
      href: "/dashboard/categories",
      label: "Categories",
      count: `${categoriesCount ?? 0} categories`,
      icon: FolderTree,
    },
    {
      href: "/dashboard/menu-items",
      label: "Menu items",
      count: `${menuItemsCount ?? 0} items`,
      icon: UtensilsCrossed,
    },
    {
      href: "/dashboard/qr",
      label: "Table URLs",
      count: "Copy for QR",
      icon: QrCode,
    },
    {
      href: "/dashboard/export-import",
      label: "Export / import",
      count: "JSON backup",
      icon: Download,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
        Overview
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Manage your digital menu from here.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ href, label, count, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Icon size={24} />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">{label}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{count}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
