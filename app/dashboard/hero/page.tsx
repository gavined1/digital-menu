import { getHeroSection } from "@/lib/hero-data";
import HeroEditor from "./HeroEditor";

export default async function DashboardHeroPage() {
  const hero = await getHeroSection();

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
        Hero section
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Edit the banner shown at the top of your menu (badge, title, images).
      </p>
      <HeroEditor
        initial={{
          badgeText: hero.badgeText,
          locationText: hero.locationText,
          title: hero.title,
          subtitle: hero.subtitle,
          backgroundImageUrl: hero.backgroundImageUrl,
          logoUrl: hero.logoUrl ?? "",
          name: hero.name,
        }}
      />
    </div>
  );
}
