import { useQueries, useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { Download, NotebookPen, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { removeWithUndo, ReviewButton } from "../components/LibraryActions";
import { PosterCard } from "../components/PosterCard";
import { EmptyState } from "../components/States";
import { toast } from "../components/Toasts";
import { useI18n } from "../i18n";
import { libraryActions, useLibrary } from "../lib/library";
import {
  libraryStats,
  parseLibraryFile,
  toLibraryFile,
  type LibraryEntry,
  type LibraryStatus,
} from "../lib/library-schema";
import { genresQuery, movieQuery } from "../lib/queries";
import { usePageTitle } from "../lib/use-title";

const route = getRouteApi("/{-$lang}/library");

type SortKey = "added" | "title" | "rating" | "year";

// Entries moved over from the old app have only an id: fetch their details once.
function useFillLegacy(entries: LibraryEntry[]) {
  const { tmdbLang } = useI18n();
  const missing = entries.filter((e) => !e.title).slice(0, 40);
  const results = useQueries({ queries: missing.map((e) => movieQuery(e.id, tmdbLang)) });
  useEffect(() => {
    for (const r of results) if (r.data) libraryActions.refresh(r.data);
  }, [results]);
}

function Stats({ entries }: { entries: LibraryEntry[] }) {
  const { t, fmt, tmdbLang } = useI18n();
  const genres = useQuery(genresQuery(tmdbLang));
  const stats = libraryStats(entries);
  if (!stats.watched) return null;
  const items: Array<[string, string]> = [
    [t.library.statFilms, fmt.number(stats.watched)],
    [t.library.statHours, fmt.number(Math.round(stats.minutes / 60))],
    [t.library.statAverage, stats.averageRating ? fmt.rating(stats.averageRating) : "—"],
    [t.library.statTopGenre, genres.data?.find((g) => g.id === stats.topGenreId)?.name ?? "—"],
  ];
  return (
    <section aria-labelledby="stats-heading" className="mt-10">
      <h2 id="stats-heading" className="sr-only">
        {t.library.stats}
      </h2>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-line bg-surface p-5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-2 truncate font-display text-3xl font-semibold sm:text-4xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LibraryCard({ entry }: { entry: LibraryEntry }) {
  const { t } = useI18n();
  const movie = {
    id: entry.id,
    title: entry.title || `#${entry.id}`,
    poster_path: entry.posterPath,
    release_date: entry.releaseDate,
    vote_average: entry.voteAverage,
  };
  return (
    <div>
      <PosterCard
        movie={movie}
        sizes="(min-width: 1536px) 13rem, (min-width: 1024px) 17vw, (min-width: 640px) 28vw, 45vw"
      />
      <div className="mt-2 flex items-center gap-1">
        {entry.status === "watched" && (
          <ReviewButton
            entry={entry}
            className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-sm font-medium text-muted hover:bg-raised hover:text-ink"
          />
        )}
        {entry.note && (
          <span
            title={entry.note}
            className="inline-flex size-9 items-center justify-center text-muted"
          >
            <NotebookPen className="size-4" aria-hidden="true" />
            <span className="sr-only">
              {t.library.yourNote}: {entry.note}
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={() => removeWithUndo(entry.id, movie.title, t)}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-danger"
          aria-label={`${t.library.remove}: ${movie.title}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function LibraryPage() {
  const { t, fmt, langParam } = useI18n();
  usePageTitle(t.library.title);
  const { tab } = route.useSearch();
  const status: LibraryStatus = tab === "watched" ? "watched" : "watchlist";
  const library = useLibrary();
  const all = useMemo(() => Object.values(library), [library]);
  const [sort, setSort] = useState<SortKey>("added");
  const file = useRef<HTMLInputElement>(null);
  useFillLegacy(all);

  const entries = useMemo(() => {
    const list = all.filter((e) => e.status === status);
    const by: Record<SortKey, (a: LibraryEntry, b: LibraryEntry) => number> = {
      added: (a, b) => (b.watchedAt ?? b.addedAt).localeCompare(a.watchedAt ?? a.addedAt),
      title: (a, b) => fmt.compare(a.title, b.title),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.voteAverage - a.voteAverage,
      year: (a, b) => b.releaseDate.localeCompare(a.releaseDate),
    };
    return list.sort(by[sort]);
  }, [all, status, sort, fmt]);

  const counts = {
    watchlist: all.filter((e) => e.status === "watchlist").length,
    watched: all.filter((e) => e.status === "watched").length,
  };

  const exportFile = () => {
    const data = JSON.stringify(toLibraryFile(library, new Date().toISOString()), null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kadr-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) return;
    const entries =
      chosen.size < 5_000_000
        ? parseLibraryFile(await chosen.text(), new Date().toISOString())
        : null;
    if (!entries) {
      toast(t.library.importError);
      return;
    }
    libraryActions.import(entries);
    toast(t.library.imported(entries.length));
  };

  const sortLabels: Record<SortKey, string> = {
    added: t.library.sortAdded,
    title: t.library.sortTitle,
    rating: t.library.sortRating,
    year: t.library.sortYear,
  };

  return (
    <div className="container-page pt-24 sm:pt-28">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-semibold">
            {t.library.title}
          </h1>
          <p className="mt-4 text-muted">{t.library.lead}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={exportFile}
            disabled={!all.length}
          >
            <Download className="size-4" aria-hidden="true" />
            {t.library.export}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => file.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            {t.library.import}
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={importFile}
          />
        </div>
      </header>

      {status === "watched" && <Stats entries={all} />}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-line">
        <nav aria-label={t.library.title} className="-mb-px flex gap-6">
          {(["watchlist", "watched"] as const).map((key) => (
            <Link
              key={key}
              to="/{-$lang}/library/"
              params={{ lang: langParam }}
              search={{ tab: key === "watched" ? "watched" : undefined }}
              aria-current={status === key ? "page" : undefined}
              activeOptions={{ includeSearch: true }}
              activeProps={{}}
              className="flex min-h-12 items-center gap-2 border-b-2 border-transparent font-semibold text-muted aria-[current=page]:border-accent aria-[current=page]:text-ink"
            >
              {key === "watched" ? t.library.watched : t.library.watchlist}
              <span className="rounded-full bg-raised px-2 py-0.5 text-xs">
                {fmt.number(counts[key])}
              </span>
            </Link>
          ))}
        </nav>
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="library-sort" className="text-sm text-muted">
            {t.library.sort}
          </label>
          <select
            id="library-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="field w-auto rounded-full pr-9"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {sortLabels[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {entries.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 xs:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {entries.map((entry) => (
            <li key={entry.id} className="fade-in">
              <LibraryCard entry={entry} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          art={status === "watched" ? "ticket" : "reel"}
          title={status === "watched" ? t.library.emptyWatched : t.library.emptyWatchlist}
          text={status === "watched" ? t.library.emptyWatchedText : t.library.emptyWatchlistText}
        >
          <Link to="/{-$lang}/discover/" params={{ lang: langParam }} className="btn btn-primary">
            {t.library.browse}
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
