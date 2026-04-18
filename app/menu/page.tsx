import MenuPageClient from "@/components/MenuPageClient";
import PageSkeleton from "@/components/PageSkeleton";
import { getHeroSection } from "@/lib/hero-data";
import { getCategories } from "@/lib/menu-data";
import { Suspense } from "react";

async function MenuPageWithData() {
  const [hero, { categories, categoryNames }] = await Promise.all([
    getHeroSection(),
    getCategories(),
  ]);
  return (
    <MenuPageClient
      hero={hero}
      categories={categories}
      categoryNames={categoryNames}
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
