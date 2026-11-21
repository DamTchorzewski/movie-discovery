import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  notFound,
  lazyRouteComponent,
  Outlet,
} from "@tanstack/react-router";
import { AppShell } from "./components/AppShell";
import { ErrorState, MoviePending, NotFound } from "./components/States";
import { toLang } from "./i18n";
import { LOCALES } from "./i18n/messages";
import { parseDiscover, serializeDiscover } from "./lib/discover";
import { readId } from "./lib/ids";
import { collectionQuery, movieQuery, personQuery } from "./lib/queries";
import { TmdbError } from "./lib/tmdb";
import { HomePage } from "./pages/HomePage";

interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: () => (
    <AppShell>
      <NotFound />
    </AppShell>
  ),
});

// `{-$lang}` is optional: Polish at `/`, English at `/en/`. Anything else is a 404.
const langRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "{-$lang}",
  beforeLoad: ({ params }) => {
    if (params.lang !== undefined && params.lang !== "en") throw notFound();
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  errorComponent: ({ reset }) => (
    <AppShell>
      <ErrorState onRetry={reset} />
    </AppShell>
  ),
  notFoundComponent: () => <NotFound />,
});

const tmdbLanguage = (lang: string | undefined) => LOCALES[toLang(lang)].tmdb;

// A film or person TMDB does not know is a 404 page, not an error.
async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) throw notFound();
    throw error;
  }
}

function parseId(value: string): number {
  const id = readId(value);
  if (id === null) throw notFound();
  return id;
}

const homeRoute = createRoute({ getParentRoute: () => langRoute, path: "/", component: HomePage });

const discoverRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "discover",
  validateSearch: (search: Record<string, unknown>) => serializeDiscover(parseDiscover(search)),
  component: lazyRouteComponent(() => import("./pages/DiscoverPage"), "DiscoverPage"),
});

const searchRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "search",
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 100) : "",
  }),
  component: lazyRouteComponent(() => import("./pages/SearchPage"), "SearchPage"),
});

const libraryRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "library",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === "watched" ? ("watched" as const) : undefined,
  }),
  component: lazyRouteComponent(() => import("./pages/LibraryPage"), "LibraryPage"),
});

const tonightRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "tonight",
  component: lazyRouteComponent(() => import("./pages/TonightPage"), "TonightPage"),
});

const aboutRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "about",
  component: lazyRouteComponent(() => import("./pages/AboutPage"), "AboutPage"),
});

const movieRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "movie/$id",
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        movieQuery(parseId(params.id), tmdbLanguage(params.lang)),
      ),
    ),
  pendingComponent: MoviePending,
  component: lazyRouteComponent(() => import("./pages/MoviePage"), "MoviePage"),
});

const personRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "person/$id",
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        personQuery(parseId(params.id), tmdbLanguage(params.lang)),
      ),
    ),
  pendingComponent: MoviePending,
  component: lazyRouteComponent(() => import("./pages/PersonPage"), "PersonPage"),
});

const collectionRoute = createRoute({
  getParentRoute: () => langRoute,
  path: "collection/$id",
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        collectionQuery(parseId(params.id), tmdbLanguage(params.lang)),
      ),
    ),
  pendingComponent: MoviePending,
  component: lazyRouteComponent(() => import("./pages/CollectionPage"), "CollectionPage"),
});

const routeTree = rootRoute.addChildren([
  langRoute.addChildren([
    homeRoute,
    discoverRoute,
    searchRoute,
    libraryRoute,
    tonightRoute,
    aboutRoute,
    movieRoute,
    personRoute,
    collectionRoute,
  ]),
]);

export function makeRouter(queryClient: QueryClient) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return createRouter({
    routeTree,
    context: { queryClient },
    basepath: import.meta.env.BASE_URL,
    trailingSlash: "always",
    defaultPreload: "intent",
    // the data is cached by TanStack Query; the router only waits for it
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 300,
    defaultPendingMinMs: 300,
    scrollRestoration: true,
    defaultViewTransition: !reduceMotion && "startViewTransition" in document,
    // plain query strings (?genres=28,12&from=2000), not JSON values in the URL
    parseSearch: (text) => Object.fromEntries(new URLSearchParams(text)),
    stringifySearch: (search) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(search)) {
        if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
      }
      const text = params.toString();
      return text ? `?${text}` : "";
    },
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof makeRouter>;
  }
}
