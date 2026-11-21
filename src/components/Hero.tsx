import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Info, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { pathId } from "../lib/ids";
import { backdropSrcSet, imageUrl } from "../lib/images";
import type { Genre, MovieSummary } from "../lib/tmdb";
import { LibraryActions } from "./LibraryActions";
import { RatingBadge } from "./PosterCard";

const INTERVAL = 8000;

// The trending films of the day, one at a time. It advances by itself only with
// prefers-reduced-motion: no-preference, has a pause button and stops on any input.
export function Hero({ movies, genres }: { movies: MovieSummary[]; genres: Genre[] | undefined }) {
  const { t, fmt, langParam } = useI18n();
  const slides = movies.filter((m) => m.backdrop_path).slice(0, 6);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!playing || hover || slides.length < 2) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [playing, hover, index, slides.length]);

  const movie = slides[index];
  if (!movie) return <HeroSkeleton />;

  const go = (step: number) => {
    setPlaying(false);
    setIndex((i) => (i + step + slides.length) % slides.length);
  };
  const genreNames = (movie.genre_ids ?? [])
    .map((id) => genres?.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.home.heroEyebrow}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
      className="relative isolate flex min-h-[38rem] items-end overflow-hidden bg-scrim pt-24 text-[oklch(0.97_0.01_85)] sm:min-h-[44rem] lg:h-[min(88dvh,58rem)]"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={movie.id}
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <img
            src={imageUrl(movie.backdrop_path, "w1280")}
            srcSet={backdropSrcSet(movie.backdrop_path)}
            sizes="100vw"
            alt=""
            width={1280}
            height={720}
            fetchPriority={index === 0 ? "high" : "auto"}
            className="ken-burns size-full object-cover object-[center_25%]"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-canvas via-scrim/55 to-scrim/30" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-scrim/85 via-scrim/35 to-transparent" />

      <div className="container-page relative pb-14 sm:pb-20">
        <div
          key={movie.id}
          className="rise max-w-2xl"
          role="group"
          aria-roledescription="slide"
          aria-label={t.a11y.slide(index + 1, slides.length)}
        >
          <p className="eyebrow text-accent">{t.home.heroEyebrow}</p>
          <h2 className="mt-3 text-[clamp(2.4rem,7vw,5.25rem)] leading-[0.95] font-semibold">
            {movie.title}
          </h2>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-[oklch(0.9_0.01_85)]">
            <RatingBadge value={movie.vote_average} className="text-sm" />
            <span>{fmt.year(movie.release_date)}</span>
            {genreNames.length > 0 && <span aria-hidden="true">·</span>}
            <span>{genreNames.join(", ")}</span>
          </p>
          <p className="mt-4 line-clamp-3 max-w-xl text-base text-[oklch(0.92_0.01_85)] sm:text-lg">
            {movie.overview}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/{-$lang}/movie/$id/"
              params={{ lang: langParam, id: pathId(movie.id, movie.title) }}
              className="btn btn-primary"
            >
              <Info className="size-4" aria-hidden="true" />
              {t.home.details}
            </Link>
            <LibraryActions movie={movie} onImage />
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="btn btn-on-image btn-icon"
            aria-label={playing ? t.a11y.pause : t.a11y.play}
          >
            {playing ? (
              <Pause className="size-4" aria-hidden="true" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => go(-1)}
            className="btn btn-on-image btn-icon"
            aria-label={t.a11y.previous}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="btn btn-on-image btn-icon"
            aria-label={t.a11y.next}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <ol className="ml-2 flex items-center gap-1.5" aria-label={t.home.heroEyebrow}>
            {slides.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setIndex(i);
                  }}
                  aria-label={`${t.a11y.slide(i + 1, slides.length)}: ${s.title}`}
                  aria-current={i === index ? "true" : undefined}
                  className="group flex h-6 items-center"
                >
                  <span className="relative block h-1 w-6 overflow-hidden rounded-full bg-white/30 transition-[width] duration-500 group-aria-[current=true]:w-12 sm:w-8 sm:group-aria-[current=true]:w-16">
                    {i === index && (
                      <span
                        key={`${index}-${playing && !hover}`}
                        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-accent"
                        style={
                          playing && !hover
                            ? { animation: `hero-progress ${INTERVAL}ms linear both` }
                            : undefined
                        }
                      />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative flex min-h-[38rem] items-end bg-raised pt-24 sm:min-h-[44rem] lg:h-[min(88dvh,58rem)]">
      <div className="container-page pb-20" aria-hidden="true">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton mt-5 h-16 w-3/4 max-w-xl rounded-xl" />
        <div className="skeleton mt-5 h-4 w-full max-w-lg rounded" />
        <div className="skeleton mt-2 h-4 w-2/3 max-w-md rounded" />
      </div>
    </div>
  );
}
