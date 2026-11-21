import { describe, expect, it } from "vitest";
import { pathId, readId, slugify } from "./ids";
import { certification, pickTrailer, type MovieDetails, type Video } from "./tmdb";

const video = (patch: Partial<Video>): Video => ({
  key: "k",
  name: "n",
  site: "YouTube",
  type: "Trailer",
  official: false,
  iso_639_1: "en",
  published_at: "2020-01-01",
  ...patch,
});

describe("pickTrailer", () => {
  it("prefers an official trailer in the page language", () => {
    const videos = [
      video({ key: "teaser", type: "Teaser", iso_639_1: "pl" }),
      video({ key: "en", official: true }),
      video({ key: "pl", official: true, iso_639_1: "pl" }),
      video({ key: "vimeo", site: "Vimeo", iso_639_1: "pl", official: true }),
    ];
    expect(pickTrailer(videos, "pl")?.key).toBe("pl");
    expect(pickTrailer(videos, "en")?.key).toBe("en");
  });

  it("ignores featurettes", () => {
    expect(pickTrailer([video({ type: "Featurette" })], "en")).toBeUndefined();
  });
});

describe("certification", () => {
  it("reads the Polish age rating of the earliest release type that has one", () => {
    const details = {
      release_dates: {
        results: [
          {
            iso_3166_1: "PL",
            release_dates: [
              { certification: "", type: 1, release_date: "" },
              { certification: "16", type: 3, release_date: "" },
            ],
          },
        ],
      },
    } as unknown as MovieDetails;
    expect(certification(details)).toBe("16");
    expect(certification(details, "DE")).toBeUndefined();
  });
});

describe("path ids", () => {
  it("makes readable slugs with Polish letters", () => {
    expect(slugify("Żółć i Łódź: część 2")).toBe("zolc-i-lodz-czesc-2");
    expect(pathId(550, "Fight Club")).toBe("550-fight-club");
    expect(pathId(7, "???")).toBe("7");
  });

  it("reads only the leading number", () => {
    expect(readId("550-fight-club")).toBe(550);
    expect(readId("550")).toBe(550);
    expect(readId("fight-550")).toBeNull();
    expect(readId("0")).toBeNull();
  });
});
