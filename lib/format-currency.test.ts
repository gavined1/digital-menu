import { describe, it, expect } from "vitest";
import { formatKhmerRiel } from "./format-currency";

describe("formatKhmerRiel", () => {
  it("formats numeric strings", () => {
    const s = formatKhmerRiel("1500");
    expect(s).toMatch(/1/);
    expect(s).toContain("៛");
  });

  it("formats numbers", () => {
    expect(formatKhmerRiel(0)).toContain("៛");
  });

  it("falls back to zero for NaN string", () => {
    const s = formatKhmerRiel("not-a-number");
    expect(s).toMatch(/0/);
  });
});
