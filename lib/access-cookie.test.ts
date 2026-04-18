import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createAccessCookieValue,
  verifyAccessCookieValue,
} from "./access-cookie";

const TEST_SECRET = "test-secret-key-16chars";

describe("access cookie", () => {
  const prevSecret = process.env.MENU_ACCESS_SECRET;

  beforeEach(() => {
    process.env.MENU_ACCESS_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env.MENU_ACCESS_SECRET = prevSecret;
  });

  it("round-trips create and verify", async () => {
    const v = await createAccessCookieValue();
    expect(await verifyAccessCookieValue(v)).toBe(true);
  });

  it("rejects tampered payload", async () => {
    const v = await createAccessCookieValue();
    const [payload] = v.split(".");
    const tampered = `${payload.slice(0, -4)}XXXX.${v.split(".")[1]}`;
    expect(await verifyAccessCookieValue(tampered)).toBe(false);
  });

  it("rejects garbage", async () => {
    expect(await verifyAccessCookieValue("not.valid")).toBe(false);
  });

  it("verify returns false when secret is missing", async () => {
    const v = await createAccessCookieValue();
    delete process.env.MENU_ACCESS_SECRET;
    expect(await verifyAccessCookieValue(v)).toBe(false);
  });

  it("create throws when secret is missing or too short", async () => {
    delete process.env.MENU_ACCESS_SECRET;
    await expect(createAccessCookieValue()).rejects.toThrow(
      /MENU_ACCESS_SECRET/
    );
    process.env.MENU_ACCESS_SECRET = "short";
    await expect(createAccessCookieValue()).rejects.toThrow(
      /MENU_ACCESS_SECRET/
    );
  });
});
