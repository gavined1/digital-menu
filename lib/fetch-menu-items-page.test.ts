import { describe, it, expect } from "vitest";
import { mapMenuRowToItem, type MenuItemRow } from "./fetch-menu-items-page";

describe("mapMenuRowToItem", () => {
  it("maps a single nested category", () => {
    const row: MenuItemRow = {
      id: 42,
      name: "Iced latte",
      description: "Cold brew",
      price: "15000",
      image: "https://example.com/a.jpg",
      rating: "4.5",
      time: "5 min",
      categories: { name: "Drinks" },
    };
    const item = mapMenuRowToItem(row);
    expect(item).toMatchObject({
      id: 42,
      name: "Iced latte",
      description: "Cold brew",
      category: "Drinks",
      image: "https://example.com/a.jpg",
      rating: 4.5,
      time: "5 min",
    });
    expect(item.price).toContain("៛");
  });

  it("maps array categories to first name", () => {
    const row: MenuItemRow = {
      id: 1,
      name: "x",
      description: null,
      price: "0",
      image: null,
      rating: "0",
      time: "",
      categories: [{ name: "Food" }, { name: "Other" }],
    };
    expect(mapMenuRowToItem(row).category).toBe("Food");
  });

  it("handles null categories", () => {
    const row: MenuItemRow = {
      id: 1,
      name: "x",
      description: null,
      price: "100",
      image: null,
      rating: "1",
      time: "",
      categories: null,
    };
    expect(mapMenuRowToItem(row).category).toBe("");
  });
});
