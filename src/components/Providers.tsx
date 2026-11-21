import { ExternalLink, Tv } from "lucide-react";
import { useI18n } from "../i18n";
import { imageUrl } from "../lib/images";
import { REGION, type CountryProviders, type Provider } from "../lib/tmdb";

// Where to watch in Poland. TMDB's data comes from JustWatch, which must be credited.
export function Providers({ data }: { data: CountryProviders | undefined }) {
  const { t } = useI18n();
  const groups: Array<[string, Provider[] | undefined]> = [
    [t.movie.stream, data?.flatrate],
    [t.movie.free, [...(data?.free ?? []), ...(data?.ads ?? [])]],
    [t.movie.rent, data?.rent],
    [t.movie.buy, data?.buy],
  ];
  const present = groups.filter(([, list]) => list && list.length > 0);

  return (
    <section
      aria-labelledby="providers-heading"
      className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="providers-heading" className="flex items-center gap-2 text-xl font-semibold">
          <Tv className="size-5 text-accent-text" aria-hidden="true" />
          {t.movie.whereToWatch}
          <span className="rounded-md bg-raised px-1.5 py-0.5 font-sans text-xs font-semibold text-muted">
            {REGION}
          </span>
        </h2>
      </div>
      {present.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.movie.noProviders}</p>
      ) : (
        <dl className="mt-5 space-y-5">
          {present.map(([label, list]) => (
            <div key={label}>
              <dt className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</dt>
              <dd className="mt-2">
                <ul className="flex flex-wrap gap-2">
                  {list!.map((p) => (
                    <li key={p.provider_id}>
                      <img
                        src={imageUrl(p.logo_path, "w92")}
                        alt={p.provider_name}
                        title={p.provider_name}
                        width={44}
                        height={44}
                        loading="lazy"
                        className="size-11 rounded-xl ring-1 ring-line"
                      />
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
        <span>{t.movie.providersSource}</span>
        {data?.link && (
          <a
            href={data.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-6 items-center gap-1 font-semibold text-accent-text hover:underline"
          >
            {t.movie.allOffers}
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{t.a11y.newTab}</span>
          </a>
        )}
      </div>
    </section>
  );
}
