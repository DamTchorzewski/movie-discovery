import { expect, test } from "@playwright/test";
import { mockTmdb, trackErrors } from "./helpers";

const MOVIE = "Władca Pierścieni: Drużyna Pierścienia";

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

test("search with Ctrl+K opens a film", async ({ page, isMobile }) => {
  const errors = trackErrors(page);
  await page.goto("./");
  // the shortcut listener is attached once the app has rendered
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Szukaj filmów i osób" }).click();
  else await page.keyboard.press("Control+k");
  const box = page.getByRole("combobox", { name: "Szukaj filmów i osób" });
  await box.fill("władca");
  await expect(page.getByRole("option", { name: new RegExp(MOVIE) })).toBeVisible();
  await page.getByRole("option", { name: new RegExp(MOVIE) }).click();
  await expect(page.getByRole("heading", { level: 1, name: MOVIE })).toBeVisible();
  await expect(page).toHaveURL(/movie\/120-/);
  errors.expectNone();
});

test("watchlist, watched with a rating and a note, remove with undo", async ({ page }) => {
  await page.goto("movie/120-x/");
  await page.getByRole("button", { name: "Do obejrzenia" }).click();
  await expect(page.getByRole("button", { name: "Na liście" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("library/");
  await expect(page.getByRole("link", { name: new RegExp(MOVIE) })).toBeVisible();

  await page.goto("movie/120-x/");
  await page.getByRole("button", { name: "Obejrzane" }).click();
  await page.getByRole("button", { name: "Oceń i dodaj notatkę" }).click();
  const dialog = page.getByRole("dialog", { name: MOVIE });
  await dialog.getByLabel("9 na 10").check({ force: true });
  await dialog.getByLabel("Notatka").fill("Z przyjaciółmi, wersja rozszerzona.");
  await dialog.getByRole("button", { name: "Zapisz" }).click();
  await expect(
    page.getByRole("blockquote").getByText("Z przyjaciółmi, wersja rozszerzona."),
  ).toBeVisible();

  await page.goto("library/?tab=watched");
  await expect(page.getByText("Obejrzane filmy")).toBeVisible();
  await page.getByRole("button", { name: `Usuń z moich filmów: ${MOVIE}` }).click();
  await expect(page.getByRole("link", { name: new RegExp(MOVIE) })).toHaveCount(0);
  await page.getByRole("button", { name: "Cofnij" }).click();
  await expect(page.getByRole("link", { name: new RegExp(MOVIE) })).toBeVisible();
});

test("the lists of the first version are moved over", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("kadr.legacy-migrated")) {
      localStorage.setItem("watched", JSON.stringify([120]));
      localStorage.setItem("queue", JSON.stringify([121]));
    }
  });
  await page.goto("library/?tab=watched");
  await expect(
    page.getByText("Przenieśliśmy 2 filmy z pierwszej wersji (Filmoteka)."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(MOVIE) })).toBeVisible();
});

test("a genre on the home page opens Discover filtered by it", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Dramat", exact: true }).click();
  await expect(page).toHaveURL(/discover\/\?genres=18/);
  await expect(page.getByRole("heading", { level: 1, name: "Odkrywaj" })).toBeVisible();
});

test("the tonight picker draws a film", async ({ page }) => {
  await page.goto("tonight/");
  await page.getByText("Pośmiać się").click();
  await page.getByRole("button", { name: "Losuj" }).click();
  await expect(page.getByText("Twój film na dziś")).toBeVisible();
  await expect(page.getByRole("button", { name: "Biorę ten" })).toBeVisible();
});

test("the theme choice is remembered", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Motyw, Język" }).click();
  await page.getByText("Jasny", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the language switch keeps the page", async ({ page }) => {
  await page.goto("movie/120-x/");
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en\/movie\/120-x\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
