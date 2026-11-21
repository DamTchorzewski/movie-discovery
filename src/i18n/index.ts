import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { formatters } from "./format";
import { LOCALES, messages, type Lang } from "./messages";

export type { Lang } from "./messages";

// Polish lives at `/`, English under `/en/` (reops/standards/accessibility.md, Locale).
export function toLang(value: unknown): Lang {
  return value === "en" ? "en" : "pl";
}

export function useLang(): Lang {
  const params = useParams({ strict: false }) as { lang?: string };
  return toLang(params.lang);
}

export function useI18n() {
  const lang = useLang();
  return useMemo(
    () => ({
      lang,
      t: messages[lang],
      fmt: formatters[lang],
      tmdbLang: LOCALES[lang].tmdb,
      iso: LOCALES[lang].iso,
      // the optional `{-$lang}` route parameter: undefined for Polish
      langParam: lang === "en" ? ("en" as const) : undefined,
    }),
    [lang],
  );
}
