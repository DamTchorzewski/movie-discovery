import { MARK } from "../brand/mark";
import { useI18n } from "../i18n";

// The Frame mark: a lit amber still with an F cut out of it. The drawing lives in src/brand/mark.ts,
// the same data public/favicon.svg and the app icons are generated from (scripts/brand.mjs).
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${MARK.size} ${MARK.size}`} className={className} aria-hidden="true">
      <rect width={MARK.size} height={MARK.size} rx={MARK.radius} fill={MARK.tile} />
      <path d={MARK.f} fill={MARK.letter} />
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
