import { create } from "zustand";
import type { MenuItem } from "@/lib/menu";
import type { Category } from "@/lib/menu-data";
import {
  fetchMenuRange,
  SCROLL_BATCH_SIZE,
} from "@/lib/menu-fetch-client";
import { getInitialMenuBatchSize } from "@/lib/menu-viewport";

type MenuState = {
  categories: Category[];
  categoryNames: string[];
  items: MenuItem[];
  /** Next DB offset for `fetchMenuRange` (equals current `items.length`). */
  nextOffset: number;
  hasMore: boolean;
  loading: boolean;
  activeCategory: string;
  selectedItem: MenuItem | null;
  isSticky: boolean;
};

type MenuActions = {
  setCategories: (categories: Category[], categoryNames: string[]) => void;
  setActiveCategory: (category: string) => void;
  selectCategory: (category: string) => Promise<void>;
  setSelectedItem: (item: MenuItem | null) => void;
  setIsSticky: (value: boolean) => void;
  loadFirstPage: () => Promise<void>;
  loadMore: () => Promise<void>;
};

function getCategoryId(
  activeCategory: string,
  categories: Category[]
): number | null {
  if (activeCategory === "All") return null;
  return categories.find((c) => c.name === activeCategory)?.id ?? null;
}

export const useMenuStore = create<MenuState & MenuActions>((set, get) => ({
  categories: [],
  categoryNames: [],
  items: [],
  nextOffset: 0,
  hasMore: true,
  loading: true,
  activeCategory: "All",
  selectedItem: null,
  isSticky: false,

  setCategories: (categories, categoryNames) =>
    set({ categories, categoryNames }),

  setActiveCategory: (activeCategory) => set({ activeCategory }),

  selectCategory: async (activeCategory) => {
    set({
      activeCategory,
      items: [],
      nextOffset: 0,
      hasMore: true,
      loading: true,
    });
    const { categories } = get();
    const categoryId = getCategoryId(activeCategory, categories);
    const initial = getInitialMenuBatchSize();
    const { items, hasMore } = await fetchMenuRange(0, initial, categoryId);
    set({
      items,
      hasMore,
      nextOffset: items.length,
      loading: false,
    });
  },

  setSelectedItem: (selectedItem) => set({ selectedItem }),

  setIsSticky: (isSticky) => set({ isSticky }),

  loadFirstPage: async () => {
    const { activeCategory, categories } = get();
    set({
      items: [],
      nextOffset: 0,
      hasMore: true,
      loading: true,
    });
    const categoryId = getCategoryId(activeCategory, categories);
    const initial = getInitialMenuBatchSize();
    const { items, hasMore } = await fetchMenuRange(0, initial, categoryId);
    set({
      items,
      hasMore,
      nextOffset: items.length,
      loading: false,
    });
  },

  loadMore: async () => {
    const { loading, hasMore, nextOffset, activeCategory, categories } = get();
    if (loading || !hasMore) return;
    set({ loading: true });
    const categoryId = getCategoryId(activeCategory, categories);
    const { items: newItems, hasMore: more } = await fetchMenuRange(
      nextOffset,
      SCROLL_BATCH_SIZE,
      categoryId
    );
    set((state) => ({
      items: [...state.items, ...newItems],
      hasMore: more,
      nextOffset: state.nextOffset + newItems.length,
      loading: false,
    }));
  },
}));
