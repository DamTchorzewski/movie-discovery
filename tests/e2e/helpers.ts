import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

// Every page template, shared by the smoke and the accessibility tests.
export const ROUTES = [
  "./",
  "discover/",
  "search/?q=w%C5%82adca",
  "library/",
  "tonight/",
  "about/",
  "movie/120-wladca-pierscieni/",
  "person/1327-ian-mckellen/",
  "collection/119-wladca-pierscieni/",
  "en/",
  "en/movie/120-the-lord-of-the-rings/",
] as const;

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8");

// 1×1 transparent PNG for every poster, backdrop and logo
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const ROUTES_TO_FIXTURES: Array<[RegExp, string]> = [
  [/^\/3\/genre\/movie\/list$/, "genres"],
  [/^\/3\/watch\/providers\/movie$/, "providers"],
  [/^\/3\/movie\/\d+$/, "movie"],
  [/^\/3\/person\/\d+$/, "person"],
  [/^\/3\/collection\/\d+$/, "collection"],
  [/^\/3\/search\/multi$/, "multi"],
  [/^\/3\/(trending|movie|discover|search)\//, "list"],
];

export async function mockTmdb(page: Page) {
  await page.route("https://api.themoviedb.org/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    const match = ROUTES_TO_FIXTURES.find(([pattern]) => pattern.test(pathname));
    if (!match) return route.fulfill({ status: 404, json: { status_message: "not mocked" } });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: fixture(match[1]),
    });
  });
  await page.route("https://image.tmdb.org/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: PIXEL }),
  );
  // the trailer iframe is never loaded in tests
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.abort());
}

// Any console error (a CSP violation included) or page error fails the test.
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    expectNone: () => expect(errors, errors.join("\n")).toEqual([]),
  };
}

// Lazy images and in-view content reach their final state.
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

export async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("kadr.theme", value);
    } catch {
      // storage blocked: the default (dark) theme stays
    }
  }, theme);
}
