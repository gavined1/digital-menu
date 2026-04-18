/** Digimenu backup format — keep in sync with export/import server actions. */
export const DIGIMENU_EXPORT_VERSION = 1 as const;

export type DigimenuExportHero = {
  name: string;
  badgeText: string;
  locationText: string;
  title: string;
  subtitle: string;
  backgroundImageUrl: string;
  logoUrl: string;
};

export type DigimenuExportCategory = {
  name: string;
  sortOrder: number;
};

export type DigimenuExportMenuItem = {
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  rating: number | null;
  time: string | null;
};

export type DigimenuExportV1 = {
  version: typeof DIGIMENU_EXPORT_VERSION;
  exportedAt: string;
  hero: DigimenuExportHero;
  categories: DigimenuExportCategory[];
  menuItems: DigimenuExportMenuItem[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseDigimenuExport(
  raw: unknown
): { ok: true; data: DigimenuExportV1 } | { ok: false; error: string } {
  if (!isRecord(raw)) return { ok: false, error: "Invalid JSON: expected an object." };
  if (raw.version !== DIGIMENU_EXPORT_VERSION) {
    return {
      ok: false,
      error: `Unsupported export version (got ${String(raw.version)}, expected ${DIGIMENU_EXPORT_VERSION}).`,
    };
  }
  if (typeof raw.exportedAt !== "string") {
    return { ok: false, error: "Missing or invalid exportedAt." };
  }
  if (!isRecord(raw.hero)) return { ok: false, error: "Missing or invalid hero." };
  const h = raw.hero;
  const hero: DigimenuExportHero = {
    name: typeof h.name === "string" ? h.name : "",
    badgeText: typeof h.badgeText === "string" ? h.badgeText : "",
    locationText: typeof h.locationText === "string" ? h.locationText : "",
    title: typeof h.title === "string" ? h.title : "",
    subtitle: typeof h.subtitle === "string" ? h.subtitle : "",
    backgroundImageUrl:
      typeof h.backgroundImageUrl === "string" ? h.backgroundImageUrl : "",
    logoUrl: typeof h.logoUrl === "string" ? h.logoUrl : "",
  };

  if (!Array.isArray(raw.categories)) {
    return { ok: false, error: "categories must be an array." };
  }
  const categories: DigimenuExportCategory[] = [];
  for (let i = 0; i < raw.categories.length; i++) {
    const c = raw.categories[i];
    if (!isRecord(c) || typeof c.name !== "string" || !c.name.trim()) {
      return { ok: false, error: `Invalid category at index ${i} (need non-empty name).` };
    }
    const sortOrder = typeof c.sortOrder === "number" && Number.isFinite(c.sortOrder) ? c.sortOrder : i;
    categories.push({ name: c.name.trim(), sortOrder });
  }

  if (!Array.isArray(raw.menuItems)) {
    return { ok: false, error: "menuItems must be an array." };
  }
  const menuItems: DigimenuExportMenuItem[] = [];
  for (let i = 0; i < raw.menuItems.length; i++) {
    const m = raw.menuItems[i];
    if (!isRecord(m)) return { ok: false, error: `Invalid menu item at index ${i}.` };
    if (typeof m.categoryName !== "string" || !m.categoryName.trim()) {
      return { ok: false, error: `Menu item ${i}: categoryName is required.` };
    }
    if (typeof m.name !== "string" || !m.name.trim()) {
      return { ok: false, error: `Menu item ${i}: name is required.` };
    }
    const price =
      typeof m.price === "number" && Number.isFinite(m.price) ? m.price : Number(m.price);
    if (!Number.isFinite(price)) {
      return { ok: false, error: `Menu item ${i}: invalid price.` };
    }
    let rating: number | null = null;
    if (m.rating !== null && m.rating !== undefined) {
      const r = typeof m.rating === "number" ? m.rating : Number(m.rating);
      rating = Number.isFinite(r) ? r : null;
    }
    menuItems.push({
      categoryName: m.categoryName.trim(),
      name: m.name.trim(),
      description: typeof m.description === "string" ? m.description : null,
      price,
      image: typeof m.image === "string" && m.image ? m.image : null,
      rating,
      time: typeof m.time === "string" && m.time ? m.time : null,
    });
  }

  const categoryNames = new Set(categories.map((c) => c.name));
  for (const item of menuItems) {
    if (!categoryNames.has(item.categoryName)) {
      return {
        ok: false,
        error: `Menu item "${item.name}" references unknown category "${item.categoryName}". Add that category to categories[] first.`,
      };
    }
  }

  return {
    ok: true,
    data: {
      version: DIGIMENU_EXPORT_VERSION,
      exportedAt: raw.exportedAt,
      hero,
      categories,
      menuItems,
    },
  };
}
