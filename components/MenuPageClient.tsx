"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useTransition } from "react";
import Image from "next/image";
import { Coffee, Loader2, MapPin, Moon, Search, Sun, X } from "lucide-react";
import type { MenuItem } from "@/lib/menu";
import type { Category } from "@/lib/menu-data";
import type { HeroSection } from "@/lib/hero-data";
import { MenuGrid } from "@/components/MenuGrid";
import { useMenuStore } from "@/store/menu-store";

const ProductDetail = dynamic(() => import("./ProductDetail"), { ssr: false });

function preloadProductDetail() {
  if (typeof window !== "undefined") {
    void import("./ProductDetail");
  }
}

// Traditional Khmer Kbach Pattern (Phka Chan / Lotus Motif) — hoisted constant
const KBACH_PATTERN = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239CA3AF' fill-opacity='0.15'%3E%3Cpath d='M30 0c0 0 4.5 9 15 9 10.5 0 15-9 15-9s-4.5 15-4.5 21c0 6 4.5 9 4.5 9s-10.5-3-15-3c-4.5 0-15 13-15 13s-10.5-13-15-13c-4.5 0-15 3-15 3s4.5-3 4.5-9c0-6-4.5-21-4.5-21s4.5 9 15 9c10.5 0 15-9 15-9z M30 30c0 0 4.5 9 15 9 10.5 0 15-9 15-9s-4.5 15-4.5 21c0 6 4.5 9 4.5 9s-10.5-3-15-3c-4.5 0-15 13-15 13s-10.5-13-15-13c-4.5 0-15 3-15 3s4.5-3 4.5-9c0-6-4.5-21-4.5-21s4.5 9 15 9c10.5 0 15-9 15-9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

// Hoisted static JSX to avoid re-creation every render (rendering-hoist-jsx)
const LOADING_INITIAL = (
  <div className="flex justify-center py-16" aria-busy="true">
    <Loader2 className="h-8 w-8 animate-spin text-amber-500" aria-hidden />
  </div>
);

const EMPTY_STATE = (
  <div className="py-20 text-center">
    <p className="text-zinc-400">No products found.</p>
  </div>
);

function filterItemsByQuery<T extends { name: string; description: string }>(
  list: T[],
  q: string
): T[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return list;
  return list.filter(
    (item) =>
      item.name.toLowerCase().includes(needle) ||
      item.description.toLowerCase().includes(needle)
  );
}

const BACKGROUND_PATTERN_STYLE = {
  backgroundImage: `url("${KBACH_PATTERN}")`,
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
} as const;

function ThemeToggle() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}

const HERO_OVERLAY_PATTERN_STYLE = {
  backgroundImage: `url("${KBACH_PATTERN}")`,
  backgroundSize: "60px",
} as const;

type MenuPageClientProps = {
  hero: HeroSection;
  categories: Category[];
  categoryNames: string[];
  /** Server-rendered first page for "All" (avoids client waterfall). */
  initialMenu: { items: MenuItem[]; hasMore: boolean };
};

const MenuPageClient: React.FC<MenuPageClientProps> = ({
  hero,
  categories,
  categoryNames: categoryNamesProp,
  initialMenu,
}) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const stickySentinelRef = useRef<HTMLDivElement | null>(null);

  const setCategories = useMenuStore((s) => s.setCategories);
  const categoryNamesFromStore = useMenuStore((s) => s.categoryNames);
  const setActiveCategory = useMenuStore((s) => s.setActiveCategory);
  const selectCategory = useMenuStore((s) => s.selectCategory);
  const hydrateFromServerFirstPage = useMenuStore(
    (s) => s.hydrateFromServerFirstPage
  );
  const loadMore = useMenuStore((s) => s.loadMore);
  const retryLoad = useMenuStore((s) => s.retryLoad);
  const setSelectedItem = useMenuStore((s) => s.setSelectedItem);
  const setIsSticky = useMenuStore((s) => s.setIsSticky);
  const items = useMenuStore((s) => s.items);
  const loading = useMenuStore((s) => s.loading);
  const loadError = useMenuStore((s) => s.loadError);
  const activeCategory = useMenuStore((s) => s.activeCategory);
  const selectedItem = useMenuStore((s) => s.selectedItem);
  const isSticky = useMenuStore((s) => s.isSticky);

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const categoryNames =
    categoryNamesFromStore.length > 0 ? categoryNamesFromStore : categoryNamesProp;

  const displayItems = useMemo(
    () => filterItemsByQuery(items, searchQuery),
    [items, searchQuery]
  );

  const hasGridItems = displayItems.length > 0;
  const isSearchActive = searchQuery.trim().length > 0;

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCategories(categories, categoryNamesProp);
  }, [categories, categoryNamesProp, setCategories]);

  useEffect(() => {
    hydrateFromServerFirstPage(initialMenu);
  }, [hydrateFromServerFirstPage, initialMenu]);

  /**
   * Sentinel is not mounted until the first batch arrives (spinner-only state has no ref).
   * Re-run only when the grid appears/disappears — not on every appended row — so the observer
   * is not torn down after each infinite-scroll fetch.
   */
  useLayoutEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasGridItems || isSearchActive) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasGridItems, isSearchActive]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        startTransition(() => {
          setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        });
      },
      { threshold: 1, rootMargin: "-1px 0px 0px 0px" }
    );
    if (stickySentinelRef.current) {
      observer.observe(stickySentinelRef.current);
    }
    return () => observer.disconnect();
  }, [setIsSticky]);

  const handleCategoryClick = (cat: string) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    startTransition(() => {
      selectCategory(cat);
    });
  };

  return (
    <div className="min-h-screen relative font-sans selection:bg-amber-500/30">
      {/* BACKGROUND PATTERN LAYER */}
      <div
        className="fixed inset-0 z-0 bg-stone-50 dark:bg-zinc-950 transition-colors duration-500"
        style={BACKGROUND_PATTERN_STYLE}
      />
      <div className="fixed inset-0 z-0 bg-stone-50/50 dark:bg-zinc-950/80 pointer-events-none" />

      {/* CONTENT LAYER */}
      <div className="relative z-10">
        {/* 1. Navbar */}
        <nav className="absolute top-0 left-0 right-0 z-40 py-5">
          <div className="container mx-auto px-5 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center size-8 overflow-hidden">
                {hero.logoUrl?.trim() ? (
                  <Image
                    src={hero.logoUrl}
                    alt={hero.name}
                    width={20}
                    height={20}
                    className="object-contain size-5"
                  />
                ) : (
                  <Coffee size={20} className="text-white shrink-0" />
                )}
              </div>
              <span className="font-serif font-bold text-lg tracking-tight">
                {hero.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                aria-label={searchOpen ? "Close search" : "Search menu"}
                aria-expanded={searchOpen}
                aria-controls="menu-search-panel"
                onClick={() => {
                  setSearchOpen((o) => !o);
                  if (searchOpen) setSearchQuery("");
                }}
              >
                {searchOpen ? <X size={22} /> : <Search size={22} />}
              </button>
              <ThemeToggle />
            </div>
          </div>
          {searchOpen ? (
            <div
              id="menu-search-panel"
              className="container mx-auto px-5 pt-2 pb-3"
            >
              <label htmlFor="menu-search-input" className="sr-only">
                Search products
              </label>
              <input
                ref={searchInputRef}
                id="menu-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description…"
                autoComplete="off"
                className="w-full max-w-md mx-auto block rounded-full border border-white/25 bg-black/25 backdrop-blur-md px-4 py-2.5 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          ) : null}
        </nav>

        {/* 2. Hero Section */}
        <header className="relative h-[45vh] min-h-[350px] flex items-end overflow-hidden pb-12 rounded-b-[40px] shadow-2xl">
          <div className="absolute inset-0 z-0">
            {hero.backgroundImageUrl?.trim() ? (
              <Image
                src={hero.backgroundImageUrl}
                alt={hero.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1280px"
              />
            ) : (
              <div className="absolute inset-0 bg-stone-800" aria-hidden />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-stone-900/90 via-stone-900/40 to-stone-900/30" />
            <div
              className="absolute inset-0 opacity-20"
              style={HERO_OVERLAY_PATTERN_STYLE}
            />
          </div>
          <div className="relative z-10 px-5 w-full container mx-auto">
            <div className="flex items-center gap-2 mb-3 animate-fade-in-up">
              <span className="px-2 py-1 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20">
                {hero.badgeText}
              </span>
              <span className="text-white/90 text-xs font-medium flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-md">
                <MapPin size={12} /> {hero.locationText}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-2 tracking-tight drop-shadow-lg animate-fade-in-up delay-100">
              {hero.title}
            </h1>
            <p className="text-white/90 text-sm font-medium max-w-xs animate-fade-in-up delay-200">
              {hero.subtitle}
            </p>
          </div>
        </header>

        {/* 3. Categories - Sticky */}
        <div
          ref={stickySentinelRef}
          className="h-px w-full absolute"
          style={{ marginTop: "-1px", pointerEvents: "none" }}
        />
        <div className="sticky top-0 z-30">
          <div
            className={`
                w-full transition-all duration-500 ease-in-out
                ${
                  isSticky
                    ? "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-sm"
                    : "bg-transparent border-transparent"
                }
            `}
          >
            <div className="flex gap-3 overflow-x-auto px-5 py-4 scrollbar-hide w-full">
              {categoryNames.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`
                      whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 select-none
                      shrink-0 border shadow-sm
                      ${
                        activeCategory === cat
                          ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-black transform scale-105"
                          : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }
                    `}
                >
                  {cat}
                </button>
              ))}
              <div className="w-2 shrink-0" />
            </div>
          </div>
        </div>

        {/* 4. Main Content Grid */}
        <main
          className="container mx-auto px-4 py-4 pb-32 transition-opacity duration-200"
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              {activeCategory}
            </h2>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
              {isSearchActive
                ? `${displayItems.length} match${displayItems.length === 1 ? "" : "es"}`
                : `${items.length} Products`}
            </span>
          </div>

          {loadError ? (
            <div
              className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              role="alert"
            >
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{loadError}</p>
              <button
                type="button"
                onClick={() => void retryLoad()}
                disabled={loading}
                className="shrink-0 rounded-full bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading && items.length === 0 && !loadError ? (
            LOADING_INITIAL
          ) : items.length > 0 && displayItems.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-zinc-400">No matching products.</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400"
              >
                Clear search
              </button>
            </div>
          ) : displayItems.length > 0 ? (
            <MenuGrid
              items={displayItems}
              onSelectItem={setSelectedItem}
              onPeekDetail={preloadProductDetail}
              loadMoreRef={loadMoreRef}
              loadingMore={
                !isSearchActive && loading && items.length > 0
              }
            />
          ) : loadError && items.length === 0 ? (
            <div className="py-8" aria-hidden />
          ) : (
            EMPTY_STATE
          )}
        </main>

      </div>

      {selectedItem ? (
        <ProductDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </div>
  );
};

export default MenuPageClient;
