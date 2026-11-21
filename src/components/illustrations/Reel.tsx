import { Illustration, type IllustrationProps } from "./Illustration";
import { paint } from "./paint";

const HOLES = [0, 72, 144, 216, 288].map((deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { cx: 58 + 18 * Math.cos(a), cy: 52 + 18 * Math.sin(a) };
});

// A reel that has run out: the film slips off and ends in one lit still on the floor (errors).
export function ReelIllustration(props: IllustrationProps) {
  const strip = "M76 76c14 14 30 10 42 18";
  return (
    <Illustration {...props}>
      <path d={strip} strokeWidth={17} />
      <path d={strip} strokeWidth={12} stroke={paint.paper} />
      <path d={strip} strokeWidth={2} stroke={paint.faint} strokeDasharray="3 5" />
      <circle cx="58" cy="52" r="32" fill={paint.paper} />
      {HOLES.map((h) => (
        <circle key={`${h.cx}-${h.cy}`} {...h} r="7.5" fill={paint.hole} />
      ))}
      <circle cx="58" cy="52" r="5" fill={paint.lit} stroke={paint.litEdge} strokeWidth={2} />
      <rect
        x="114"
        y="86"
        width="22"
        height="16"
        rx="3.5"
        fill={paint.lit}
        stroke={paint.litEdge}
        strokeWidth={2}
        transform="rotate(12 125 94)"
      />
    </Illustration>
  );
}
