import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { discoverParams, type DiscoverFilters } from "./discover";
import {
  REGION,
  tmdb,
  type CollectionDetails,
  type Genre,
  type MovieDetails,
  type MovieSummary,
  type MultiResult,
  type Paged,
  type PersonDetails,
  type ProviderListItem,
  type TmdbLanguage,
} from "./tmdb";

const HOUR = 60 * 60 * 1000;

export type Feed = "trending-day" | "trending-week" | "now-playing" | "upcoming" | "top-rated";

const FEED_PATH: Record<Feed, [string, Record<string, string>]> = {
  "trending-day": ["/trending/movie/day", {}],
  "trending-week": ["/trending/movie/week", {}],
  "now-playing": ["/movie/now_playing", { region: REGION }],
  upcoming: ["/movie/upcoming", { region: REGION }],
  "top-rated": ["/movie/top_rated", {}],
};

export const feedQuery = (feed: Feed, language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["feed", feed, language],
    queryFn: ({ signal }) => {
      const [path, params] = FEED_PATH[feed];
      return tmdb<Paged<MovieSummary>>(path, { ...params, language }, signal);
    },
    staleTime: HOUR,
  });

export const providerFeedQuery = (providerId: number, language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["provider-feed", providerId, language],
    queryFn: ({ signal }) =>
      tmdb<Paged<MovieSummary>>(
        "/discover/movie",
        {
          language,
          watch_region: REGION,
          with_watch_providers: providerId,
          with_watch_monetization_types: "flatrate",
          sort_by: "popularity.desc",
          "vote_count.gte": 50,
        },
        signal,
      ),
    staleTime: HOUR,
  });

export const genresQuery = (language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["genres", language],
    queryFn: ({ signal }) => tmdb<{ genres: Genre[] }>("/genre/movie/list", { language }, signal),
    staleTime: 24 * HOUR,
    select: (data) => data.genres,
  });

export const providersQuery = (language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["providers", language],
    queryFn: ({ signal }) =>
      tmdb<{ results: ProviderListItem[] }>(
        "/watch/providers/movie",
        { language, watch_region: REGION },
        signal,
      ),
    staleTime: 24 * HOUR,
    select: (data) => data.results,
  });

export const movieQuery = (id: number, language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["movie", id, language],
    queryFn: ({ signal }) =>
      tmdb<MovieDetails>(
        `/movie/${id}`,
        {
          language,
          append_to_response: "credits,videos,release_dates,watch/providers,recommendations,images",
          include_video_language: `${language.slice(0, 2)},en`,
          include_image_language: `${language.slice(0, 2)},en,null`,
        },
        signal,
      ),
    staleTime: HOUR,
  });

export const personQuery = (id: number, language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["person", id, language],
    queryFn: ({ signal }) =>
      tmdb<PersonDetails>(
        `/person/${id}`,
        { language, append_to_response: "movie_credits" },
        signal,
      ),
    staleTime: HOUR,
  });

export const collectionQuery = (id: number, language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["collection", id, language],
    queryFn: ({ signal }) => tmdb<CollectionDetails>(`/collection/${id}`, { language }, signal),
    staleTime: HOUR,
  });

export const multiSearchQuery = (query: string, language: TmdbLanguage) =>
  queryOptions({
    queryKey: ["multi", query, language],
    queryFn: ({ signal }) =>
      tmdb<Paged<MultiResult>>("/search/multi", { query, language, include_adult: false }, signal),
    enabled: query.trim().length >= 2,
    staleTime: HOUR,
  });

export const movieSearchQuery = (query: string, language: TmdbLanguage) =>
  infiniteQueryOptions({
    queryKey: ["search", query, language],
    queryFn: ({ signal, pageParam }) =>
      tmdb<Paged<MovieSummary>>(
        "/search/movie",
        { query, language, include_adult: false, page: pageParam },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined,
    enabled: query.trim().length >= 1,
    staleTime: HOUR,
  });

export const discoverQuery = (filters: DiscoverFilters, language: TmdbLanguage, today: string) =>
  infiniteQueryOptions({
    queryKey: ["discover", filters, language],
    queryFn: ({ signal, pageParam }) =>
      tmdb<Paged<MovieSummary>>(
        "/discover/movie",
        { ...discoverParams(filters, today), language, page: pageParam },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined,
    staleTime: HOUR,
  });
