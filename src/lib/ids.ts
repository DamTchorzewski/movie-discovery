// Paths carry "<id>-<slug>" (/movie/550-fight-club/): readable, and only the number counts.

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function pathId(id: number, name?: string): string {
  const slug = name ? slugify(name) : "";
  return slug ? `${id}-${slug}` : String(id);
}

export function readId(value: string): number | null {
  if (!/^\d+(-|$)/.test(value)) return null;
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}
