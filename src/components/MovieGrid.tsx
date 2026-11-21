import type { ReactNode } from "react";
import { useI18n } from "../i18n";
import type { MovieSummary } from "../lib/tmdb";
import { PosterCard, PosterSkeleton } from "./PosterCard";

const SIZES = "(min-width: 1536px) 13rem, (min-width: 1024px) 17vw, (min-width: 640px) 28vw, 45vw";

export function MovieGrid({
  movies,
  loading,
  hasMore,
  loadingMore,
  onMore,
  columns = "grid-cols-2 xs:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
  empty,
}: {
  movies: MovieSummary[];
  loading: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onMore?: () => void;
  columns?: string;
  empty?: ReactNode;
}) {
  const { t } = useI18n();
  if (loading) {
    return (
      <ul className={`grid gap-x-4 gap-y-8 ${columns}`} aria-busy="true">
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>
            <PosterSkeleton />
          </li>
        ))}
      </ul>
    );
  }
  if (!movies.length) return <>{empty}</>;
  // TMDB pages can repeat a film when the ranking moves between two requests
  const seen = new Set<number>();
  const unique = movies.filter((m) => !seen.has(m.id) && seen.add(m.id));
  return (
    <>
      <ul className={`grid gap-x-4 gap-y-8 ${columns}`}>
        {unique.map((movie) => (
          <li key={movie.id} className="fade-in">
            <PosterCard movie={movie} sizes={SIZES} />
          </li>
        ))}
      </ul>
      {hasMore && onMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            className="btn btn-ghost min-w-48"
            onClick={onMore}
            disabled={loadingMore}
            aria-busy={loadingMore}
          >
            {loadingMore ? t.a11y.loading : t.discover.loadMore}
          </button>
        </div>
      )}
    </>
  );
}
