// The Frame mark: a lit amber still with an F cut out of it. This is the only copy of the drawing:
// the logo in the app renders it, and scripts/brand.mjs writes the favicon, the icons, the social image
// and the lockups from it, so the mark and the favicon cannot drift apart (src/brand/mark.test.ts).
// Node imports this file directly (type stripping), so it holds only plain data and functions.

export const MARK = {
  /** the drawing is on a 32 × 32 grid */
  size: 32,
  /** corner radius of the still */
  radius: 8,
  /** the still: --color-accent, oklch(0.82 0.145 76) */
  tile: "#f9b648",
  /** the cut-out F: --color-on-accent, oklch(0.18 0.02 60) */
  letter: "#180f09",
  /** the F: a 4.6-unit stem and two arms, centred a little right of the middle to sit optically */
  f: "M10 7h13v4.4h-8.4v3.4H21v4.3h-6.4V25H10z",
} as const;

/** The mark as a standalone SVG document (the favicon). `rounded: false` fills the square (Apple touch icon). */
export function markSvg({ rounded = true }: { rounded?: boolean } = {}): string {
  const { size, radius, tile, letter, f } = MARK;
  const rx = rounded ? ` rx="${radius}"` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}"${rx} fill="${tile}"/>` +
    `<path fill="${letter}" d="${f}"/>` +
    `</svg>`
  );
}
