// The Discover filters: validated from the URL search string and turned into TMDB parameters.
// Pure functions, unit-tested.

export const SORTS = ["popularity", "rating", "newest", "oldest", "revenue"] as const;
export type Sort = (typeof SORTS)[number];

export const RUNTIMES = ["any", "short", "medium", "long"] as const;
export type Runtime = (typeof RUNTIMES)[number];

export const LANGUAGES = [
  "en",
  "pl",
  "fr",
  "es",
  "it",
  "de",
  "ja",
  "ko",
  "sv",
  "da",
  "hi",
] as const;

export interface DiscoverFilters {
  genres: number[];
  from?: number;
  to?: number;
  rating?: number;
  votes?: number;
  runtime: Runtime;
  language?: string;
  providers: number[];
  sort: Sort;
}

const MIN_YEAR = 1900;
const maxYear = () => new Date().getFullYear() + 3;

function ints(value: unknown): number[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const parsed = list
    .map((v) => (typeof v === "number" ? v : Number.parseInt(String(v), 10)))
    .filter((v) => Number.isInteger(v) && v > 0);
  return [...new Set(parsed)].slice(0, 20);
}

function int(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

export function parseDiscover(search: Record<string, unknown>): DiscoverFilters {
  const from = int(search.from, MIN_YEAR, maxYear());
  const to = int(search.to, MIN_YEAR, maxYear());
  const language =
    typeof search.language === "string" && /^[a-z]{2}$/.test(search.language)
      ? search.language
      : undefined;
  return {
    genres: ints(search.genres),
    from: from && to && from > to ? to : from,
    to: from && to && from > to ? from : to,
    rating: int(search.rating, 1, 9),
    votes: int(search.votes, 1, 100000),
    runtime: RUNTIMES.includes(search.runtime as Runtime) ? (search.runtime as Runtime) : "any",
    language,
    providers: ints(search.providers),
    sort: SORTS.includes(search.sort as Sort) ? (search.sort as Sort) : "popularity",
  };
}

// Only the filters that differ from the defaults go to the URL, so a clean page has a clean address.
export function serializeDiscover(filters: DiscoverFilters): Record<string, string | undefined> {
  return {
    genres: filters.genres.length ? filters.genres.join(",") : undefined,
    from: filters.from?.toString(),
    to: filters.to?.toString(),
    rating: filters.rating?.toString(),
    votes: filters.votes?.toString(),
    runtime: filters.runtime === "any" ? undefined : filters.runtime,
    language: filters.language,
    providers: filters.providers.length ? filters.providers.join(",") : undefined,
    sort: filters.sort === "popularity" ? undefined : filters.sort,
  };
}

export function activeFilterCount(filters: DiscoverFilters): number {
  return (
    filters.genres.length +
    filters.providers.length +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.votes ? 1 : 0) +
    (filters.runtime !== "any" ? 1 : 0) +
    (filters.language ? 1 : 0)
  );
}

const SORT_PARAM: Record<Sort, string> = {
  popularity: "popularity.desc",
  rating: "vote_average.desc",
  newest: "primary_release_date.desc",
  oldest: "primary_release_date.asc",
  revenue: "revenue.desc",
};

export function discoverParams(filters: DiscoverFilters, today: string) {
  const runtime = {
    any: {},
    short: { "with_runtime.lte": 90 },
    medium: { "with_runtime.gte": 90, "with_runtime.lte": 120 },
    long: { "with_runtime.gte": 120 },
  }[filters.runtime];
  return {
    sort_by: SORT_PARAM[filters.sort],
    with_genres: filters.genres.join(",") || undefined,
    "primary_release_date.gte": filters.from ? `${filters.from}-01-01` : undefined,
    // newest-first would start with films announced for years ahead: stop at today
    "primary_release_date.lte": filters.to
      ? `${filters.to}-12-31`
      : filters.sort === "newest"
        ? today
        : undefined,
    "vote_average.gte": filters.rating,
    // a rating sort without a vote floor is topped by films with one 10/10 vote
    "vote_count.gte": filters.votes ?? (filters.sort === "rating" ? 300 : undefined),
    with_original_language: filters.language,
    with_watch_providers: filters.providers.join("|") || undefined,
    watch_region: filters.providers.length ? "PL" : undefined,
    with_watch_monetization_types: filters.providers.length ? "flatrate" : undefined,
    include_adult: false,
    ...runtime,
  };
}
