import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MenuItem } from "@/lib/menu";
import { useMenuStore } from "./menu-store";

vi.mock("@/lib/menu-fetch-client", () => ({
  fetchMenuRange: vi.fn(),
  SCROLL_BATCH_SIZE: 12,
}));

vi.mock("@/lib/menu-viewport", () => ({
  getInitialMenuBatchSize: () => 6,
}));

import { fetchMenuRange } from "@/lib/menu-fetch-client";

function mockItem(id: number, name: string): MenuItem {
  return {
    id,
    name,
    description: "",
    price: "0 ៛",
    category: "",
    image: "",
    rating: 0,
    time: "",
  };
}

const initialStore = () => ({
  categories: [] as { id: number; name: string }[],
  categoryNames: [] as string[],
  items: [] as MenuItem[],
  nextOffset: 0,
  hasMore: true,
  loading: false,
  fetchEpoch: 0,
  loadError: null as string | null,
  activeCategory: "All",
  selectedItem: null as MenuItem | null,
  isSticky: false,
});

describe("useMenuStore", () => {
  beforeEach(() => {
    useMenuStore.setState(initialStore());
    vi.mocked(fetchMenuRange).mockReset();
  });

  it("sets loadError when fetch fails", async () => {
    vi.mocked(fetchMenuRange).mockRejectedValue(new Error("network down"));
    await useMenuStore.getState().loadFirstPage();
    expect(useMenuStore.getState().loadError).toBe("network down");
    expect(useMenuStore.getState().loading).toBe(false);
  });

  it("ignores stale selectCategory response", async () => {
    useMenuStore.getState().setCategories(
      [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
      ],
      ["All", "A", "B"]
    );

    let resolveFirst!: (v: { items: MenuItem[]; hasMore: boolean }) => void;
    const slowFirst = new Promise<{ items: MenuItem[]; hasMore: boolean }>(
      (r) => {
        resolveFirst = r;
      }
    );

    vi.mocked(fetchMenuRange)
      .mockImplementationOnce(() => slowFirst)
      .mockResolvedValueOnce({
        items: [mockItem(2, "fromB")],
        hasMore: false,
      });

    const p1 = useMenuStore.getState().selectCategory("A");
    const p2 = useMenuStore.getState().selectCategory("B");

    resolveFirst({
      items: [mockItem(99, "staleA")],
      hasMore: false,
    });
    await p1;
    await p2;

    expect(useMenuStore.getState().items.map((i) => i.id)).toEqual([2]);
    expect(useMenuStore.getState().loadError).toBeNull();
  });

  it("ignores loadMore after category changes", async () => {
    useMenuStore.getState().setCategories([{ id: 1, name: "A" }], [
      "All",
      "A",
    ]);

    let resolveMore!: (v: { items: MenuItem[]; hasMore: boolean }) => void;
    const slowMore = new Promise<{ items: MenuItem[]; hasMore: boolean }>(
      (r) => {
        resolveMore = r;
      }
    );

    vi.mocked(fetchMenuRange)
      .mockResolvedValueOnce({
        items: [mockItem(1, "first")],
        hasMore: true,
      })
      .mockImplementationOnce(() => slowMore)
      .mockResolvedValueOnce({
        items: [mockItem(2, "catA")],
        hasMore: false,
      });

    await useMenuStore.getState().loadFirstPage();
    expect(useMenuStore.getState().items).toHaveLength(1);

    const morePromise = useMenuStore.getState().loadMore();
    await useMenuStore.getState().selectCategory("A");

    resolveMore({
      items: [mockItem(999, "orphan")],
      hasMore: false,
    });
    await morePromise;

    expect(useMenuStore.getState().items.some((i) => i.id === 999)).toBe(
      false
    );
    expect(useMenuStore.getState().items[0]?.id).toBe(2);
  });
});
