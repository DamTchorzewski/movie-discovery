// The colours of the empty-state illustrations: CSS tokens from src/styles/app.css, so one drawing
// works in the dark and the light theme. The lit still (amber) is the same idea as the mark.
export const paint = {
  /** outlines */
  line: "var(--color-muted)",
  /** quiet details: text lines, perforations, grid */
  faint: "var(--color-line-strong)",
  /** the paper of tickets, film and the reel */
  paper: "var(--color-surface)",
  /** holes and the inside of the lens: the page shows through */
  hole: "var(--color-canvas)",
  /** the shadow on the floor */
  floor: "var(--color-raised)",
  /** the lit still */
  lit: "var(--color-accent)",
  /** the edge of the lit still, readable on both canvases */
  litEdge: "var(--color-accent-text)",
} as const;
