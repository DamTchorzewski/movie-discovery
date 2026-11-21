import { useI18n } from "../i18n";

// Temporary mark: the corners of a film frame around a lit still, the same drawing as public/favicon.svg,
// with no letter so it fits both names (Kadr in Polish, Frame in English). The brand work replaces it.
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#141117" />
      <path
        d="M7 11V7h4M21 7h4v4M25 21v4h-4M11 25H7v-4"
        fill="none"
        stroke="#f6f1e9"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="11.5" y="12.5" width="9" height="7" rx="1.5" fill="#f2b84b" />
    </svg>
  );
}

export function Wordmark() {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.4rem] leading-none font-semibold tracking-tight">
        {t.brand}
      </span>
    </span>
  );
}
