import { Link } from "@tanstack/react-router";
import { Bookmark, Check, Film, Star } from "lucide-react";
import type { MouseEvent } from "react";
import { useI18n } from "../i18n";
import { pathId } from "../lib/ids";
import { imageUrl, posterSrcSet } from "../lib/images";
import { useLibraryEntry } from "../lib/library";

export interface PosterMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average: number;
}

// Only the clicked poster carries the view-transition name, so two cards of one film never clash.
export function markPoster(event: MouseEvent<HTMLElement>) {
  const img = event.currentTarget.querySelector<HTMLElement>("[data-poster]");
  if (img) img.style.viewTransitionName = "poster";
}

export function Poster({
  path,
  title,
  sizes,
  eager = false,
  className = "",
}: {
  path: string | null;
  title: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  if (!path) {
    return (
      <div
        className={`flex aspect-[2/3] flex-col items-center justify-center gap-2 bg-raised p-3 text-center text-sm text-muted ${className}`}
      >
        <Film className="size-6" aria-hidden="true" />
        <span>{t.common.noPoster}</span>
      </div>
    );
  }
  return (
    <img
      data-poster
      src={imageUrl(path, "w342")}
      srcSet={posterSrcSet(path)}
      sizes={sizes}
      alt={title}
      width={342}
      height={513}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      className={`aspect-[2/3] w-full bg-raised object-cover ${className}`}
    />
  );
}

export function RatingBadge({ value, className = "" }: { value: number; className?: string }) {
  const { fmt, t } = useI18n();
  if (!value) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-scrim/80 px-2 py-0.5 text-xs font-semibold text-[oklch(0.97_0.01_85)] backdrop-blur ${className}`}
    >
      <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
      <span className="sr-only">{t.movie.rating}: </span>
      {fmt.rating(value)}
    </span>
  );
}

export function PosterCard({
  movie,
  sizes = "(min-width: 1280px) 12rem, (min-width: 768px) 11rem, 9.5rem",
  eager = false,
  subtitle,
}: {
  movie: PosterMovie;
  sizes?: string;
  eager?: boolean;
  subtitle?: string;
}) {
  const { langParam, fmt, t } = useI18n();
  const entry = useLibraryEntry(movie.id);
  return (
    <Link
      to="/{-$lang}/movie/$id/"
      params={{ lang: langParam, id: pathId(movie.id, movie.title) }}
      onClick={markPoster}
      className="group block rounded-xl outline-offset-4"
    >
      <div className="relative overflow-hidden rounded-xl shadow-poster ring-1 ring-line transition-transform duration-500 ease-out-expo group-hover:-translate-y-1.5 group-hover:shadow-pop">
        <Poster
          path={movie.poster_path}
          title={movie.title}
          sizes={sizes}
          eager={eager}
          className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10 ring-inset" />
        <RatingBadge value={movie.vote_average} className="absolute top-2 left-2" />
        {entry && (
          <span
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-accent text-on-accent shadow"
            title={entry.status === "watched" ? t.library.isWatched : t.library.onWatchlist}
          >
            {entry.status === "watched" ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Bookmark className="size-3.5 fill-current" aria-hidden="true" />
            )}
            <span className="sr-only">
              {entry.status === "watched" ? t.library.isWatched : t.library.onWatchlist}
            </span>
          </span>
        )}
      </div>
      <p className="mt-2.5 line-clamp-2 text-[0.95rem] leading-snug font-semibold group-hover:text-accent-text">
        {movie.title}
      </p>
      <p className="mt-0.5 text-sm text-muted">{subtitle ?? fmt.year(movie.release_date)}</p>
    </Link>
  );
}

export function PosterSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[2/3] rounded-xl" />
      <div className="skeleton mt-3 h-4 w-4/5 rounded" />
      <div className="skeleton mt-2 h-3 w-1/3 rounded" />
    </div>
  );
}
