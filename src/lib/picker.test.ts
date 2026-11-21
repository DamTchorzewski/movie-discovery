import { describe, expect, it } from "vitest";
import { draw, matches, type Candidate } from "./picker";

const comedy: Candidate = { id: 1, genreIds: [35], runtime: 95, voteAverage: 7.1 };
const longDrama: Candidate = { id: 2, genreIds: [18], runtime: 160, voteAverage: 8.2 };
const unknown: Candidate = { id: 3, genreIds: [27], runtime: null, voteAverage: 0 };

describe("matches", () => {
  it("filters by mood, time and rating", () => {
    const any = { mood: "any", time: "any", minRating: 0 } as const;
    expect(matches(comedy, { ...any, mood: "laugh" })).toBe(true);
    expect(matches(longDrama, { ...any, mood: "laugh" })).toBe(false);
    expect(matches(longDrama, { ...any, time: "130" })).toBe(false);
    expect(matches(comedy, { ...any, minRating: 8 })).toBe(false);
  });

  it("keeps a film whose runtime or rating is not known", () => {
    expect(matches(unknown, { mood: "fear", time: "100", minRating: 7 })).toBe(true);
  });
});

describe("draw", () => {
  it("picks by the injected random source", () => {
    const list = [comedy, longDrama, unknown];
    expect(draw(list, undefined, () => 0)?.id).toBe(1);
    expect(draw(list, undefined, () => 0.99)?.id).toBe(3);
  });

  it("never repeats the previous film when there is another", () => {
    expect(draw([comedy, longDrama], 1, () => 0)?.id).toBe(2);
    expect(draw([comedy], 1, () => 0)?.id).toBe(1);
    expect(draw([], undefined)).toBeUndefined();
  });
});
