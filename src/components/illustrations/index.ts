// Line illustrations for the empty states, one per situation. Decorative (aria-hidden); colours from
// the CSS tokens, so they work in both themes. Size them with className (default "h-28 w-auto").
import { CutIllustration } from "./Cut";
import { KeyIllustration } from "./Key";
import { ReelIllustration } from "./Reel";
import { SearchIllustration } from "./Search";
import { TicketIllustration } from "./Ticket";

export {
  CutIllustration,
  KeyIllustration,
  ReelIllustration,
  SearchIllustration,
  TicketIllustration,
};
export type { IllustrationProps } from "./Illustration";

/** by the `art` names States.tsx uses: reel (error), ticket (empty list), search, cut (not found), key */
export const illustrations = {
  reel: ReelIllustration,
  ticket: TicketIllustration,
  search: SearchIllustration,
  cut: CutIllustration,
  key: KeyIllustration,
} as const;
