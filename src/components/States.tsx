import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useI18n } from "../i18n";
import { illustrations } from "./illustrations";

type Art = keyof typeof illustrations;

function Illustration({ art }: { art: Art }) {
  const Art = illustrations[art];
  return <Art className="h-28 w-auto text-muted" />;
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
