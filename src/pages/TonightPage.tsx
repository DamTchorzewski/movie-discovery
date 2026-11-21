import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Dices, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LibraryActions } from "../components/LibraryActions";
import { Poster, RatingBadge } from "../components/PosterCard";
import { toast } from "../components/Toasts";
import { useI18n } from "../i18n";
import { pathId } from "../lib/ids";
import { imageUrl } from "../lib/images";
import { useLibrary } from "../lib/library";
import { draw, matches, MOOD_GENRES, MOODS, TIMES, type Mood, type TimeLimit } from "../lib/picker";
import { providersQuery } from "../lib/queries";
import { FEATURED_PROVIDERS, REGION, tmdb, type MovieSummary, type Paged } from "../lib/tmdb";
import { usePageTitle } from "../lib/use-title";

type Source = "watchlist" | "all";

const SHUFFLE_MS = 1300;

function toggle(list: number[], id: number) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function TonightPage() {
  const { t, tmdbLang, fmt, langParam } = useI18n();
  usePageTitle(t.tonight.title);
  const library = useLibrary();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const providers = useQuery(providersQuery(tmdbLang));

  const watchlist = useMemo(
    () => Object.values(library).filter((e) => e.status === "watchlist" && e.title),
    [library],
  );
  const [source, setSource] = useState<Source>(watchlist.length ? "watchlist" : "all");
  const [mood, setMood] = useState<Mood | "any">("any");
  const [time, setTime] = useState<TimeLimit>("any");
  const [minRating, setMinRating] = useState(6);
  const [services, setServices] = useState<number[]>([]);
  const [pick, setPick] = useState<MovieSummary | null>(null);
  const [shuffle, setShuffle] = useState<MovieSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState(false);
  const seen = useRef(new Set<number>());
  const resultRef = useRef<HTMLDivElement>(null);

  const featured = FEATURED_PROVIDERS.map((id) =>
    providers.data?.find((p) => p.provider_id === id),
  ).filter((p) => p !== undefined);

  const options = { mood, time, minRating };
  const moodLabels = t.tonight.moods;
  const timeLabels: Record<TimeLimit, string> = {
    any: t.tonight.anyTime,
    "100": t.tonight.under100,
    "130": t.tonight.under130,
  };

  async function candidates(): Promise<MovieSummary[]> {
    if (source === "watchlist") {
      return watchlist
        .filter((e) => matches(e, options))
        .map((e) => ({
          id: e.id,
          title: e.title,
          overview: "",
          poster_path: e.posterPath,
          backdrop_path: e.backdropPath,
          release_date: e.releaseDate,
          vote_average: e.voteAverage,
          vote_count: 0,
          genre_ids: e.genreIds,
        }));
    }
    const params = {
      language: tmdbLang,
      sort_by: "popularity.desc",
      include_adult: false,
      "vote_count.gte": 200,
      "vote_average.gte": minRating,
      with_genres: mood === "any" ? undefined : MOOD_GENRES[mood].join("|"),
      "with_runtime.lte": time === "any" ? undefined : Number(time),
      "with_runtime.gte": 60,
      with_watch_providers: services.join("|") || undefined,
      watch_region: services.length ? REGION : undefined,
      with_watch_monetization_types: services.length ? "flatrate" : undefined,
    };
    const first = await queryClient.fetchQuery({
      queryKey: ["tonight", params, 1],
      queryFn: () => tmdb<Paged<MovieSummary>>("/discover/movie", { ...params, page: 1 }),
      staleTime: 60 * 60 * 1000,
    });
    // a random page among the first few, so the same evening does not repeat the same films
    const pages = Math.min(first.total_pages, 5);
    const page = 1 + Math.floor(Math.random() * pages);
    const chosen =
      page === 1
        ? first
        : await queryClient.fetchQuery({
            queryKey: ["tonight", params, page],
            queryFn: () => tmdb<Paged<MovieSummary>>("/discover/movie", { ...params, page }),
            staleTime: 60 * 60 * 1000,
          });
    return [...chosen.results, ...first.results].filter((m) => m.poster_path);
  }

  async function run() {
    setBusy(true);
    setEmpty(false);
    try {
      const list = await candidates();
      const fresh = list.filter((m) => !seen.current.has(m.id));
      const pool = fresh.length ? fresh : list;
      if (!fresh.length) seen.current.clear();
      const winner = draw(pool, pick?.id);
      if (!winner) {
        setPick(null);
        setEmpty(true);
        return;
      }
      seen.current.add(winner.id);
      if (!reduce && pool.length > 1) {
        setPick(null);
        setShuffle(pool.slice(0, 12));
        await new Promise((r) => setTimeout(r, SHUFFLE_MS));
        setShuffle([]);
      }
      setPick(winner);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "center",
        }),
      );
    } catch {
      toast(t.common.errorText);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page pt-24 sm:pt-28">
      <header className="max-w-3xl">
        <p className="eyebrow">{t.nav.tonight}</p>
        <h1 className="mt-2 text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-semibold">
          {t.tonight.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{t.tonight.lead}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
        <form
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold">{t.tonight.source}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["watchlist", "all"] as const).map((value) => (
                <label key={value} className="chip cursor-pointer">
                  <input
                    type="radio"
                    name="source"
                    className="sr-only"
                    checked={source === value}
                    disabled={value === "watchlist" && !watchlist.length}
                    onChange={() => setSource(value)}
                  />
                  {value === "watchlist"
                    ? `${t.tonight.fromWatchlist} (${fmt.number(watchlist.length)})`
                    : t.tonight.fromEverything}
                </label>
              ))}
            </div>
            {!watchlist.length && (
              <p className="mt-2 text-sm text-muted">{t.tonight.emptyWatchlist}</p>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">{t.tonight.mood}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["any", ...MOODS] as const).map((value) => (
                <label key={value} className="chip cursor-pointer">
                  <input
                    type="radio"
                    name="mood"
                    className="sr-only"
                    checked={mood === value}
                    onChange={() => setMood(value)}
                  />
                  {value === "any" ? t.tonight.anyMood : moodLabels[value]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">{t.tonight.time}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIMES.map((value) => (
                <label key={value} className="chip cursor-pointer">
                  <input
                    type="radio"
                    name="time"
                    className="sr-only"
                    checked={time === value}
                    onChange={() => setTime(value)}
                  />
                  {timeLabels[value]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">{t.tonight.minRating}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {[0, 6, 7, 8].map((value) => (
                <label key={value} className="chip cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    className="sr-only"
                    checked={minRating === value}
                    onChange={() => setMinRating(value)}
                  />
                  {value ? `★ ${fmt.number(value)}+` : t.tonight.anyMood}
                </label>
              ))}
            </div>
          </fieldset>

          {source === "all" && featured.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold">{t.tonight.providers}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {featured.map((p) => (
                  <label key={p.provider_id} className="chip cursor-pointer pl-1.5">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={services.includes(p.provider_id)}
                      onChange={() => setServices((s) => toggle(s, p.provider_id))}
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
          )}

          <button
            type="submit"
            className="btn btn-primary min-h-14 w-full px-8 text-lg sm:w-auto"
            disabled={busy}
          >
            <Dices
              className={`size-5 ${busy && !reduce ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {busy ? t.tonight.drawing : pick ? t.tonight.drawAgain : t.tonight.draw}
          </button>
        </form>

        <div ref={resultRef} aria-live="polite" className="lg:sticky lg:top-24 lg:self-start">
          <AnimatePresence mode="wait">
            {shuffle.length > 0 ? (
              <Shuffler key="shuffle" movies={shuffle} />
            ) : pick ? (
              <motion.div
                key={pick.id}
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="relative isolate overflow-hidden rounded-[2rem] border border-line bg-surface p-5 sm:p-6"
              >
                {pick.backdrop_path && (
                  <img
                    src={imageUrl(pick.backdrop_path, "w300")}
                    alt=""
                    className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-30 blur-2xl"
                  />
                )}
                <p className="eyebrow">{t.tonight.result}</p>
                <div className="mt-4 grid grid-cols-[8rem_1fr] gap-5 sm:grid-cols-[10rem_1fr]">
                  <div className="overflow-hidden rounded-xl shadow-pop ring-1 ring-line">
                    <Poster path={pick.poster_path} title={pick.title} sizes="10rem" eager />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl leading-tight font-semibold sm:text-3xl">
                      {pick.title}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                      {fmt.year(pick.release_date)}
                      <RatingBadge value={pick.vote_average} />
                    </p>
                    {pick.overview && <p className="mt-3 line-clamp-4 text-sm">{pick.overview}</p>}
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      toast(t.tonight.picked(pick.title));
                      void navigate({
                        to: "/{-$lang}/movie/$id/",
                        params: { lang: langParam, id: pathId(pick.id, pick.title) },
                      });
                    }}
                  >
                    <Check className="size-4" aria-hidden="true" />
                    {t.tonight.pick}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void run()}
                    disabled={busy}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {t.tonight.drawAgain}
                  </button>
                </div>
                {source === "all" && (
                  <div className="mt-3">
                    <LibraryActions movie={pick} />
                  </div>
                )}
                <Link
                  to="/{-$lang}/movie/$id/"
                  params={{ lang: langParam, id: pathId(pick.id, pick.title) }}
                  className="sr-only"
                >
                  {pick.title}
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex aspect-[4/5] flex-col items-center justify-center rounded-[2rem] border border-dashed border-line-strong p-8 text-center text-muted sm:aspect-square"
              >
                <Dices className="size-12" aria-hidden="true" />
                <p className="mt-4 max-w-xs">{empty ? t.tonight.empty : t.tonight.lead}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Posters flick past like a slot machine before the draw is revealed.
function Shuffler({ movies }: { movies: MovieSummary[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => i + 1), 110);
    return () => window.clearInterval(timer);
  }, []);
  const movie = movies[index % movies.length]!;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex aspect-[4/5] items-center justify-center rounded-[2rem] border border-line bg-surface sm:aspect-square"
    >
      <p className="sr-only">{t.tonight.drawing}</p>
      <div className="relative w-40 sm:w-48" aria-hidden="true">
        <div className="absolute inset-0 translate-x-4 rotate-6 rounded-xl bg-raised" />
        <div className="absolute inset-0 -translate-x-4 -rotate-6 rounded-xl bg-raised" />
        <div className="relative overflow-hidden rounded-xl shadow-pop ring-1 ring-line">
          <img
            src={imageUrl(movie.poster_path, "w342")}
            alt=""
            width={342}
            height={513}
            className="aspect-[2/3] w-full object-cover"
          />
        </div>
      </div>
    </motion.div>
  );
}
