import { useSyncExternalStore } from "react";
import {
  mergeEntries,
  migrateLegacy,
  parseEntry,
  type Library,
  type LibraryEntry,
  type LibraryStatus,
} from "./library-schema";
import type { MovieDetails, MovieSummary } from "./tmdb";

// The personal library lives in localStorage of this browser only (docs/decisions.md).
const STORAGE_KEY = "kadr.library.v1";
const LEGACY_DONE_KEY = "kadr.legacy-migrated";

let library: Library = {};
let lastMigration = 0;
const listeners = new Set<() => void>();

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode or a full quota: the library stays in memory for this visit
  }
}

function load() {
  const now = new Date().toISOString();
  const raw = readStorage(STORAGE_KEY);
  const next: Library = {};
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const entry = parseEntry(item, now);
          if (entry) next[entry.id] = entry;
        }
      }
    } catch {
      // a damaged value is ignored, not thrown
    }
  }
  library = next;
  if (!readStorage(LEGACY_DONE_KEY)) {
    const parse = (key: string) => {
      try {
        return JSON.parse(readStorage(key) ?? "null") as unknown;
      } catch {
        return null;
      }
    };
    const legacy = migrateLegacy(parse("watched"), parse("queue"), now);
    if (legacy.length) {
      library = mergeEntries(
        library,
        legacy.filter((e) => !library[e.id]),
      );
      lastMigration = legacy.length;
      persist();
    }
    writeStorage(LEGACY_DONE_KEY, now);
  }
}

function persist() {
  writeStorage(STORAGE_KEY, JSON.stringify(Object.values(library)));
}

function commit(next: Library) {
  library = next;
  persist();
  for (const listener of listeners) listener();
}

load();

if (typeof window !== "undefined") {
  // another tab changed the library
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      load();
      for (const listener of listeners) listener();
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLibrary(): Library {
  return useSyncExternalStore(subscribe, () => library);
}

export function useLibraryEntry(id: number): LibraryEntry | undefined {
  return useSyncExternalStore(subscribe, () => library[id]);
}

export function takeMigrationCount(): number {
  const count = lastMigration;
  lastMigration = 0;
  return count;
}

type MovieLike = MovieSummary | MovieDetails;

function snapshot(
  movie: MovieLike,
): Pick<
  LibraryEntry,
  "title" | "posterPath" | "backdropPath" | "releaseDate" | "voteAverage" | "genreIds" | "runtime"
> {
  const details = movie as Partial<MovieDetails>;
  return {
    title: movie.title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    releaseDate: movie.release_date ?? "",
    voteAverage: movie.vote_average,
    genreIds: details.genres?.map((g) => g.id) ?? movie.genre_ids ?? [],
    runtime: details.runtime ?? null,
  };
}

export const libraryActions = {
  set(movie: MovieLike, status: LibraryStatus) {
    const now = new Date().toISOString();
    const current = library[movie.id];
    commit({
      ...library,
      [movie.id]: {
        ...(current ?? { rating: null, note: "", addedAt: now, id: movie.id }),
        ...snapshot(movie),
        id: movie.id,
        status,
        watchedAt: status === "watched" ? (current?.watchedAt ?? now) : null,
        addedAt: current?.addedAt ?? now,
        rating: current?.rating ?? null,
        note: current?.note ?? "",
      },
    });
  },
  update(id: number, patch: Partial<Pick<LibraryEntry, "rating" | "note" | "watchedAt">>) {
    const current = library[id];
    if (!current) return;
    commit({ ...library, [id]: { ...current, ...patch } });
  },
  // Fills in the title and poster of an entry that came from the old app (ids only).
  refresh(movie: MovieDetails) {
    const current = library[movie.id];
    if (!current) return;
    commit({ ...library, [movie.id]: { ...current, ...snapshot(movie) } });
  },
  remove(id: number): LibraryEntry | undefined {
    const current = library[id];
    if (!current) return undefined;
    const next = { ...library };
    delete next[id];
    commit(next);
    return current;
  },
  restore(entry: LibraryEntry) {
    commit({ ...library, [entry.id]: entry });
  },
  import(entries: LibraryEntry[]) {
    commit(mergeEntries(library, entries));
  },
};
