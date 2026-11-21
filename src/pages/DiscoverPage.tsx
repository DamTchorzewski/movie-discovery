import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useId, useMemo, useRef } from "react";
import { MovieGrid } from "../components/MovieGrid";
import { EmptyState, ErrorState } from "../components/States";
import { useI18n } from "../i18n";
import { useLightDismiss } from "../lib/use-light-dismiss";
import {
  activeFilterCount,
  LANGUAGES,
  parseDiscover,
  RUNTIMES,
  serializeDiscover,
  SORTS,
  type DiscoverFilters,
  type Runtime,
  type Sort,
} from "../lib/discover";
import { imageUrl } from "../lib/images";
import { discoverQuery, genresQuery, providersQuery } from "../lib/queries";
import { FEATURED_PROVIDERS } from "../lib/tmdb";
import { usePageTitle } from "../lib/use-title";

const route = getRouteApi("/{-$lang}/discover");

function toggle(list: number[], id: number) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function FilterForm({
  filters,
  onChange,
}: {
  filters: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
}) {
  const { t, tmdbLang, fmt } = useI18n();
  const genres = useQuery(genresQuery(tmdbLang));
  const providers = useQuery(providersQuery(tmdbLang));
  const featured = useMemo(
    () =>
      FEATURED_PROVIDERS.map((id) => providers.data?.find((p) => p.provider_id === id)).filter(
        (p) => p !== undefined,
      ),
    [providers.data],
  );
  const uid = useId();
  const year = new Date().getFullYear();
  const runtimeLabel: Record<Runtime, string> = {
    any: t.discover.anyRuntime,
    short: t.discover.short,
    medium: t.discover.medium,
    long: t.discover.long,
  };

  const yearValue = (value: string) => {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n >= 1900 && n <= year + 3 ? n : undefined;
  };

  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="text-sm font-semibold">{t.discover.genres}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {genres.data?.map((g) => (
            <label key={g.id} className="chip cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.genres.includes(g.id)}
                onChange={() => onChange({ ...filters, genres: toggle(filters.genres, g.id) })}
              />
              {g.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{t.discover.providers}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {featured.map((p) => (
            <label key={p.provider_id} className="chip cursor-pointer pl-1.5">
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.providers.includes(p.provider_id)}
                onChange={() =>
                  onChange({ ...filters, providers: toggle(filters.providers, p.provider_id) })
                }
              />
              <img
                src={imageUrl(p.logo_path, "w92")}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-full"
              />
              {p.provider_name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{t.discover.years}</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-from`} className="text-xs text-muted">
              {t.discover.from}
            </label>
            <input
              id={`${uid}-from`}
              key={`from-${filters.from ?? ""}`}
              type="number"
              inputMode="numeric"
              min={1900}
              max={year + 3}
              defaultValue={filters.from}
              placeholder="1900"
              onBlur={(e) => onChange({ ...filters, from: yearValue(e.target.value) })}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="field mt-1"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-to`} className="text-xs text-muted">
              {t.discover.to}
            </label>
            <input
              id={`${uid}-to`}
              key={`to-${filters.to ?? ""}`}
              type="number"
              inputMode="numeric"
              min={1900}
              max={year + 3}
              defaultValue={filters.to}
              placeholder={String(year)}
              onBlur={(e) => onChange({ ...filters, to: yearValue(e.target.value) })}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="field mt-1"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{t.discover.runtime}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {RUNTIMES.map((r) => (
            <label key={r} className="chip cursor-pointer">
              <input
                type="radio"
                name={`${uid}-runtime`}
                className="sr-only"
                checked={filters.runtime === r}
                onChange={() => onChange({ ...filters, runtime: r })}
              />
              {runtimeLabel[r]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-rating`} className="text-sm font-semibold">
            {t.discover.minRating}
          </label>
          <select
            id={`${uid}-rating`}
            value={filters.rating ?? ""}
            onChange={(e) =>
              onChange({ ...filters, rating: e.target.value ? Number(e.target.value) : undefined })
            }
            className="field mt-2"
          >
            <option value="">{t.discover.anyRuntime}</option>
            {[5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                ★ {fmt.number(n)}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-votes`} className="text-sm font-semibold">
            {t.discover.minVotes}
          </label>
          <select
            id={`${uid}-votes`}
            value={filters.votes ?? ""}
            onChange={(e) =>
              onChange({ ...filters, votes: e.target.value ? Number(e.target.value) : undefined })
            }
            className="field mt-2"
          >
            <option value="">{t.discover.anyRuntime}</option>
            {[100, 1000, 10000].map((n) => (
              <option key={n} value={n}>
                {fmt.number(n)}+
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-language`} className="text-sm font-semibold">
          {t.discover.language}
        </label>
        <select
          id={`${uid}-language`}
          value={filters.language ?? ""}
          onChange={(e) => onChange({ ...filters, language: e.target.value || undefined })}
          className="field mt-2"
        >
          <option value="">{t.discover.anyLanguage}</option>
          {LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {fmt.language(code)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function DiscoverPage() {
  const { t, tmdbLang, fmt } = useI18n();
  usePageTitle(t.discover.title);
  const search = route.useSearch();
  const filters = useMemo(() => parseDiscover(search), [search]);
  const navigate = useNavigate({ from: "/{-$lang}/discover" });
  const drawer = useRef<HTMLDialogElement>(null);
  useLightDismiss(drawer);
  const today = new Date().toISOString().slice(0, 10);
  const query = useInfiniteQuery(discoverQuery(filters, tmdbLang, today));
  const count = activeFilterCount(filters);
  const total = query.data?.pages[0]?.total_results ?? 0;
  const movies = query.data?.pages.flatMap((p) => p.results) ?? [];

  const onChange = (next: DiscoverFilters) =>
    navigate({ search: serializeDiscover(next), replace: true, resetScroll: false });
  const reset = () => onChange(parseDiscover({}));

  const sortLabel: Record<Sort, string> = {
    popularity: t.discover.sortPopularity,
    rating: t.discover.sortRating,
    newest: t.discover.sortNewest,
    oldest: t.discover.sortOldest,
    revenue: t.discover.sortRevenue,
  };

  return (
    <div className="container-page pt-24 sm:pt-28">
      <header className="max-w-3xl">
        <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-semibold">
          {t.discover.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{t.discover.lead}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[19rem_1fr]">
        <aside aria-labelledby="filters-heading" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-2 pb-6">
            <div className="flex items-center justify-between">
              <h2 id="filters-heading" className="font-sans text-lg font-semibold">
                {t.discover.filters}
              </h2>
              {count > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-6 text-sm font-semibold text-accent-text hover:underline"
                >
                  {t.discover.reset}
                </button>
              )}
            </div>
            <div className="mt-5">
              <FilterForm filters={filters} onChange={onChange} />
            </div>
          </div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="results-heading"
              className="font-sans text-base font-semibold"
              aria-live="polite"
            >
              {query.isPending ? t.a11y.loading : t.discover.results(total)}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost lg:hidden"
                onClick={() => drawer.current?.showModal()}
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                {t.discover.filters}
                {count > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent text-xs text-on-accent">
                    {fmt.number(count)}
                  </span>
                )}
              </button>
              <label className="sr-only" htmlFor="discover-sort">
                {t.discover.sort}
              </label>
              <select
                id="discover-sort"
                value={filters.sort}
                onChange={(e) => onChange({ ...filters, sort: e.target.value as Sort })}
                className="field w-auto rounded-full pr-9"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t.discover.sort}: {sortLabel[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6">
            {query.isError ? (
              <ErrorState onRetry={() => query.refetch()} headingLevel={2} />
            ) : (
              <MovieGrid
                movies={movies}
                loading={query.isPending}
                hasMore={query.hasNextPage}
                loadingMore={query.isFetchingNextPage}
                onMore={() => query.fetchNextPage()}
                columns="grid-cols-2 xs:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5"
                empty={
                  <EmptyState art="search" title={t.discover.empty}>
                    <button type="button" className="btn btn-primary" onClick={reset}>
                      {t.discover.reset}
                    </button>
                  </EmptyState>
                }
              />
            )}
          </div>
        </section>
      </div>

      <dialog
        ref={drawer}
        aria-labelledby="drawer-heading"
        className="m-0 mt-auto h-[88dvh] max-h-none w-full max-w-none rounded-t-3xl border-t border-line bg-surface p-0 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 id="drawer-heading" className="font-sans text-lg font-semibold">
              {t.discover.filters}
            </h2>
            <button
              type="button"
              className="btn btn-icon -mr-2"
              onClick={() => drawer.current?.close()}
              aria-label={t.a11y.close}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
            <FilterForm filters={filters} onChange={onChange} />
          </div>
          <div className="flex gap-3 border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={reset}
              disabled={count === 0}
            >
              {t.discover.reset}
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={() => drawer.current?.close()}
            >
              {t.discover.apply} ({fmt.number(total)})
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
