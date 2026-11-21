import { expect, test } from "@playwright/test";
import { mockTmdb, ROUTES, scrollThrough, trackErrors } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

for (const route of ROUTES) {
  test(`${route} renders with one h1, no errors and no horizontal scroll`, async ({ page }) => {
    const errors = trackErrors(page);
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main h1, main [role=alert] h1").first()).toBeAttached();
    await scrollThrough(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    errors.expectNone();
  });
}

test("an unknown path shows the 404 page", async ({ page }) => {
  await page.goto("does-not-exist/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ta scena została wycięta");
});

test("the English pages say so", async ({ page }) => {
  await page.goto("en/movie/120-x/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Play trailer" })).toBeVisible();
});
