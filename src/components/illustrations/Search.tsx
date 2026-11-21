import { Illustration, type IllustrationProps } from "./Illustration";
import { paint } from "./paint";

// A lens over a contact sheet of empty stills; only a glint of light in the glass (no results yet).
export function SearchIllustration(props: IllustrationProps) {
  return (
    <Illustration {...props}>
      <rect x="22" y="26" width="84" height="62" rx="8" fill={paint.paper} />
      <path d="M50 26v62M78 26v62M22 57h84" stroke={paint.faint} />
      <path d="m114 82 16 16" strokeWidth={7} />
      <circle cx="98" cy="66" r="22" fill={paint.hole} strokeWidth={3} />
      <path d="M86 58a14 14 0 0 1 12-6" stroke={paint.lit} strokeWidth={3} />
      <circle cx="104" cy="74" r="2" fill={paint.lit} stroke="none" />
    </Illustration>
  );
}
