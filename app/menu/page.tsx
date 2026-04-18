import MenuPageClient from "@/components/MenuPageClient";
import PageSkeleton from "@/components/PageSkeleton";
import { getHeroSection } from "@/lib/hero-data";
import { getCategories } from "@/lib/menu-data";
import { getInitialMenuItemsForAllCategory } from "@/lib/menu-initial-server";
import { Suspense } from "react";

async function MenuPageWithData() {
  const [hero, { categories, categoryNames }, initialMenu] = await Promise.all([
    getHeroSection(),
    getCategories(),
    getInitialMenuItemsForAllCategory(),
  ]);
  return (
    <MenuPageClient
      hero={hero}
      categories={categories}
      categoryNames={categoryNames}
      initialMenu={initialMenu}
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
