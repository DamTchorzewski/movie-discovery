import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { PosterCard } from "../components/PosterCard";
import { useI18n } from "../i18n";
import { readId } from "../lib/ids";
import { useLibrary } from "../lib/library";
import { collectionQuery } from "../lib/queries";
import { usePageTitle } from "../lib/use-title";
import { Backdrop } from "../components/Backdrop";

const route = getRouteApi("/{-$lang}/collection/$id");

export function CollectionPage() {
  const { id } = route.useParams();
  const { t, tmdbLang } = useI18n();
  const { data: collection } = useSuspenseQuery(collectionQuery(readId(id) ?? 0, tmdbLang));
  const library = useLibrary();
  usePageTitle(collection.name);

  // released films in order, announced ones (no date) last
  const parts = collection.parts
    .slice()
    .sort((a, b) => (a.release_date || "9999").localeCompare(b.release_date || "9999"));
  const watched = parts.filter((p) => library[p.id]?.status === "watched").length;
  const pct = parts.length ? Math.round((watched / parts.length) * 100) : 0;

  return (
    <article>
      <Backdrop path={collection.backdrop_path} />
      <div className="container-page relative -mt-48 sm:-mt-72">
        <div className="rise max-w-3xl">
          <p className="eyebrow">{t.collection.title}</p>
          <h1 className="mt-2 text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.98] font-semibold">
            {collection.name}
          </h1>
          <p className="mt-3 text-muted">{t.collection.films(parts.length)}</p>
          {collection.overview && (
            <p className="mt-5 text-lg leading-relaxed">{collection.overview}</p>
          )}
          <div className="mt-6 max-w-sm">
            <div className="flex justify-between text-sm font-medium">
              <span>{t.collection.progress(watched, parts.length)}</span>
              <span className="text-muted">{pct}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-raised"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={parts.length}
              aria-valuenow={watched}
              aria-label={t.collection.progress(watched, parts.length)}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <ol className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {parts.map((movie, i) => (
            <li key={movie.id} className="relative">
              <span
                className="mb-2 block font-display text-3xl font-semibold text-muted/60 tabular-nums"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <PosterCard
                movie={movie}
                sizes="(min-width: 1280px) 14rem, (min-width: 768px) 22vw, 45vw"
              />
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
