# Decisions

Choices that a reader of the code might question, with the reason. Newest first.

## 2026-11-21: one name, Frame

The rebuild was first called **Kadr** (Polish for a film still), then Kadr in Polish and Frame in English. It is now
**Frame** in both languages: one name, one mark (an F cut out of a lit still) and one favicon, which a name per language
could not have. The brand is in [design.md](design.md). The keys in localStorage (`kadr.theme`, `kadr.library.v1`) and
the `"app": "kadr"` field of an exported library keep the old word on purpose: renaming them would lose the saved
library and reject earlier export files.

## 2026-11-21: a new repository and a new name

The rebuild is a new product, now **Frame**, in a new repository, `movie-discovery`. The team project
`tmdb-movie-browser` (Filmoteka) stays as the team left it; this repository carries its history. The library of the
first version is moved over on the first visit (the same origin, `damtchorzewski.github.io`, so the old `watched` and
`queue` keys in localStorage are readable).

## A single-page app, not Astro

Every film, person and collection of TMDB (about a million films) is a page, and the main screens depend on search and
filters. A static site generator would only prerender an empty shell. Vite + React with TanStack Router gives typed
routes, search parameters in the URL and code splitting per page; TanStack Query caches the API.

## The TMDB key in the browser

A static site has no server to hide a key, and TMDB cannot restrict a key to a domain. The key is a repository
**variable** (`VITE_TMDB_API_KEY`), never committed. If abuse ever becomes a problem, the next step is a small proxy (for
example a Cloudflare Worker) that keeps the key as a secret and caches responses.

## The library in localStorage

Watchlist, watched films, ratings, notes and dates are kept in the browser (`kadr.library.v1`), with export and import to a
JSON file. No account and no backend. Syncing between devices (Firebase Auth and Firestore, as in finance-tracker) can
be added later without changing the data shape (`src/lib/library-schema.ts`).

## A service worker for the app shell only

`reops/standards/performance.md` says client sites have no service worker. Frame is an installable app (PWA), so it has
one, kept minimal (`public/sw.js`): the HTML is **network first** (a release is never hidden behind a stale page; the
cached copy is used only offline) and the hashed build files are cache first. TMDB data and images are not cached by
it.

## Polish at `/`, English at `/en/`

`reops/standards/accessibility.md`, Locale. The route has an optional `{-$lang}` segment; every text lives in
`src/i18n/messages.ts`, and the English messages must have every key of the Polish ones (a missing one fails the
typecheck). TMDB data is requested in `pl-PL` or `en-US`; where to watch is always for Poland.

## Motion

Motion runs only with `prefers-reduced-motion: no-preference`: the hero advances by itself only then (with a pause
button), view transitions between pages only then, the Ken Burns and shimmer keyframes only then. With `reduce`, short
fades remain. Tested in `tests/e2e/reduced-motion.spec.ts`.
