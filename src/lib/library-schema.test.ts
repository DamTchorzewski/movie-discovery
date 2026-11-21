import { describe, expect, it } from "vitest";
import {
  libraryStats,
  mergeEntries,
  migrateLegacy,
  parseEntry,
  parseLibraryFile,
  toLibraryFile,
  type LibraryEntry,
} from "./library-schema";

const NOW = "2026-11-21T10:00:00.000Z";

const entry = (patch: Partial<LibraryEntry> = {}): LibraryEntry => ({
  id: 550,
  status: "watched",
  title: "Fight Club",
  posterPath: "/p.jpg",
  backdropPath: null,
  releaseDate: "1999-10-15",
  voteAverage: 8.4,
  genreIds: [18, 53],
  runtime: 139,
  addedAt: NOW,
  watchedAt: NOW,
  rating: 9,
  note: "",
  ...patch,
});

describe("parseEntry", () => {
  it("keeps a valid entry", () => {
    expect(parseEntry(entry(), NOW)).toEqual(entry());
  });

  it("rejects entries without a positive integer id", () => {
    expect(parseEntry({ id: "550" }, NOW)).toBeNull();
    expect(parseEntry({ id: -1 }, NOW)).toBeNull();
    expect(parseEntry(null, NOW)).toBeNull();
  });

  it("drops a rating outside 1-10 and trims long notes", () => {
    const parsed = parseEntry({ ...entry(), rating: 11, note: "x".repeat(3000) }, NOW);
    expect(parsed?.rating).toBeNull();
    expect(parsed?.note).toHaveLength(2000);
  });

  it("clears watchedAt on a watchlist entry", () => {
    expect(parseEntry({ ...entry(), status: "watchlist" }, NOW)?.watchedAt).toBeNull();
  });
});

describe("library files", () => {
  it("round-trips an export", () => {
    const file = JSON.stringify(toLibraryFile({ 550: entry() }, NOW));
    expect(parseLibraryFile(file, NOW)).toEqual([entry()]);
  });

  it("refuses a file from another app or broken JSON", () => {
    expect(parseLibraryFile('{"entries": []}', NOW)).toBeNull();
    expect(parseLibraryFile("{", NOW)).toBeNull();
  });
});

describe("migrateLegacy", () => {
  it("turns the old id arrays into entries; watched wins over queue", () => {
    const result = migrateLegacy([550, "13"], [550, 680], NOW);
    const byId = Object.fromEntries(result.map((e) => [e.id, e.status]));
    expect(byId).toEqual({ 550: "watched", 13: "watched", 680: "watchlist" });
  });

  it("ignores values that are not arrays of ids", () => {
    expect(migrateLegacy("x", null, NOW)).toEqual([]);
  });
});

describe("mergeEntries", () => {
  it("lets the import win but keeps a known title", () => {
    const merged = mergeEntries({ 550: entry() }, [entry({ title: "", rating: 7 })]);
    expect(merged[550]?.rating).toBe(7);
    expect(merged[550]?.title).toBe("Fight Club");
  });
});

describe("libraryStats", () => {
  it("counts watched films, minutes, the average rating and the top genre", () => {
    const stats = libraryStats([
      entry(),
      entry({ id: 1, rating: 7, runtime: 100, genreIds: [18] }),
      entry({ id: 2, status: "watchlist", watchedAt: null }),
    ]);
    expect(stats).toEqual({ watched: 2, minutes: 239, averageRating: 8, topGenreId: 18 });
  });

  it("has no average without ratings", () => {
    expect(libraryStats([entry({ rating: null })]).averageRating).toBeNull();
  });
});
