import { describe, it, expect } from "vitest";
import { isValidEnterUrl } from "./qr-enter-url";

describe("isValidEnterUrl", () => {
  const origin = "https://cafe.example.com";

  it("accepts absolute /enter on same origin", () => {
    expect(isValidEnterUrl(`${origin}/enter`, origin)).toBe(true);
    expect(isValidEnterUrl(`${origin}/enter?table=3`, origin)).toBe(true);
  });

  it("accepts relative /enter resolved against origin", () => {
    expect(isValidEnterUrl("/enter", origin)).toBe(true);
  });

  it("rejects other paths", () => {
    expect(isValidEnterUrl(`${origin}/menu`, origin)).toBe(false);
  });

  it("rejects other origins", () => {
    expect(isValidEnterUrl("https://evil.test/enter", origin)).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isValidEnterUrl(":::not-a-url", origin)).toBe(false);
  });
});
