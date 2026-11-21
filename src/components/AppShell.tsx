import { Link, useLocation, useRouter, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Compass, Dices, Home, Library, Moon, Search, Settings2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HAS_TMDB_KEY } from "../env";
import { useI18n } from "../i18n";
import { takeMigrationCount } from "../lib/library";
import { setTheme, useTheme, type ThemeChoice } from "../lib/theme";
import { Wordmark } from "./Logo";
import { SearchPalette, openSearch } from "./SearchPalette";
import { NoKey } from "./States";
import { Toaster, toast } from "./Toasts";

const NAV = [
  { to: "/{-$lang}/", key: "home", icon: Home, exact: true },
  { to: "/{-$lang}/discover/", key: "discover", icon: Compass, exact: false },
  { to: "/{-$lang}/tonight/", key: "tonight", icon: Dices, exact: false },
  { to: "/{-$lang}/library/", key: "library", icon: Library, exact: false },
] as const;

function useScrolled() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { sentinel, scrolled };
}

function SettingsMenu() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const options: Array<[ThemeChoice, string]> = [
    ["dark", t.settings.themeDark],
    ["light", t.settings.themeLight],
    ["system", t.settings.themeSystem],
  ];
  return (
    <>
      <button
        type="button"
        popoverTarget="settings-menu"
        className="btn btn-ghost btn-icon"
        aria-label={`${t.settings.theme}, ${t.settings.language}`}
      >
        <Settings2 className="size-5" aria-hidden="true" />
      </button>
      <div
        id="settings-menu"
        popover="auto"
        className="fixed inset-auto top-16 right-4 m-0 w-64 rounded-2xl border border-line bg-surface p-4 text-ink shadow-pop"
      >
        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
            <Moon className="size-4" aria-hidden="true" />
            {t.settings.theme}
          </legend>
          <div className="grid grid-cols-3 gap-1 rounded-full bg-raised p-1">
            {options.map(([value, label]) => (
              <label
                key={value}
                className="relative flex min-h-9 cursor-pointer items-center justify-center rounded-full text-sm font-medium has-checked:bg-surface has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-accent-text"
              >
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => setTheme(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-4 mb-2 text-sm font-semibold text-muted">{t.settings.language}</p>
        <LanguageLink className="btn btn-ghost w-full" />
        <p className="sr-only">{lang}</p>
      </div>
    </>
  );
}

function LanguageLink({ className }: { className?: string }) {
  const { t, lang } = useI18n();
  const target = lang === "en" ? "pl" : "en";
  const router = useRouter();
  const location = useLocation();
  // the same page in the other language: Polish has no prefix, English has /en/
  const rest = location.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const path = `${target === "en" ? `/en${rest}` : rest}${location.searchStr}`;
  const href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={t.settings.switchToLabel}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        void router.navigate({ href: path });
      }}
    >
      {t.settings.switchTo}
    </a>
  );
}

function Header() {
  const { t, langParam } = useI18n();
  const { sentinel, scrolled } = useScrolled();
  return (
    <>
      <div ref={sentinel} className="absolute top-0 h-px w-px" aria-hidden="true" />
      <header
        data-scrolled={scrolled}
        className="fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 data-[scrolled=false]:bg-linear-to-b data-[scrolled=false]:from-canvas/85 data-[scrolled=false]:to-transparent data-[scrolled=true]:border-b data-[scrolled=true]:border-line data-[scrolled=true]:bg-canvas/80 data-[scrolled=true]:backdrop-blur-xl"
      >
        <div className="container-page flex h-16 items-center gap-4">
          <Link
            to="/{-$lang}/"
            params={{ lang: langParam }}
            className="-ml-1 rounded-lg p-1"
            aria-label={`${t.brand}, ${t.nav.home}`}
          >
            <Wordmark />
          </Link>
          <nav aria-label={t.a11y.mainNav} className="ml-6 hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map(({ to, key, exact }) => (
                <li key={key}>
                  <Link
                    to={to}
                    params={{ lang: langParam }}
                    activeOptions={{ exact, includeSearch: false }}
                    className="relative rounded-full px-3.5 py-2 text-[0.95rem] font-medium text-muted transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3.5 aria-[current=page]:after:-bottom-0.5 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-accent"
                  >
                    {t.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openSearch}
              className="btn btn-ghost btn-icon sm:w-auto sm:min-w-56 sm:justify-start sm:px-4 sm:font-normal sm:text-muted"
              aria-keyshortcuts="Control+K"
            >
              <Search className="size-5 shrink-0" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t.search.label}</span>
              <kbd
                aria-hidden="true"
                className="ml-auto hidden rounded-md border border-line px-1.5 py-0.5 font-sans text-xs lg:inline"
              >
                {t.search.shortcut}
              </kbd>
            </button>
            <SettingsMenu />
          </div>
        </div>
      </header>
    </>
  );
}

function BottomNav() {
  const { t, langParam } = useI18n();
  return (
    <nav
      aria-label={t.a11y.tabNav}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV.map(({ to, key, icon: Icon, exact }) => (
          <li key={key}>
            <Link
              to={to}
              params={{ lang: langParam }}
              activeOptions={{ exact, includeSearch: false }}
              className="group flex min-h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-muted aria-[current=page]:text-ink"
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full transition-colors group-aria-[current=page]:bg-accent group-aria-[current=page]:text-on-accent">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {t.nav[key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer() {
  const { t, langParam } = useI18n();
  return (
    <footer className="mt-24 border-t border-line pb-28 md:pb-12">
      <div className="container-page flex flex-col gap-8 pt-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-4 text-sm text-muted">{t.about.dataText}</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <li>
            <Link
              to="/{-$lang}/about/"
              params={{ lang: langParam }}
              className="hover:text-accent-text"
            >
              {t.nav.about}
            </Link>
          </li>
          <li>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-accent-text"
            >
              <Clapperboard className="size-4" aria-hidden="true" />
              {t.footer.tmdb} <span className="sr-only">{t.a11y.newTab}</span>
            </a>
          </li>
          <li>
            <LanguageLink className="hover:text-accent-text" />
          </li>
        </ul>
      </div>
      <p className="container-page mt-8 text-xs text-muted">{t.footer.made}</p>
    </footer>
  );
}

function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-full bg-accent px-5 py-3 font-semibold text-on-accent focus-visible:translate-y-0"
    >
      {t.a11y.skip}
    </a>
  );
}

function useDocumentLanguage() {
  const { iso, t, lang } = useI18n();
  useEffect(() => {
    document.documentElement.lang = iso;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.meta.description);
  }, [iso, t]);
  useEffect(() => {
    const count = takeMigrationCount();
    if (count) toast(t.library.migrated(count));
  }, [t, lang]);
}

function OfflineBanner() {
  const { t } = useI18n();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return (
    <p role="status" className="container-page mt-20 rounded-xl bg-raised px-4 py-3 text-sm">
      {t.common.offline}
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  useDocumentLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // move focus to the page on navigation, so a screen reader starts at the new content
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      <SkipLink />
      <Header />
      <OfflineBanner />
      <main id="main" ref={main} tabIndex={-1} className="min-h-[70dvh] outline-none">
        {HAS_TMDB_KEY ? (
          children
        ) : (
          <div className="pt-24">
            <NoKey />
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
      <SearchPalette />
      <Toaster />
    </>
  );
}
