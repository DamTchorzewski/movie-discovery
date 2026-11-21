import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { MovieGrid } from "../components/MovieGrid";
import { PersonCard } from "../components/PersonCard";
import { Rail } from "../components/Rail";
import { EmptyState, ErrorState } from "../components/States";
import { useI18n } from "../i18n";
import { movieSearchQuery, multiSearchQuery } from "../lib/queries";
import { isPerson } from "../lib/tmdb";
import { useDebounced } from "../lib/use-debounced";
import { usePageTitle } from "../lib/use-title";

const route = getRouteApi("/{-$lang}/search");

export function SearchPage() {
  const { t, tmdbLang } = useI18n();
  const { q } = route.useSearch();
  const navigate = useNavigate({ from: "/{-$lang}/search" });
  const [value, setValue] = useState(q);
  const debounced = useDebounced(value.trim(), 300);
  usePageTitle(q ? t.search.resultsTitle(q) : t.search.title);

  // a new ?q= from outside (the palette, back and forward) replaces what is typed
  const [shownQ, setShownQ] = useState(q);
  if (shownQ !== q) {
    setShownQ(q);
    setValue(q);
  }
  useEffect(() => {
    if (debounced !== q) navigate({ search: { q: debounced }, replace: true, resetScroll: false });
  }, [debounced, q, navigate]);

  const movies = useInfiniteQuery(movieSearchQuery(q, tmdbLang));
  const multi = useQuery(multiSearchQuery(q, tmdbLang));
  const people = (multi.data?.results ?? [])
    .filter(isPerson)
    .filter((p) => p.profile_path)
    .slice(0, 12);
  const list = movies.data?.pages.flatMap((p) => p.results) ?? [];
  const total = movies.data?.pages[0]?.total_results ?? 0;

  return (
    <div className="pt-24 sm:pt-28">
      <div className="container-page">
        <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-semibold">
          {q ? t.search.resultsTitle(q) : t.search.title}
        </h1>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { q: value.trim() }, replace: true });
          }}
          className="mt-8 max-w-2xl"
        >
          <label htmlFor="search-page-input" className="sr-only">
            {t.search.label}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="search-page-input"
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t.search.placeholder}
              autoComplete="off"
              enterKeyHint="search"
              className="field h-14 rounded-full pl-13 text-lg"
            />
          </div>
        </form>
        {q && (
          <p className="mt-4 text-sm text-muted" aria-live="polite">
            {movies.isPending ? t.a11y.loading : t.search.resultsCount(total)}
          </p>
        )}
      </div>

      {people.length > 0 && (
        <Rail title={t.search.people} itemClass="w-28 sm:w-32">
          {people.map((p) => (
            <PersonCard
              key={p.id}
              id={p.id}
              name={p.name}
              role={p.known_for_department}
              profilePath={p.profile_path}
            />
          ))}
        </Rail>
      )}

      <section aria-labelledby="movie-results" className="container-page mt-14">
        <h2
          id="movie-results"
          className={q ? "text-2xl font-semibold sm:text-[1.75rem]" : "sr-only"}
        >
          {t.search.movies}
        </h2>
        <div className="mt-6">
          {!q ? (
            <EmptyState art="search" title={t.search.hint} />
          ) : movies.isError ? (
            <ErrorState onRetry={() => movies.refetch()} headingLevel={2} />
          ) : (
            <MovieGrid
              movies={list}
              loading={movies.isPending}
              hasMore={movies.hasNextPage}
              loadingMore={movies.isFetchingNextPage}
              onMore={() => movies.fetchNextPage()}
              empty={<EmptyState art="search" title={t.search.empty} />}
            />
          )}
        </div>
      </section>
    </div>
  );
}
