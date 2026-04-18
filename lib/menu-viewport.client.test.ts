/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { getInitialMenuBatchSize } from "./menu-viewport";

describe("getInitialMenuBatchSize (browser)", () => {
  it("returns a bounded size from viewport dimensions", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 900,
      configurable: true,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 400,
      configurable: true,
    });
    const n = getInitialMenuBatchSize();
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(40);
  });
});
