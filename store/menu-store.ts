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
  hasMore: boolean;
  loading: boolean;
  /** Bumped on each new list fetch so stale async results are ignored. */
  fetchEpoch: number;
  loadError: string | null;
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
  /** Apply server-rendered first page for "All" to skip a client round-trip. */
  hydrateFromServerFirstPage: (data: { items: MenuItem[]; hasMore: boolean }) => void;
  loadFirstPage: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** Refetch the current category from offset 0 (e.g. after an error). */
  retryLoad: () => Promise<void>;
};

function getCategoryId(
  activeCategory: string,
  categories: Category[]
): number | null {
  if (activeCategory === "All") return null;
  return categories.find((c) => c.name === activeCategory)?.id ?? null;
}

function loadErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return "Something went wrong. Please try again.";
}

export const useMenuStore = create<MenuState & MenuActions>((set, get) => ({
  categories: [],
  categoryNames: [],
  items: [],
  hasMore: true,
  loading: true,
  fetchEpoch: 0,
  loadError: null,
  activeCategory: "All",
  selectedItem: null,
  isSticky: false,

  setCategories: (categories, categoryNames) =>
    set({ categories, categoryNames }),

  setActiveCategory: (activeCategory) => set({ activeCategory }),

  hydrateFromServerFirstPage: (data) => {
    const epoch = get().fetchEpoch + 1;
    set({
      items: data.items,
      hasMore: data.hasMore,
      loading: false,
      loadError: null,
      fetchEpoch: epoch,
      activeCategory: "All",
    });
  },

  selectCategory: async (activeCategory) => {
    const epoch = get().fetchEpoch + 1;
    set({
      activeCategory,
      items: [],
      hasMore: true,
      loading: true,
      loadError: null,
      fetchEpoch: epoch,
    });
    try {
      const { categories } = get();
      const categoryId = getCategoryId(activeCategory, categories);
      const initial = getInitialMenuBatchSize();
      const { items, hasMore } = await fetchMenuRange(null, initial, categoryId);
      if (get().fetchEpoch !== epoch) return;
      set({
        items,
        hasMore,
        loading: false,
        loadError: null,
      });
    } catch (e) {
      if (get().fetchEpoch !== epoch) return;
      set({
        loading: false,
        loadError: loadErrorMessage(e),
      });
    }
  },

  setSelectedItem: (selectedItem) => set({ selectedItem }),

  setIsSticky: (isSticky) => set({ isSticky }),

  loadFirstPage: async () => {
    const epoch = get().fetchEpoch + 1;
    set({
      items: [],
      hasMore: true,
      loading: true,
      loadError: null,
      fetchEpoch: epoch,
    });
    try {
      const { activeCategory, categories } = get();
      const categoryId = getCategoryId(activeCategory, categories);
      const initial = getInitialMenuBatchSize();
      const { items, hasMore } = await fetchMenuRange(null, initial, categoryId);
      if (get().fetchEpoch !== epoch) return;
      set({
        items,
        hasMore,
        loading: false,
        loadError: null,
      });
    } catch (e) {
      if (get().fetchEpoch !== epoch) return;
      set({
        loading: false,
        loadError: loadErrorMessage(e),
      });
    }
  },

  loadMore: async () => {
    const snapshot = get();
    const {
      loading,
      hasMore,
      items,
      activeCategory,
      categories,
      fetchEpoch,
    } = snapshot;
    if (loading || !hasMore) return;

    const lastIdAtStart = items[items.length - 1]?.id;
    if (lastIdAtStart == null) return;

    const epochAtStart = fetchEpoch;
    const categoryAtStart = activeCategory;

    set({ loading: true });
    try {
      const categoryId = getCategoryId(categoryAtStart, categories);
      const { items: newItems, hasMore: more } = await fetchMenuRange(
        lastIdAtStart,
        SCROLL_BATCH_SIZE,
        categoryId
      );
      if (
        get().fetchEpoch !== epochAtStart ||
        get().activeCategory !== categoryAtStart
      ) {
        return;
      }
      const stillSameTail =
        get().items.length > 0 &&
        get().items[get().items.length - 1]?.id === lastIdAtStart;
      if (!stillSameTail) {
        set({ loading: false });
        return;
      }
      set((state) => ({
        items: [...state.items, ...newItems],
        hasMore: more,
        loading: false,
        loadError: null,
      }));
    } catch (e) {
      if (
        get().fetchEpoch !== epochAtStart ||
        get().activeCategory !== categoryAtStart
      ) {
        return;
      }
      set({
        loading: false,
        loadError: loadErrorMessage(e),
      });
    }
  },

  retryLoad: async () => {
    const { activeCategory } = get();
    await get().selectCategory(activeCategory);
  },
}));
