import { TMDB_API_KEY } from "../env";

const BASE_URL = "https://api.themoviedb.org/3";
export const REGION = "PL";

export type TmdbLanguage = "pl-PL" | "en-US";

export class TmdbError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

type Params = Record<string, string | number | boolean | undefined | null>;

export function tmdbUrl(path: string, params: Params = {}): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function tmdb<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch(tmdbUrl(path, params), { signal });
  if (!response.ok) throw new TmdbError(response.status, `TMDB ${response.status} on ${path}`);
  return (await response.json()) as T;
}

// --- Types: only the fields the app reads ----------------------------------------------------

export interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface MovieSummary {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  popularity?: number;
  media_type?: "movie";
}

export interface PersonSummary {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  known_for?: Array<{ media_type: string; id: number; title?: string; name?: string }>;
  media_type?: "person";
}

export type MultiResult = MovieSummary | PersonSummary | { media_type: "tv"; id: number };

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
  published_at: string;
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface CountryProviders {
  link: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  free?: Provider[];
  ads?: Provider[];
}

export interface ImageInfo {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
  iso_639_1: string | null;
}

export interface MovieDetails extends MovieSummary {
  tagline: string;
  runtime: number | null;
  genres: Genre[];
  status: string;
  budget: number;
  revenue: number;
  original_language: string;
  imdb_id: string | null;
  homepage: string | null;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  credits: { cast: CastMember[]; crew: CrewMember[] };
  videos: { results: Video[] };
  release_dates: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification: string; type: number; release_date: string }>;
    }>;
  };
  "watch/providers": { results: Record<string, CountryProviders | undefined> };
  recommendations: Paged<MovieSummary>;
  images: { backdrops: ImageInfo[]; posters: ImageInfo[] };
}

export interface PersonCredit extends MovieSummary {
  character?: string;
  job?: string;
  department?: string;
  credit_id: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  movie_credits: { cast: PersonCredit[]; crew: PersonCredit[] };
}

export interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: MovieSummary[];
}

export interface ProviderListItem {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priorities: Record<string, number | undefined>;
}

export function isMovie(result: MultiResult): result is MovieSummary {
  return result.media_type === "movie";
}

export function isPerson(result: MultiResult): result is PersonSummary {
  return result.media_type === "person";
}

// --- Helpers over the details ----------------------------------------------------------------

// Prefer an official YouTube trailer in the page language, then any trailer, then a teaser.
export function pickTrailer(videos: Video[], language: string): Video | undefined {
  const score = (v: Video) =>
    (v.type === "Trailer" ? 4 : 0) + (v.official ? 1 : 0) + (v.iso_639_1 === language ? 2 : 0);
  return videos
    .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
    .sort((a, b) => score(b) - score(a))[0];
}

// The age rating in a country (the earliest release type that has one), e.g. "16".
export function certification(details: MovieDetails, country = REGION): string | undefined {
  const entry = details.release_dates.results.find((r) => r.iso_3166_1 === country);
  if (!entry) return undefined;
  const sorted = [...entry.release_dates].sort((a, b) => a.type - b.type);
  return sorted.find((d) => d.certification.trim())?.certification.trim();
}

export function crewByJob(details: MovieDetails, jobs: string[]): CrewMember[] {
  const seen = new Set<number>();
  return details.credits.crew.filter((c) => {
    if (!jobs.includes(c.job) || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

// Streaming services shown as filters (the ones Polish viewers use most), in this order.
export const FEATURED_PROVIDERS = [8, 1899, 337, 119, 350, 1773, 2101, 505, 2363, 2214] as const;
