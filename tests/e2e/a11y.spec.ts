import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mockTmdb, ROUTES, scrollThrough, setTheme } from "./helpers";

// WCAG 2.2 AA in both themes (reops/standards/accessibility.md).
for (const theme of ["dark", "light"] as const) {
  test.describe(`WCAG 2.2 AA (${theme})`, () => {
    test.use({ colorScheme: theme, reducedMotion: "reduce" });

    test.beforeEach(async ({ page }) => {
      await mockTmdb(page);
      await setTheme(page, theme);
    });

    for (const route of ROUTES) {
      test(route, async ({ page }) => {
        await page.goto(route);
        await expect(page.locator("h1")).toHaveCount(1);
        await scrollThrough(page);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        ).toEqual([]);
      });
    }
  });
}
