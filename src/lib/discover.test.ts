import { describe, expect, it } from "vitest";
import { activeFilterCount, discoverParams, parseDiscover, serializeDiscover } from "./discover";

describe("parseDiscover", () => {
  it("gives the defaults for an empty URL", () => {
    expect(parseDiscover({})).toEqual({
      genres: [],
      from: undefined,
      to: undefined,
      rating: undefined,
      votes: undefined,
      runtime: "any",
      language: undefined,
      providers: [],
      sort: "popularity",
    });
  });

  it("reads comma lists and numbers, dropping junk", () => {
    const filters = parseDiscover({
      genres: "28,x,12,28",
      from: "1999",
      rating: "7",
      sort: "rating",
      runtime: "long",
      language: "ja",
    });
    expect(filters.genres).toEqual([28, 12]);
    expect(filters.from).toBe(1999);
    expect(filters.rating).toBe(7);
    expect(filters.sort).toBe("rating");
    expect(filters.runtime).toBe("long");
    expect(filters.language).toBe("ja");
  });

  it("swaps a reversed year range and rejects invalid values", () => {
    const filters = parseDiscover({ from: "2010", to: "1990", rating: "42", sort: "random" });
    expect([filters.from, filters.to]).toEqual([1990, 2010]);
    expect(filters.rating).toBeUndefined();
    expect(filters.sort).toBe("popularity");
  });
});

describe("serializeDiscover", () => {
  it("writes only what differs from the defaults and round-trips", () => {
    const filters = parseDiscover({ genres: "18", providers: "8,337", sort: "newest" });
    const search = serializeDiscover(filters);
    expect(search).toMatchObject({ genres: "18", providers: "8,337", sort: "newest" });
    expect(search.runtime).toBeUndefined();
    expect(parseDiscover(search)).toEqual(filters);
    expect(activeFilterCount(filters)).toBe(3);
  });
});

describe("discoverParams", () => {
  it("maps the filters to TMDB discover parameters", () => {
    const params = discoverParams(
      parseDiscover({ genres: "28,12", providers: "8", runtime: "short", to: "2000" }),
      "2026-11-21",
    );
    expect(params).toMatchObject({
      sort_by: "popularity.desc",
      with_genres: "28,12",
      with_watch_providers: "8",
      watch_region: "PL",
      "with_runtime.lte": 90,
      "primary_release_date.lte": "2000-12-31",
    });
  });

  it("stops a newest-first list at today and sets a vote floor for a rating sort", () => {
    expect(discoverParams(parseDiscover({ sort: "newest" }), "2026-11-21")).toMatchObject({
      "primary_release_date.lte": "2026-11-21",
    });
    expect(discoverParams(parseDiscover({ sort: "rating" }), "2026-11-21")).toMatchObject({
      "vote_count.gte": 300,
    });
  });
});
