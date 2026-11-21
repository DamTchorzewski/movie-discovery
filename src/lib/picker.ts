// "What to watch tonight": the mood → genre map, the filter over candidates and the draw.
// The random source is injected, so the tests are repeatable.

export const MOODS = ["laugh", "thrill", "cry", "think", "escape", "fear"] as const;
export type Mood = (typeof MOODS)[number];

// TMDB movie genre ids: 35 comedy, 53 thriller, 80 crime, 9648 mystery, 18 drama, 10749 romance,
// 99 documentary, 36 history, 878 science fiction, 14 fantasy, 12 adventure, 16 animation, 27 horror.
export const MOOD_GENRES: Record<Mood, number[]> = {
  laugh: [35],
  thrill: [53, 80, 9648],
  cry: [18, 10749],
  think: [99, 36, 18],
  escape: [878, 14, 12, 16],
  fear: [27],
};

export const TIMES = ["any", "100", "130"] as const;
export type TimeLimit = (typeof TIMES)[number];

export interface Candidate {
  id: number;
  genreIds: number[];
  runtime: number | null;
  voteAverage: number;
}

export interface PickerOptions {
  mood: Mood | "any";
  time: TimeLimit;
  minRating: number;
}

export function matches(candidate: Candidate, options: PickerOptions): boolean {
  if (options.mood !== "any") {
    const wanted = MOOD_GENRES[options.mood];
    if (!candidate.genreIds.some((g) => wanted.includes(g))) return false;
  }
  if (options.time !== "any" && candidate.runtime !== null) {
    if (candidate.runtime > Number(options.time)) return false;
  }
  // a film from the watchlist without a known rating is not excluded
  if (candidate.voteAverage > 0 && candidate.voteAverage < options.minRating) return false;
  return true;
}

// Draws one candidate, never the one just shown when there is another.
export function draw<T extends { id: number }>(
  candidates: T[],
  previousId: number | undefined,
  random: () => number = Math.random,
): T | undefined {
  const pool =
    candidates.length > 1 ? candidates.filter((c) => c.id !== previousId) : [...candidates];
  if (!pool.length) return undefined;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
