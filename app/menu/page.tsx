import MenuPageClient from "@/components/MenuPageClient";
import PageSkeleton from "@/components/PageSkeleton";
import { getHeroSection } from "@/lib/hero-data";
import { getMenuItemCounts } from "@/lib/menu-item-counts";
import { getCategories } from "@/lib/menu-data";
import { getInitialMenuItemsForAllCategory } from "@/lib/menu-initial-server";
import { Suspense } from "react";

async function MenuPageWithData() {
  const [{ categories, categoryNames }, hero, initialMenu] = await Promise.all([
    getCategories(),
    getHeroSection(),
    getInitialMenuItemsForAllCategory(),
  ]);
  const itemCounts = await getMenuItemCounts(categories);
  return (
    <MenuPageClient
      hero={hero}
      categories={categories}
      categoryNames={categoryNames}
      initialMenu={initialMenu}
      itemCounts={itemCounts}
    />
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MenuPageWithData />
    </Suspense>
  );
}
