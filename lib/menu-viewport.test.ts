import { describe, it, expect } from "vitest";
import { getInitialMenuBatchSize } from "./menu-viewport";

describe("getInitialMenuBatchSize (SSR / no window)", () => {
  it("returns default batch when window is undefined", () => {
    expect(getInitialMenuBatchSize()).toBe(12);
  });
});
