import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useI18n } from "../i18n";

// Line illustrations for the empty states: placeholders until the design chat delivers the set.
type Art = "reel" | "ticket" | "search" | "cut" | "key";

function Illustration({ art }: { art: Art }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-auto text-muted" aria-hidden="true">
      <ellipse cx="80" cy="108" rx="54" ry="6" fill="var(--color-raised)" />
      {art === "reel" && (
        <g {...common}>
          <circle cx="62" cy="58" r="34" />
          <circle cx="62" cy="58" r="6" stroke="var(--color-accent)" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              key={a}
              cx={62 + 19 * Math.cos((a * Math.PI) / 180)}
              cy={58 + 19 * Math.sin((a * Math.PI) / 180)}
              r="7"
            />
          ))}
          <path d="M96 62c14 4 26 14 34 30" stroke="var(--color-accent)" />
        </g>
      )}
      {art === "ticket" && (
        <g {...common}>
          <path d="M34 36h92v14a10 10 0 0 0 0 20v14H34V70a10 10 0 0 0 0-20Z" />
          <path d="M100 38v44" strokeDasharray="4 5" />
          <path d="M50 54h34M50 66h22" stroke="var(--color-accent)" />
        </g>
      )}
      {art === "search" && (
        <g {...common}>
          <circle cx="70" cy="54" r="28" />
          <path d="m91 75 22 22" strokeWidth="5" />
          <path d="M58 48a14 14 0 0 1 14-8" stroke="var(--color-accent)" />
        </g>
      )}
      {art === "cut" && (
        <g {...common}>
          <rect x="30" y="30" width="100" height="56" rx="6" />
          <path d="M30 42h100M30 74h100" />
          <path d="m62 30 10 56M88 30 98 86" stroke="var(--color-accent)" strokeDasharray="5 5" />
        </g>
      )}
      {art === "key" && (
        <g {...common}>
          <circle cx="58" cy="58" r="20" />
          <circle cx="58" cy="58" r="6" stroke="var(--color-accent)" />
          <path d="M78 58h50M112 58v14M124 58v10" />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({
  art,
  title,
  text,
  children,
  headingLevel = 2,
}: {
  art: Art;
  title: string;
  text?: string;
  children?: ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="fade-in mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <Illustration art={art} />
      <Heading className="mt-6 text-2xl font-semibold sm:text-3xl">{title}</Heading>
      {text && <p className="mt-3 text-muted">{text}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function NotFound({ text }: { text?: string }) {
  const { t, langParam } = useI18n();
  return (
    <EmptyState
      art="cut"
      title={t.common.notFoundTitle}
      text={text ?? t.common.notFoundText}
      headingLevel={1}
    >
      <Link to="/{-$lang}/" params={{ lang: langParam }} className="btn btn-primary">
        {t.common.backHome}
      </Link>
    </EmptyState>
  );
}

export function ErrorState({
  onRetry,
  headingLevel = 1,
}: {
  onRetry?: () => void;
  headingLevel?: 1 | 2;
}) {
  const { t } = useI18n();
  return (
    <div role="alert">
      <EmptyState
        art="reel"
        title={t.common.error}
        text={t.common.errorText}
        headingLevel={headingLevel}
      >
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            {t.common.retry}
          </button>
        )}
      </EmptyState>
    </div>
  );
}

export function NoKey() {
  const { t } = useI18n();
  return (
    <EmptyState art="key" title={t.common.noKeyTitle} text={t.common.noKeyText} headingLevel={1} />
  );
}

export function MoviePending() {
  const { t } = useI18n();
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        {t.a11y.loading}
      </p>
      <div className="skeleton h-[46vh] min-h-72 sm:h-[62vh]" />
      <div className="container-page -mt-40 grid gap-8 sm:-mt-56 md:grid-cols-[15rem_1fr]">
        <div className="skeleton aspect-[2/3] w-40 rounded-2xl sm:w-52 md:w-full" />
        <div className="md:pt-24">
          <div className="skeleton h-14 w-3/4 rounded-xl" />
          <div className="skeleton mt-5 h-4 w-1/2 rounded" />
          <div className="skeleton mt-8 h-4 w-full rounded" />
          <div className="skeleton mt-2 h-4 w-5/6 rounded" />
        </div>
      </div>
    </div>
  );
}
