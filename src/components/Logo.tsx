// Temporary Kadr mark: the same drawing as public/favicon.svg (a frame with the letter K), so the
// header and the browser tab match. The brand session replaces both (docs/design.md).
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#141117" />
      <path
        d="M7 10V7h3M22 7h3v3M25 22v3h-3M10 25H7v-3"
        fill="none"
        stroke="#f2b84b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 10.5v11M12.5 16.4l6-5.9M14.6 14.3l4.4 7.2"
        fill="none"
        stroke="#f6f1e9"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.4rem] leading-none font-semibold tracking-tight">
        Kadr
      </span>
    </span>
  );
}
