// The only place that reads the build-time environment (reops/standards/env.md).
// VITE_TMDB_API_KEY ships to the browser on purpose: a static site has no server to hide it.
export const TMDB_API_KEY: string = import.meta.env.VITE_TMDB_API_KEY || "";
export const HAS_TMDB_KEY = TMDB_API_KEY.length > 0;
