import { Illustration, type IllustrationProps } from "./Illustration";
import { paint } from "./paint";

const TICKET = "M34 46h92v14a8 8 0 0 0 0 16v14H34V76a8 8 0 0 0 0-16Z";

// Two cinema tickets, nothing written on them yet; the stub is a lit still (an empty list).
export function TicketIllustration(props: IllustrationProps) {
  return (
    <Illustration {...props}>
      <path d={TICKET} fill={paint.paper} transform="rotate(-9 80 68) translate(2 -14)" />
      <path d={TICKET} fill={paint.paper} />
      <path d="M102 50v36" stroke={paint.faint} strokeDasharray="3 5" />
      <path d="M48 60h36M48 70h24M48 80h14" stroke={paint.faint} />
      <rect
        x="108"
        y="59"
        width="11"
        height="18"
        rx="2.5"
        fill={paint.lit}
        stroke={paint.litEdge}
        strokeWidth={2}
      />
    </Illustration>
  );
}
