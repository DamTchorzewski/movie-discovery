import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Layers } from "lucide-react";
import { useEffect } from "react";
import { LibraryActions } from "../components/LibraryActions";
import { PersonCard } from "../components/PersonCard";
import { Poster, PosterCard } from "../components/PosterCard";
import { Providers } from "../components/Providers";
import { Rail } from "../components/Rail";
import { TrailerButton } from "../components/TrailerDialog";
import { useI18n } from "../i18n";
import { Backdrop } from "../components/Backdrop";
import { pathId, readId } from "../lib/ids";
import { imageUrl } from "../lib/images";
import { libraryActions, useLibraryEntry } from "../lib/library";
import { movieQuery } from "../lib/queries";
import { certification, crewByJob, pickTrailer, REGION, type MovieDetails } from "../lib/tmdb";
import { usePageTitle } from "../lib/use-title";

const route = getRouteApi("/{-$lang}/movie/$id");

function Facts({ movie }: { movie: MovieDetails }) {
  const { t, fmt } = useI18n();
  const plRelease = movie.release_dates.results
    .find((r) => r.iso_3166_1 === REGION)
    ?.release_dates.toSorted((a, b) => a.type - b.type)[0]?.release_date;
  const rows: Array<[string, string]> = [
    [
      t.movie.originalTitle,
      movie.original_title && movie.original_title !== movie.title ? movie.original_title : "",
    ],
    [t.movie.release, fmt.date(plRelease ?? movie.release_date)],
    [t.movie.originalLanguage, fmt.language(movie.original_language)],
    [t.movie.runtime, movie.runtime ? t.common.minutes(movie.runtime) : ""],
    [t.movie.budget, fmt.usd(movie.budget)],
    [t.movie.revenue, fmt.usd(movie.revenue)],
  ];
  return (
    <section
      aria-labelledby="facts-heading"
      className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="facts-heading" className="text-xl font-semibold">
        {t.movie.facts}
      </h2>
      <dl className="mt-4 divide-y divide-line text-sm">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
      </dl>
      {movie.imdb_id && (
        <a
          href={`https://www.imdb.com/title/${movie.imdb_id}/`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-6 items-center gap-1 text-sm font-semibold text-accent-text hover:underline"
        >
          {t.movie.imdb}
          <ExternalLink className="size-3.5" aria-hidden="true" />
          <span className="sr-only">{t.a11y.newTab}</span>
        </a>
      )}
    </section>
  );
}

function RatingRing({ value, votes }: { value: number; votes: number }) {
  const { t, fmt } = useI18n();
  if (!value) return null;
  const pct = Math.round(value * 10);
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex size-14 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-accent) ${pct}%, var(--color-line) 0)`,
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-[4px] rounded-full bg-canvas" />
        <span className="relative font-display text-lg font-semibold">{fmt.rating(value)}</span>
      </div>
      <p className="text-sm leading-tight">
        <span className="sr-only">
          {t.movie.rating}: {fmt.rating(value)} / 10.{" "}
        </span>
        <span className="block font-semibold" aria-hidden="true">
          {t.movie.rating}
        </span>
        <span className="text-muted">{t.movie.votes(votes)}</span>
      </p>
    </div>
  );
}

export function MoviePage() {
  const { id } = route.useParams();
  const { t, fmt, tmdbLang, iso, langParam } = useI18n();
  const { data: movie } = useSuspenseQuery(movieQuery(readId(id) ?? 0, tmdbLang));
  const entry = useLibraryEntry(movie.id);
  usePageTitle(movie.title);

  // an entry imported from the old app has only an id: fill in its title and poster
  useEffect(() => {
    if (entry && (!entry.title || entry.runtime === null)) libraryActions.refresh(movie);
  }, [entry, movie]);

  const trailer = pickTrailer(movie.videos.results, iso);
  const cert = certification(movie);
  const directors = crewByJob(movie, ["Director"]);
  const writers = crewByJob(movie, ["Screenplay", "Writer", "Novel", "Story"]).slice(0, 3);
  const cast = movie.credits.cast.slice(0, 18);
  const recommendations = movie.recommendations.results.filter((m) => m.poster_path).slice(0, 18);
  const stills = movie.images.backdrops.filter((b) => !b.iso_639_1).slice(0, 7);

  return (
    <article>
      <Backdrop path={movie.backdrop_path} />
      <div className="container-page relative -mt-40 sm:-mt-64 lg:-mt-80">
        <div className="grid gap-8 md:grid-cols-[minmax(0,15rem)_1fr] lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-12">
          <div className="w-40 self-start sm:w-52 md:w-full">
            <div
              className="overflow-hidden rounded-2xl shadow-pop ring-1 ring-line"
              style={{ viewTransitionName: "poster" }}
            >
              <Poster
                path={movie.poster_path}
                title={movie.title}
                sizes="(min-width: 1024px) 18rem, (min-width: 768px) 15rem, 13rem"
                eager
              />
            </div>
          </div>
          <div className="rise min-w-0 md:pt-24 lg:pt-40">
            <h1 className="text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.98] font-semibold">
              {movie.title}
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.95rem] text-muted">
              <span>{fmt.year(movie.release_date)}</span>
              {cert && (
                <span
                  className="rounded-md border border-line-strong px-1.5 py-0.5 text-xs font-semibold text-ink"
                  title={t.movie.ageRating(cert)}
                >
                  <span className="sr-only">{t.movie.ageRating(cert)}</span>
                  <span aria-hidden="true">{cert}+</span>
                </span>
              )}
              {movie.runtime ? <span>{t.common.minutes(movie.runtime)}</span> : null}
              {movie.genres.length > 0 && <span aria-hidden="true">·</span>}
              <span className="flex flex-wrap gap-1.5">
                {movie.genres.map((g) => (
                  <Link
                    key={g.id}
                    to="/{-$lang}/discover/"
                    params={{ lang: langParam }}
                    search={{ genres: String(g.id) }}
                    className="inline-flex min-h-6 items-center rounded-full bg-raised px-2.5 text-sm text-ink hover:bg-accent hover:text-on-accent"
                  >
                    {g.name}
                  </Link>
                ))}
              </span>
            </p>
            {movie.tagline && (
              <p className="mt-5 font-display text-xl text-accent-text italic sm:text-2xl">
                {iso === "pl" ? `„${movie.tagline}”` : `“${movie.tagline}”`}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <RatingRing value={movie.vote_average} votes={movie.vote_count} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <TrailerButton video={trailer} title={movie.title} className="btn btn-primary" />
              <LibraryActions movie={movie} />
            </div>
            {entry?.note && (
              <blockquote className="mt-6 max-w-2xl rounded-2xl border-l-4 border-accent bg-surface px-5 py-4 text-sm">
                <p className="font-semibold">{t.library.yourNote}</p>
                <p className="mt-1 whitespace-pre-line text-muted">{entry.note}</p>
              </blockquote>
            )}
            <section aria-labelledby="overview-heading" className="mt-8 max-w-3xl">
              <h2 id="overview-heading" className="sr-only">
                {t.movie.overview}
              </h2>
              <p className="text-lg leading-relaxed">{movie.overview || t.movie.noOverview}</p>
            </section>
            {(directors.length > 0 || writers.length > 0) && (
              <dl className="mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
                {directors.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-muted uppercase">
                      {t.movie.director}
                    </dt>
                    <dd className="mt-1.5 flex flex-wrap gap-x-3">
                      {directors.map((d) => (
                        <Link
                          key={d.id}
                          to="/{-$lang}/person/$id/"
                          params={{ lang: langParam, id: pathId(d.id, d.name) }}
                          className="font-semibold hover:text-accent-text"
                        >
                          {d.name}
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
                {writers.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-muted uppercase">
                      {t.movie.writers}
                    </dt>
                    <dd className="mt-1.5 flex flex-wrap gap-x-3">
                      {writers.map((w) => (
                        <Link
                          key={w.id}
                          to="/{-$lang}/person/$id/"
                          params={{ lang: langParam, id: pathId(w.id, w.name) }}
                          className="font-semibold hover:text-accent-text"
                        >
                          {w.name}
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Providers data={movie["watch/providers"].results[REGION]} />
          <Facts movie={movie} />
        </div>
      </div>

      {cast.length > 0 && (
        <Rail title={t.movie.cast} itemClass="w-32 sm:w-36">
          {cast.map((c) => (
            <PersonCard
              key={c.id}
              id={c.id}
              name={c.name}
              role={c.character}
              profilePath={c.profile_path}
            />
          ))}
        </Rail>
      )}

      {movie.belongs_to_collection && (
        <section className="container-page mt-14">
          <Link
            to="/{-$lang}/collection/$id/"
            params={{
              lang: langParam,
              id: pathId(movie.belongs_to_collection.id, movie.belongs_to_collection.name),
            }}
            className="group relative isolate flex min-h-48 items-end overflow-hidden rounded-[2rem] p-6 text-[oklch(0.97_0.01_85)] sm:p-10"
          >
            {movie.belongs_to_collection.backdrop_path && (
              <img
                src={imageUrl(movie.belongs_to_collection.backdrop_path, "w1280")}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-scrim/90 via-scrim/60 to-scrim/20" />
            <div>
              <p className="eyebrow flex items-center gap-2 text-accent">
                <Layers className="size-4" aria-hidden="true" />
                {t.movie.collection}
              </p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
                {movie.belongs_to_collection.name}
              </h2>
              <span className="mt-4 inline-flex items-center gap-2 font-semibold">
                {t.movie.collectionCta}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </div>
          </Link>
        </section>
      )}

      {stills.length > 2 && (
        <section aria-labelledby="stills-heading" className="container-page mt-14">
          <h2 id="stills-heading" className="text-2xl font-semibold sm:text-[1.75rem]">
            {t.movie.gallery}
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stills.map((s, i) => (
              <li key={s.file_path} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                <img
                  src={imageUrl(s.file_path, i === 0 ? "w1280" : "w780")}
                  alt=""
                  width={s.width}
                  height={s.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-video size-full rounded-xl bg-raised object-cover ring-1 ring-line"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recommendations.length > 0 && (
        <Rail title={t.movie.recommendations}>
          {recommendations.map((m) => (
            <PosterCard key={m.id} movie={m} />
          ))}
        </Rail>
      )}
    </article>
  );
}
