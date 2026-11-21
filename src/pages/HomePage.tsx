import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Dices } from "lucide-react";
import { useMemo, useState } from "react";
import { Hero, HeroSkeleton } from "../components/Hero";
import { PosterCard, PosterSkeleton } from "../components/PosterCard";
import { Rail } from "../components/Rail";
import { ErrorState } from "../components/States";
import { useI18n } from "../i18n";
import { useLibrary } from "../lib/library";
import { feedQuery, genresQuery, providerFeedQuery, type Feed } from "../lib/queries";
import type { MovieSummary } from "../lib/tmdb";
import { usePageTitle } from "../lib/use-title";

function MovieRail({
  title,
  movies,
  loading,
  actions,
}: {
  title: string;
  movies: MovieSummary[] | undefined;
  loading: boolean;
  actions?: React.ReactNode;
}) {
  if (!loading && !movies?.length) return null;
  const items = loading
    ? Array.from({ length: 8 }, (_, i) => <PosterSkeleton key={i} />)
    : (movies ?? []).map((m) => <PosterCard key={m.id} movie={m} />);
  return (
    <Rail title={title} actions={actions}>
      {items}
    </Rail>
  );
}

function FeedRail({ feed, title }: { feed: Feed; title: string }) {
  const { tmdbLang } = useI18n();
  const { data, isPending } = useQuery(feedQuery(feed, tmdbLang));
  return <MovieRail title={title} movies={data?.results} loading={isPending} />;
}

function ProviderRail({ id, name }: { id: number; name: string }) {
  const { tmdbLang, t } = useI18n();
  const { data, isPending } = useQuery(providerFeedQuery(id, tmdbLang));
  return <MovieRail title={t.home.onProvider(name)} movies={data?.results} loading={isPending} />;
}

function TrendingRail() {
  const { t, tmdbLang } = useI18n();
  const [week, setWeek] = useState(false);
  const { data, isPending } = useQuery(
    feedQuery(week ? "trending-week" : "trending-day", tmdbLang),
  );
  const toggle = (
    <div className="flex rounded-full bg-raised p-1" role="group" aria-label={t.home.trending}>
      {[false, true].map((value) => (
        <button
          key={String(value)}
          type="button"
          aria-pressed={week === value}
          onClick={() => setWeek(value)}
          className="min-h-9 rounded-full px-4 text-sm font-medium text-muted transition-colors aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
        >
          {value ? t.home.thisWeek : t.home.today}
        </button>
      ))}
    </div>
  );
  return (
    <MovieRail
      title={t.home.trending}
      movies={data?.results}
      loading={isPending}
      actions={toggle}
    />
  );
}

function WatchlistRail() {
  const { t, langParam } = useI18n();
  const library = useLibrary();
  const movies = useMemo(
    () =>
      Object.values(library)
        .filter((e) => e.status === "watchlist" && e.title)
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
        .slice(0, 12)
        .map((e) => ({
          id: e.id,
          title: e.title,
          poster_path: e.posterPath,
          release_date: e.releaseDate,
          vote_average: e.voteAverage,
        })),
    [library],
  );
  if (!movies.length) return null;
  return (
    <Rail
      title={t.home.continueTitle}
      actions={
        <Link
          to="/{-$lang}/library/"
          params={{ lang: langParam }}
          search={{ tab: undefined }}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-text"
        >
          {t.home.seeAll} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      }
    >
      {movies.map((m) => (
        <PosterCard key={m.id} movie={m} />
      ))}
    </Rail>
  );
}

function TonightBanner() {
  const { t, langParam } = useI18n();
  return (
    <section className="container-page mt-16">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-10 sm:px-12 sm:py-14">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-20 -z-10 size-96 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 left-1/3 -z-10 size-80 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.home.tonightTitle}</h2>
            <p className="mt-3 text-muted sm:text-lg">{t.home.tonightText}</p>
          </div>
          <Link
            to="/{-$lang}/tonight/"
            params={{ lang: langParam }}
            className="btn btn-primary min-h-13 self-start px-6 text-base md:self-auto"
          >
            <Dices className="size-5" aria-hidden="true" />
            {t.home.tonightCta}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Genres() {
  const { t, tmdbLang, langParam } = useI18n();
  const { data } = useQuery(genresQuery(tmdbLang));
  if (!data) return null;
  return (
    <section className="container-page mt-16" aria-labelledby="genres-heading">
      <h2 id="genres-heading" className="text-2xl font-semibold sm:text-[1.75rem]">
        {t.home.genres}
      </h2>
      <ul className="mt-5 flex flex-wrap gap-2">
        {data.map((g) => (
          <li key={g.id}>
            <Link
              to="/{-$lang}/discover/"
              params={{ lang: langParam }}
              search={{ genres: String(g.id) }}
              className="chip"
            >
              {g.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomePage() {
  const { t, tmdbLang } = useI18n();
  usePageTitle();
  const trending = useQuery(feedQuery("trending-day", tmdbLang));
  const genres = useQuery(genresQuery(tmdbLang));

  return (
    <>
      <h1 className="sr-only">{t.meta.title}</h1>
      {trending.isError ? (
        <div className="pt-24">
          <ErrorState onRetry={() => trending.refetch()} headingLevel={2} />
        </div>
      ) : trending.data ? (
        <Hero movies={trending.data.results} genres={genres.data} />
      ) : (
        <HeroSkeleton />
      )}
      <div className="relative z-10 -mt-6">
        <WatchlistRail />
        <TrendingRail />
        <FeedRail feed="now-playing" title={t.home.nowPlaying} />
        <TonightBanner />
        <ProviderRail id={8} name="Netflix" />
        <FeedRail feed="top-rated" title={t.home.topRated} />
        <ProviderRail id={1899} name="HBO Max" />
        <ProviderRail id={337} name="Disney+" />
        <FeedRail feed="upcoming" title={t.home.upcoming} />
        <Genres />
      </div>
    </>
  );
}
