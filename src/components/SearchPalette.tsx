import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Film, Search, User, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useI18n } from "../i18n";
import { useLightDismiss } from "../lib/use-light-dismiss";
import { pathId } from "../lib/ids";
import { imageUrl } from "../lib/images";
import { multiSearchQuery } from "../lib/queries";
import { isMovie, isPerson } from "../lib/tmdb";
import { useDebounced } from "../lib/use-debounced";

const OPEN_EVENT = "kadr:search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

interface Option {
  id: string;
  kind: "movie" | "person" | "all";
  label: string;
  detail: string;
  image?: string;
  go: () => void;
}

export function SearchPalette() {
  const { t, tmdbLang, langParam, fmt } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  useLightDismiss(dialog);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState({ query: "", index: 0 });
  const debounced = useDebounced(query.trim(), 250);
  const navigate = useNavigate();
  const listId = useId();
  const { data, isFetching } = useQuery(multiSearchQuery(debounced, tmdbLang));

  useEffect(() => {
    const open = () => {
      if (dialog.current?.open) return;
      dialog.current?.showModal();
      input.current?.select();
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable]");
      if (
        (event.key === "k" && (event.ctrlKey || event.metaKey)) ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener(OPEN_EVENT, open);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const close = () => dialog.current?.close();

  const options = useMemo<Option[]>(() => {
    const results = data?.results ?? [];
    const movies = results.filter(isMovie).slice(0, 6);
    const people = results.filter(isPerson).slice(0, 3);
    const list: Option[] = [
      ...movies.map((m) => ({
        id: `m${m.id}`,
        kind: "movie" as const,
        label: m.title,
        detail: [fmt.year(m.release_date), m.vote_average ? `★ ${fmt.rating(m.vote_average)}` : ""]
          .filter(Boolean)
          .join(" · "),
        image: imageUrl(m.poster_path, "w92"),
        go: () =>
          navigate({
            to: "/{-$lang}/movie/$id/",
            params: { lang: langParam, id: pathId(m.id, m.title) },
          }),
      })),
      ...people.map((p) => ({
        id: `p${p.id}`,
        kind: "person" as const,
        label: p.name,
        detail:
          p.known_for
            ?.map((k) => k.title ?? k.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(", ") ?? "",
        image: imageUrl(p.profile_path, "w92"),
        go: () =>
          navigate({
            to: "/{-$lang}/person/$id/",
            params: { lang: langParam, id: pathId(p.id, p.name) },
          }),
      })),
    ];
    if (debounced.length >= 2) {
      list.push({
        id: "all",
        kind: "all",
        label: t.search.seeAll(debounced),
        detail: "",
        go: () =>
          navigate({
            to: "/{-$lang}/search/",
            params: { lang: langParam },
            search: { q: debounced },
          }),
      });
    }
    return list;
  }, [data, debounced, fmt, langParam, navigate, t]);

  // the highlighted option starts at the top for every new query
  const active = cursor.query === debounced ? cursor.index : 0;
  const setActive = (update: (i: number) => number) =>
    setCursor({ query: debounced, index: update(active) });

  const choose = (option: Option | undefined) => {
    if (!option) return;
    close();
    option.go();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (options.length) choose(options[active]);
      else if (query.trim())
        choose({
          id: "q",
          kind: "all",
          label: "",
          detail: "",
          go: () =>
            navigate({
              to: "/{-$lang}/search/",
              params: { lang: langParam },
              search: { q: query.trim() },
            }),
        });
    }
  };

  const activeId = options[active] ? `${listId}-${options[active].id}` : undefined;
  const showEmpty = debounced.length >= 2 && !isFetching && data && options.length <= 1;

  return (
    <dialog
      ref={dialog}
      aria-label={t.search.label}
      className="fixed inset-x-0 top-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-scrim/70 sm:top-[12vh] sm:mx-auto sm:h-auto sm:max-w-2xl sm:px-4"
    >
      <div className="flex h-full flex-col overflow-hidden bg-surface shadow-pop sm:h-auto sm:max-h-[70vh] sm:rounded-3xl sm:border sm:border-line">
        <div className="flex items-center gap-3 border-b border-line px-4 sm:px-5">
          <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label={t.search.label}
            placeholder={t.search.placeholder}
            autoComplete="off"
            enterKeyHint="search"
            className="h-16 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={close}
            className="btn btn-icon -mr-2 text-muted"
            aria-label={t.a11y.close}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-2">
          <ul id={listId} role="listbox" aria-label={t.search.label}>
            {options.map((option, index) => (
              // the keyboard drives the combobox input (arrows, Enter); a click is the pointer path
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={option.id}
                id={`${listId}-${option.id}`}
                role="option"
                aria-selected={index === active}
                onClick={() => choose(option)}
                onMouseMove={() => setActive(() => index)}
                className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 aria-selected:bg-raised"
              >
                {option.kind === "all" ? (
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-on-accent">
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </span>
                ) : option.image ? (
                  <img
                    src={option.image}
                    alt=""
                    width={40}
                    height={option.kind === "movie" ? 60 : 40}
                    className={`${option.kind === "movie" ? "h-15 rounded-md" : "size-10 rounded-full"} w-10 bg-raised object-cover`}
                  />
                ) : (
                  <span
                    className={`flex w-10 items-center justify-center bg-raised text-muted ${option.kind === "movie" ? "h-15 rounded-md" : "size-10 rounded-full"}`}
                  >
                    {option.kind === "movie" ? (
                      <Film className="size-4" aria-hidden="true" />
                    ) : (
                      <User className="size-4" aria-hidden="true" />
                    )}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.label}</span>
                  {option.detail && (
                    <span className="block truncate text-sm text-muted">
                      <span className="sr-only">
                        {option.kind === "movie" ? t.search.movies : t.search.people}:{" "}
                      </span>
                      {option.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p aria-live="polite" className="px-3 py-6 text-center text-sm text-muted empty:hidden">
            {debounced.length < 2 ? t.search.hint : showEmpty ? t.search.empty : ""}
          </p>
        </div>
      </div>
    </dialog>
  );
}
