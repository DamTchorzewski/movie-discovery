import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { PosterCard } from "../components/PosterCard";
import { Rail } from "../components/Rail";
import { useI18n } from "../i18n";
import { pathId, readId } from "../lib/ids";
import { imageUrl, profileSrcSet } from "../lib/images";
import { personQuery } from "../lib/queries";
import type { PersonCredit } from "../lib/tmdb";
import { usePageTitle } from "../lib/use-title";

const route = getRouteApi("/{-$lang}/person/$id");

type Tab = "acting" | "directing" | "other";

function ageAt(birthday: string, end: string | null): number {
  const from = new Date(birthday);
  const to = end ? new Date(end) : new Date();
  let age = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) age--;
  return age;
}

function unique(credits: PersonCredit[]): PersonCredit[] {
  const seen = new Map<number, PersonCredit>();
  for (const c of credits) {
    const prev = seen.get(c.id);
    if (prev) {
      if (c.job && prev.job && !prev.job.includes(c.job)) prev.job = `${prev.job}, ${c.job}`;
    } else seen.set(c.id, { ...c });
  }
  return [...seen.values()];
}

export function PersonPage() {
  const { id } = route.useParams();
  const { t, fmt, tmdbLang, langParam } = useI18n();
  const { data: person } = useSuspenseQuery(personQuery(readId(id) ?? 0, tmdbLang));
  usePageTitle(person.name);
  const [expanded, setExpanded] = useState(false);
  const bioId = useId();

  const credits = useMemo(() => {
    const cast = unique(person.movie_credits.cast);
    const crew = unique(person.movie_credits.crew);
    return {
      acting: cast,
      directing: crew.filter((c) => c.job === "Director"),
      other: crew.filter((c) => c.job !== "Director"),
    };
  }, [person]);

  const defaultTab: Tab =
    person.known_for_department === "Directing" && credits.directing.length
      ? "directing"
      : credits.acting.length
        ? "acting"
        : credits.directing.length
          ? "directing"
          : "other";
  const [tab, setTab] = useState<Tab>(defaultTab);

  const knownFor = useMemo(
    () =>
      [...(defaultTab === "acting" ? credits.acting : [...credits.directing, ...credits.other])]
        .filter((c) => c.poster_path && c.vote_count > 50)
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 12),
    [credits, defaultTab],
  );

  const list = credits[tab]
    .slice()
    .sort((a, b) => (b.release_date || "9999").localeCompare(a.release_date || "9999"));

  const tabs: Array<[Tab, string]> = [
    ["acting", t.person.acting],
    ["directing", t.person.directing],
    ["other", t.person.otherCrew],
  ];
  const bio = person.biography || t.person.noBiography;
  const long = bio.length > 700;

  return (
    <article className="pt-24 sm:pt-28">
      <div className="container-page grid gap-8 md:grid-cols-[minmax(0,16rem)_1fr] lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
        <div className="w-44 self-start sm:w-56 md:w-full">
          <div className="overflow-hidden rounded-2xl bg-raised shadow-pop ring-1 ring-line">
            {person.profile_path ? (
              <img
                src={imageUrl(person.profile_path, "h632")}
                srcSet={profileSrcSet(person.profile_path)}
                sizes="(min-width: 1024px) 20rem, 16rem"
                alt={person.name}
                width={421}
                height={632}
                fetchPriority="high"
                className="aspect-[2/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center text-muted">
                <User className="size-12" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
        <div className="rise min-w-0">
          <p className="eyebrow">{person.known_for_department}</p>
          <h1 className="mt-2 text-[clamp(2.25rem,6vw,4.25rem)] leading-[0.98] font-semibold">
            {person.name}
          </h1>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            {person.birthday && (
              <div>
                <dt className="text-muted">{t.person.born}</dt>
                <dd className="mt-1 font-medium">
                  {fmt.date(person.birthday)}
                  {!person.deathday && ` (${t.person.age(ageAt(person.birthday, null))})`}
                </dd>
              </div>
            )}
            {person.deathday && (
              <div>
                <dt className="text-muted">{t.person.died}</dt>
                <dd className="mt-1 font-medium">
                  {fmt.date(person.deathday)}
                  {person.birthday && ` (${t.person.age(ageAt(person.birthday, person.deathday))})`}
                </dd>
              </div>
            )}
            {person.place_of_birth && (
              <div>
                <dt className="text-muted">{t.person.birthplace}</dt>
                <dd className="mt-1 font-medium">{person.place_of_birth}</dd>
              </div>
            )}
          </dl>
          <section aria-labelledby="bio-heading" className="mt-8 max-w-3xl">
            <h2 id="bio-heading" className="text-xl font-semibold">
              {t.person.biography}
            </h2>
            <div
              id={bioId}
              className={`relative mt-3 space-y-4 leading-relaxed whitespace-pre-line ${long && !expanded ? "max-h-64 overflow-hidden" : ""}`}
            >
              <p>{bio}</p>
              {long && !expanded && (
                <div
                  className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-canvas"
                  aria-hidden="true"
                />
              )}
            </div>
            {long && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={bioId}
                onClick={() => setExpanded((e) => !e)}
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent-text hover:underline"
              >
                {expanded ? t.person.showLess : t.person.showMore}
              </button>
            )}
          </section>
        </div>
      </div>

      {knownFor.length > 0 && (
        <Rail title={t.person.knownFor}>
          {knownFor.map((m) => (
            <PosterCard key={m.id} movie={m} subtitle={m.character || m.job || undefined} />
          ))}
        </Rail>
      )}

      <section aria-labelledby="filmography-heading" className="container-page mt-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="filmography-heading" className="text-2xl font-semibold sm:text-[1.75rem]">
            {t.person.filmography}
          </h2>
          <div
            className="flex rounded-full bg-raised p-1"
            role="group"
            aria-label={t.person.filmography}
          >
            {tabs
              .filter(([key]) => credits[key].length)
              .map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={tab === key}
                  onClick={() => setTab(key)}
                  className="min-h-9 rounded-full px-4 text-sm font-medium text-muted aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
                >
                  {label} <span className="text-muted">{credits[key].length}</span>
                </button>
              ))}
          </div>
        </div>
        <ol className="mt-6 divide-y divide-line rounded-3xl border border-line bg-surface">
          {list.map((c) => (
            <li key={c.credit_id}>
              <Link
                to="/{-$lang}/movie/$id/"
                params={{ lang: langParam, id: pathId(c.id, c.title) }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-raised sm:px-6"
              >
                <span className="w-12 shrink-0 font-display text-lg text-muted tabular-nums">
                  {fmt.year(c.release_date) || "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.title}</span>
                  {(c.character || c.job) && (
                    <span className="block truncate text-sm text-muted">
                      {c.character ? t.movie.as(c.character) : c.job}
                    </span>
                  )}
                </span>
                {c.vote_average > 0 && c.vote_count > 10 && (
                  <span className="shrink-0 text-sm text-muted tabular-nums">
                    ★ {fmt.rating(c.vote_average)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
