/// <reference types="vitest/config" />
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

// The path the site is served from. SITE_URL (set by the deploy workflow from the Pages settings) wins,
// so a custom domain needs no edit; the GitHub Pages project path is the default.
const DEFAULT_BASE = "/movie-discovery/";

// Routes that exist without data: each gets its own index.html copy so GitHub Pages answers 200.
// Every other path (a movie, a person) is served by 404.html, which is the same app.
const STATIC_ROUTES = ["discover", "search", "library", "tonight", "about"];

const CSP = [
  "default-src 'self'",
  "script-src 'self' __INLINE_HASHES__",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://image.tmdb.org",
  "font-src 'self'",
  "connect-src 'self' https://api.themoviedb.org",
  "frame-src https://www.youtube-nocookie.com",
  "media-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

// GitHub Pages cannot send headers, so the policy is a <meta> with the hash of every inline script.
function contentSecurityPolicy(): Plugin {
  return {
    name: "kadr-csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
          ([, body]) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`,
        );
        const policy = CSP.replace("__INLINE_HASHES__", hashes.join(" ")).trim();
        return html.replace(
          "<meta charset",
          `<meta http-equiv="Content-Security-Policy" content="${policy}" />\n    <meta charset`,
        );
      },
    },
  };
}

function staticRoutes(outDir: string): Plugin {
  return {
    name: "kadr-static-routes",
    apply: "build",
    closeBundle() {
      const index = join(outDir, "index.html");
      copyFileSync(index, join(outDir, "404.html"));
      for (const route of [...STATIC_ROUTES, "en", ...STATIC_ROUTES.map((r) => `en/${r}`)]) {
        const target = join(outDir, route, "index.html");
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(index, target);
      }
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.SITE_URL ? new URL(env.SITE_URL) : undefined;
  const base = siteUrl?.pathname ?? DEFAULT_BASE;
  if (command === "build" && mode === "production" && !env.VITE_TMDB_API_KEY) {
    console.warn("- TMDB: VITE_TMDB_API_KEY not set, the build shows the no-key screen");
  }
  return {
    base,
    plugins: [react(), tailwindcss(), contentSecurityPolicy(), staticRoutes("dist")],
    build: { assetsInlineLimit: 0, sourcemap: false, target: "es2022" },
    test: {
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
