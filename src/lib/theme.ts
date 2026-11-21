import { useSyncExternalStore } from "react";

export type ThemeChoice = "dark" | "light" | "system";

const KEY = "kadr.theme";
const listeners = new Set<() => void>();

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

let choice: ThemeChoice = read();

// index.html sets data-theme before the first paint with the same rule; this keeps it in sync.
export function applyTheme(next: ThemeChoice) {
  const root = document.documentElement;
  if (next === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = next;
  const dark =
    next === "dark" || (next === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#0b0a0c" : "#f6f2ec");
}

export function setTheme(next: ThemeChoice) {
  choice = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // not saved: the choice holds for this visit
  }
  applyTheme(next);
  for (const listener of listeners) listener();
}

export function useTheme(): ThemeChoice {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => choice,
  );
}
