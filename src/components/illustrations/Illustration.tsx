import type { ReactNode } from "react";
import { paint } from "./paint";

export type IllustrationProps = { className?: string };

// The frame every empty-state illustration shares: a 160 × 120 stage with a soft shadow on the floor,
// round 2.5 strokes, decorative only (the heading next to it says what happened).
export function Illustration({
  className = "h-28 w-auto",
  children,
}: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={paint.line}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="80" cy="108" rx="54" ry="6" fill={paint.floor} stroke="none" />
      {children}
    </svg>
  );
}
