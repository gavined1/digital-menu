import { test, expect } from "@playwright/test";

test.describe("public menu access", () => {
  test("redirects /menu to home without access cookie", async ({ page }) => {
    await page.goto("/menu", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/$/);
  });

  test("/enter sets access cookie and opens /menu", async ({ page, context }) => {
    const res = await page.goto("/enter", { waitUntil: "commit" });
    expect(res?.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/menu/, { timeout: 30_000 });

    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === "menu_access")).toBe(true);
  });

  test("menu page shows shell after access", async ({ page }) => {
    await page.goto("/enter", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/menu/);

    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("header").first()).toBeVisible();
  });
});
