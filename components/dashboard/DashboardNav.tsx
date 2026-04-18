"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  FolderTree,
  UtensilsCrossed,
  QrCode,
  LogOut,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/hero", label: "Hero", icon: Image },
  { href: "/dashboard/categories", label: "Categories", icon: FolderTree },
  { href: "/dashboard/menu-items", label: "Menu items", icon: UtensilsCrossed },
  { href: "/dashboard/qr", label: "Table URLs", icon: QrCode },
  { href: "/dashboard/export-import", label: "Export / import", icon: Download },
];

export default function DashboardNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-serif font-bold text-zinc-900 dark:text-white">
          Menu Dashboard
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          {userEmail}
        </p>
      </div>
      <nav className="p-2 flex-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
