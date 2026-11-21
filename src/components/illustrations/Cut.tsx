import { Illustration, type IllustrationProps } from "./Illustration";
import { paint } from "./paint";

// A piece of film with its perforations and two stills, one of them lit.
function Strip({ lit }: { lit: "left" | "right" }) {
  const holes = [6, 16, 26, 36, 46];
  return (
    <>
      <rect width="56" height="40" rx="3" fill={paint.paper} />
      {holes.map((x) => (
        <g key={x} fill={paint.faint} stroke="none">
          <rect x={x} y="4" width="4" height="4" rx="1" />
          <rect x={x} y="32" width="4" height="4" rx="1" />
        </g>
      ))}
      <rect x="5" y="12" width="21" height="16" rx="2" stroke={paint.faint} strokeWidth={2} />
      <rect x="30" y="12" width="21" height="16" rx="2" stroke={paint.faint} strokeWidth={2} />
      <rect
        x={lit === "left" ? 5 : 30}
        y="12"
        width="21"
        height="16"
        rx="2"
        fill={paint.lit}
        stroke={paint.litEdge}
        strokeWidth={2}
      />
    </>
  );
}

// Film cut in two, the splice missing (a page that is not there).
export function CutIllustration(props: IllustrationProps) {
  return (
    <Illustration {...props}>
      <g transform="translate(16 46) rotate(-7)">
        <Strip lit="right" />
      </g>
      <g transform="translate(90 40) rotate(9)">
        <Strip lit="left" />
      </g>
      <path d="M81 24v68" stroke={paint.litEdge} strokeWidth={2} strokeDasharray="4 6" />
    </Illustration>
  );
}
