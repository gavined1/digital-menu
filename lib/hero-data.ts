import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type HeroSection = {
  logoUrl: string | null;
  name: string;
  badgeText: string;
  locationText: string;
  title: string;
  subtitle: string;
  backgroundImageUrl: string;
};

type HeroRow = {
  logo_url: string | null;
  name: string | null;
  badge_text: string;
  location_text: string;
  title: string;
  subtitle: string;
  background_image_url: string;
};

const DEFAULT_HERO: HeroSection = {
  logoUrl: null,
  name: "NOVA",
  badgeText: "Open Now",
  locationText: "Downtown",
  title: "Morning Rituals",
  subtitle:
    "Handcrafted espresso & artisan pastries in the heart of the city.",
  backgroundImageUrl:
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1920",
};

export const getHeroSection = cache(async (): Promise<HeroSection> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hero_section")
    .select("logo_url, name, badge_text, location_text, title, subtitle, background_image_url")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_HERO;

  const row = data as HeroRow;
  return {
    logoUrl: row.logo_url ?? DEFAULT_HERO.logoUrl,
    name: row.name ?? DEFAULT_HERO.name,
    badgeText: row.badge_text ?? DEFAULT_HERO.badgeText,
    locationText: row.location_text ?? DEFAULT_HERO.locationText,
    title: row.title ?? DEFAULT_HERO.title,
    subtitle: row.subtitle ?? DEFAULT_HERO.subtitle,
    backgroundImageUrl:
      row.background_image_url ?? DEFAULT_HERO.backgroundImageUrl,
  };
});
