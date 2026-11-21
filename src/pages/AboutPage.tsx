import { ExternalLink } from "lucide-react";
import { useI18n } from "../i18n";
import { usePageTitle } from "../lib/use-title";
import beniamin from "../assets/team/BeniaminB.jpg";
import dagmara from "../assets/team/DagmaraS.jpg";
import damian from "../assets/team/DamianT.jpg";
import dawid from "../assets/team/DawidD.jpg";
import dorota from "../assets/team/DorotaD.jpg";
import edyta from "../assets/team/EdytaS.jpg";
import filipG from "../assets/team/FilipG.jpg";
import filipV from "../assets/team/FilipV.jpg";
import filipZ from "../assets/team/FilipZ.jpg";

// The people who built the first version (Filmoteka), with the roles the team wrote down (README, Team).
const TEAM = [
  { name: "Damian Tchorzewski", github: "damiantchorzewski", photo: damian, role: "Team Lead" },
  { name: "Beniamin Brzeziński", github: "benbrzezinski", photo: beniamin, role: "Scrum Master" },
  { name: "Dorota Dudzik", github: "doradudzik", photo: dorota, role: "Developer" },
  { name: "Edyta Sowa", github: "EdytaSowa", photo: edyta, role: "Developer" },
  { name: "Filip Vukić", github: "FVuk", photo: filipV, role: "Developer" },
  { name: "Dagmara Sobczyk", github: "DagmaraSobczak", photo: dagmara, role: "Developer" },
  { name: "Dawid Demkowicz", github: "Ddemkowicz", photo: dawid, role: "Developer" },
  { name: "Filip Zieliński", github: "Thebrefff", photo: filipZ, role: "Developer" },
  { name: "Filip Grzelak", github: "FilipGk", photo: filipG, role: "Developer" },
];

export function AboutPage() {
  const { t } = useI18n();
  usePageTitle(t.about.title);
  return (
    <div className="container-page pt-24 sm:pt-28">
      <header className="max-w-3xl">
        <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-semibold">
          {t.about.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">{t.about.lead}</p>
      </header>

      <section aria-labelledby="team-heading" className="mt-14">
        <h2 id="team-heading" className="text-2xl font-semibold sm:text-[1.75rem]">
          {t.about.team}
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TEAM.map((person) => (
            <li key={person.github}>
              <a
                href={`https://github.com/${person.github}`}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-2xl border border-line bg-surface p-3 hover:bg-raised"
              >
                <img
                  src={person.photo}
                  alt=""
                  width={240}
                  height={240}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover grayscale transition duration-500 group-hover:grayscale-0"
                />
                <p className="mt-3 font-semibold">{person.name}</p>
                <p className="text-sm text-muted">
                  {person.role}
                  <span className="sr-only"> · GitHub {t.a11y.newTab}</span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">{t.about.data}</h2>
          <p className="mt-3 text-muted">{t.about.dataText}</p>
        </section>
        <section className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">{t.about.privacy}</h2>
          <p className="mt-3 text-muted">{t.about.privacyText}</p>
        </section>
      </div>

      <a
        href="https://github.com/DamTchorzewski/movie-discovery"
        target="_blank"
        rel="noreferrer"
        className="btn btn-ghost mt-10"
      >
        {t.about.source}
        <ExternalLink className="size-4" aria-hidden="true" />
        <span className="sr-only">{t.a11y.newTab}</span>
      </a>
    </div>
  );
}
