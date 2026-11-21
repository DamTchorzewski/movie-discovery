# Design and brand

The brand of Frame: the name, the mark, the colours, the type and how to use them. Tokens live in
`src/styles/app.css`; the mark in `src/brand/mark.ts`. Overview: [README](../README.md).

## Name

**Frame**, in every language. A frame is one still of a film and the edge of what the camera shows: the app is about
choosing what to put in front of you tonight. The rebuild was first called Kadr (the Polish word for the same thing);
one name gives one mark and one favicon ([decisions.md](decisions.md)).

- Written with a capital F, never in capitals (`FRAME`) or with a dot or a tagline attached.
- In Polish it is not declined: "z aplikacji Frame", "kopia aplikacji Frame", not "z Frame'a".
- The name is one message, `brand` in `src/i18n/messages.ts`; tab titles and the header read it.

## Idea

A dark cinema, one still lit. Everything around the films is quiet (near-black canvas, ivory text, hairlines) so the
posters carry the colour, and amber is the light of the projector: the one thing that is lit is the thing to look at.

## Mark

![The mark and the lockup on dark](../brand/lockup-dark.png)

A lit amber still with an F cut out of it. The F is built from straight strokes (a 4.6-unit stem and two arms on a
32-unit grid), so it stays sharp at 16 px; the still has the corner radius of a poster card (a quarter of its side).

**The mark and the favicon are one drawing.** `src/brand/mark.ts` holds it; `LogoMark` renders it and
`scripts/brand.mjs` writes `public/favicon.svg` and every icon from it. `src/brand/mark.test.ts` fails when the favicon
differs from the mark.

| File                                 | What                                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| `public/favicon.svg`                 | the mark, 186 bytes                                                |
| `public/icons/icon-192.png`, `-512`  | the mark with transparent corners (manifest)                       |
| `public/icons/icon-maskable-512.png` | full-bleed amber, the F inside the safe zone (Android adaptive)    |
| `public/icons/apple-touch-icon.png`  | 180 × 180, square: iOS rounds the corners itself                   |
| `public/og.png`                      | 1200 × 630 social image: the wordmark and a contact sheet, one lit |
| `brand/lockup-dark.svg`, `.png`      | the mark and the wordmark in ivory, for dark backgrounds           |
| `brand/lockup-light.svg`, `.png`     | the same in ink, for light backgrounds                             |

Regenerate all of them after a change to the mark: `node scripts/brand.mjs` (Chromium from Playwright renders the PNGs
with the app's own fonts). The lockup SVGs carry the Latin Fraunces subset, so they render the same anywhere; the PNGs
are at 4× (256 px high).

### Lockup

The mark, then the name in Fraunces 600 with tight tracking (−0.025 em). The name is 0.69 of the mark's height and
the gap between them 0.31 of it (in the header: a 32 px mark, 22.4 px type, 10 px gap; `Wordmark` in
`src/components/Logo.tsx`). The mark is the same on both backgrounds; only the colour of the name changes.

### Do

- Keep clear space around the mark of at least a quarter of its side.
- Use the mark alone where space is tight (favicon, app icon, avatar) and the lockup where the name has room.
- Put the mark on the canvas, on a photo darkened by the scrim, or on ivory.

### Don't

- Redraw the mark, outline it, add a shadow, a gradient or a glow to it, or rotate it.
- Change its colours: the still is always amber, the F always the warm black of `--color-on-accent`.
- Set the F in a typeface, or put another letter in the still.
- Put the mark on amber or on a busy part of an image, or squeeze it into a circle.
- Export icons by hand: change `src/brand/mark.ts` and run the script.

## Colour

One set of tokens, both themes (`light-dark()` in `src/styles/app.css`); WCAG 2.2 AA contrast is tested with axe in both.

| Token                 | Dark theme        | Light theme | Use                                        |
| --------------------- | ----------------- | ----------- | ------------------------------------------ |
| `--color-canvas`      | `#08080a`         | `#f6f3ee`   | the page                                   |
| `--color-surface`     | `#121115`         | `#fdfbf9`   | cards, dialogs                             |
| `--color-raised`      | `#1c1b20`         | `#ebe7e1`   | chips, skeletons, the shadow under artwork |
| `--color-ink`         | `#f4f0e7` (ivory) | `#17151b`   | text                                       |
| `--color-muted`       | `#b4b1a9`         | `#535158`   | secondary text, illustration lines         |
| `--color-accent`      | `#f9b648` (amber) | `#f9b648`   | the mark, primary buttons, the lit still   |
| `--color-on-accent`   | `#180f09`         | `#180f09`   | text and the F on amber                    |
| `--color-accent-text` | `#fcbe54`         | `#8b4600`   | amber as text or a thin line               |

The hex values are the OKLCH tokens converted for files that cannot read CSS (the mark, the icons). Amber is a light,
not a fill colour: a primary button, the mark, a rating, a focus ring. Never amber text on the light canvas (use
`--color-accent-text`), never large amber areas.

## Type

- **Fraunces** (variable, optical sizes) for display: the wordmark, page and film titles. Weight 600, tracking
  −0.015 em to −0.03 em as the size grows; the optical size follows the font size (`font-optical-sizing: auto`).
- **Hanken Grotesk** (variable) for everything else: interface, body, data. 400 for text, 500-600 for labels and buttons.
- Both are self-hosted from `@fontsource-variable`; no request leaves the site.

## Illustrations

Line drawings for the empty states in `src/components/illustrations/`: `reel` (an error), `ticket` (an empty list),
`search` (no results), `cut` (a page that is not there), `key` (no API key). Each is a 160 × 120 stage with a soft
shadow, 2.5 round strokes in `--color-muted` on `--color-surface` paper, and one lit amber still, the idea of the mark.
They read their colours from the tokens, so one drawing works in both themes, and are `aria-hidden`: the heading next
to them says what happened. Use them by the same names: `illustrations[art]` from `src/components/illustrations`.
