// The shape of the personal library and the pure functions over it (validated import, legacy
// migration, stats). No storage and no React here, so it is unit-tested directly.

export type LibraryStatus = "watchlist" | "watched";

export interface LibraryEntry {
  id: number;
  status: LibraryStatus;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  genreIds: number[];
  runtime: number | null;
  addedAt: string;
  watchedAt: string | null;
  rating: number | null;
  note: string;
}

export interface LibraryFile {
  app: "kadr";
  version: 1;
  exportedAt: string;
  entries: LibraryEntry[];
}

export type Library = Record<number, LibraryEntry>;

export const NOTE_MAX = 2000;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const isoOrNull = (v: unknown) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null;

// Accepts one entry from a file or from storage; returns null when it cannot be trusted.
export function parseEntry(value: unknown, now: string): LibraryEntry | null {
  if (!isObject(value)) return null;
  const id = value.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) return null;
  const status = value.status === "watched" ? "watched" : "watchlist";
  const rating = value.rating;
  return {
    id,
    status,
    title: str(value.title).slice(0, 300),
    posterPath: typeof value.posterPath === "string" ? value.posterPath : null,
    backdropPath: typeof value.backdropPath === "string" ? value.backdropPath : null,
    releaseDate: str(value.releaseDate).slice(0, 10),
    voteAverage: num(value.voteAverage, 0),
    genreIds: Array.isArray(value.genreIds)
      ? value.genreIds.filter((g): g is number => Number.isInteger(g))
      : [],
    runtime: typeof value.runtime === "number" && value.runtime > 0 ? value.runtime : null,
    addedAt: isoOrNull(value.addedAt) ?? now,
    watchedAt: status === "watched" ? (isoOrNull(value.watchedAt) ?? now) : null,
    rating:
      typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 10
        ? rating
        : null,
    note: str(value.note).slice(0, NOTE_MAX),
  };
}

export function parseLibraryFile(text: string, now: string): LibraryEntry[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(data) || data.app !== "kadr" || !Array.isArray(data.entries)) return null;
  return data.entries.map((e) => parseEntry(e, now)).filter((e): e is LibraryEntry => e !== null);
}

export function toLibraryFile(library: Library, now: string): LibraryFile {
  return { app: "kadr", version: 1, exportedAt: now, entries: Object.values(library) };
}

// The first version of the app (Filmoteka, tmdb-movie-browser) kept two arrays of movie ids under "watched" and "queue".
export function migrateLegacy(watched: unknown, queue: unknown, now: string): LibraryEntry[] {
  const ids = (v: unknown) =>
    Array.isArray(v)
      ? v
          .map((x) => (typeof x === "string" ? Number(x) : x))
          .filter((x): x is number => Number.isInteger(x) && x > 0)
      : [];
  const result = new Map<number, LibraryEntry>();
  const blank = (id: number, status: LibraryStatus): LibraryEntry => ({
    id,
    status,
    title: "",
    posterPath: null,
    backdropPath: null,
    releaseDate: "",
    voteAverage: 0,
    genreIds: [],
    runtime: null,
    addedAt: now,
    watchedAt: status === "watched" ? now : null,
    rating: null,
    note: "",
  });
  for (const id of ids(queue)) result.set(id, blank(id, "watchlist"));
  for (const id of ids(watched)) result.set(id, blank(id, "watched"));
  return [...result.values()];
}

export function mergeEntries(library: Library, entries: LibraryEntry[]): Library {
  const next = { ...library };
  for (const entry of entries) {
    const current = next[entry.id];
    // an imported entry wins, but keeps a known title and poster when the file had none
    next[entry.id] = current
      ? {
          ...current,
          ...entry,
          title: entry.title || current.title,
          posterPath: entry.posterPath ?? current.posterPath,
        }
      : entry;
  }
  return next;
}

export interface LibraryStats {
  watched: number;
  minutes: number;
  averageRating: number | null;
  topGenreId: number | null;
}

export function libraryStats(entries: LibraryEntry[]): LibraryStats {
  const watched = entries.filter((e) => e.status === "watched");
  const rated = watched.filter((e) => e.rating !== null);
  const genres = new Map<number, number>();
  for (const e of watched) for (const g of e.genreIds) genres.set(g, (genres.get(g) ?? 0) + 1);
  let topGenreId: number | null = null;
  let best = 0;
  for (const [id, count] of genres) {
    if (count > best) {
      best = count;
      topGenreId = id;
    }
  }
  return {
    watched: watched.length,
    minutes: watched.reduce((sum, e) => sum + (e.runtime ?? 0), 0),
    averageRating: rated.length
      ? rated.reduce((sum, e) => sum + (e.rating ?? 0), 0) / rated.length
      : null,
    topGenreId,
  };
}
