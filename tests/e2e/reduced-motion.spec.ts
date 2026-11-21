import { expect, test } from "@playwright/test";
import { mockTmdb } from "./helpers";

test.use({ reducedMotion: "reduce" });

test("with reduced motion the hero does not advance and nothing loops", async ({ page }) => {
  await mockTmdb(page);
  await page.goto("./");
  // the slideshow starts paused, so its button offers to play
  await expect(page.getByRole("button", { name: "Wznów pokaz" })).toBeVisible();
  const first = await page.getByRole("group", { name: /Slajd 1 z/ }).textContent();
  await page.waitForTimeout(1500);
  expect(await page.getByRole("group", { name: /Slajd 1 z/ }).textContent()).toBe(first);
  const looping = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations === Infinity)
        .length,
  );
  expect(looping).toBe(0);
});
