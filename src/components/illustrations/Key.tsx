import { Illustration, type IllustrationProps } from "./Illustration";
import { paint } from "./paint";

// A key whose bow is the mark's still, lit (the app is missing its API key).
export function KeyIllustration(props: IllustrationProps) {
  return (
    <Illustration {...props}>
      <path d="M62 54h68a3 3 0 0 1 3 3v4H120v10h-8V61h-6v8h-8v-8H62Z" fill={paint.paper} />
      <rect x="24" y="38" width="40" height="40" rx="10" fill={paint.paper} />
      <rect
        x="34"
        y="48"
        width="20"
        height="20"
        rx="4"
        fill={paint.lit}
        stroke={paint.litEdge}
        strokeWidth={2}
      />
    </Illustration>
  );
}
