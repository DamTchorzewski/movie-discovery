import { LOCALES, type Lang } from "./messages";

// Formatters are created once per language (reops/standards/accessibility.md, Locale).
function build(lang: Lang) {
  const locale = LOCALES[lang].intl;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Warsaw" });
  const shortDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Warsaw",
  });
  const usd = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const number = new Intl.NumberFormat(locale);
  const rating = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const languages = new Intl.DisplayNames([locale], { type: "language" });
  const collator = new Intl.Collator(LOCALES[lang].iso, { numeric: true, sensitivity: "base" });

  const parse = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

  return {
    date: (iso: string | null | undefined) => (iso ? date.format(parse(iso)) : ""),
    shortDate: (iso: string | null | undefined) => (iso ? shortDate.format(parse(iso)) : ""),
    year: (iso: string | null | undefined) => (iso ? iso.slice(0, 4) : ""),
    usd: (n: number) => (n > 0 ? usd.format(n) : ""),
    number: (n: number) => number.format(n),
    rating: (n: number) => rating.format(n),
    language: (code: string) => {
      try {
        return languages.of(code) ?? code;
      } catch {
        return code;
      }
    },
    compare: collator.compare,
  };
}

export type Formatters = ReturnType<typeof build>;

export const formatters: Record<Lang, Formatters> = { pl: build("pl"), en: build("en") };
