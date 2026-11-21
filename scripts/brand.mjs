// Writes every brand file from the one drawing in src/brand/mark.ts, so nothing is exported by hand:
//   public/favicon.svg                      the mark
//   public/icons/icon-192.png, icon-512.png the mark, transparent corners
//   public/icons/icon-maskable-512.png      full-bleed still, the F inside the maskable safe zone
//   public/icons/apple-touch-icon.png       180 × 180, square (iOS rounds the corners itself)
//   public/og.png                           1200 × 630 social image
//   brand/lockup-{dark,light}.{svg,png}     the mark with the wordmark, for dark and light backgrounds
// Run: node scripts/brand.mjs (Chromium from Playwright renders the PNGs with the app's own fonts).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { MARK, markSvg } from "../src/brand/mark.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (path) => {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  return file;
};

// The palette in hex (the app defines it in OKLCH in src/styles/app.css).
const INK_DARK = "#f4f0e7"; // --color-ink, dark theme
const INK_LIGHT = "#17151b"; // --color-ink, light theme
const MUTED_DARK = "#b4b1a9"; // --color-muted, dark theme
const CANVAS_DARK = "#0b0a0c"; // the manifest and theme-color background

// A fontsource stylesheet with every file inlined, so the page needs no server.
function inlineFonts(pkg, css) {
  const dir = join(root, "node_modules", "@fontsource-variable", pkg);
  return readFileSync(join(dir, css), "utf8").replace(/url\(\.\/files\/([^)]+)\)/g, (_, file) => {
    const data = readFileSync(join(dir, "files", file)).toString("base64");
    return `url(data:font/woff2;base64,${data})`;
  });
}
const FONTS = inlineFonts("fraunces", "opsz.css") + inlineFonts("hanken-grotesk", "index.css");

// The F placed on a square of any size, scaled by `scale` and centred on the square.
function centredF(side, scale) {
  const [cx, cy] = [16.5, 16]; // the centre of the F's bounding box on the 32 grid
  const x = side / 2 - cx * scale;
  const y = side / 2 - cy * scale;
  return `<path fill="${MARK.letter}" transform="translate(${x} ${y}) scale(${scale})" d="${MARK.f}"/>`;
}

const sized = (svg, size) => svg.replace("<svg ", `<svg width="${size}" height="${size}" `);

const maskable =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
  `<rect width="512" height="512" fill="${MARK.tile}"/>${centredF(512, 13)}</svg>`;

// The lockup: the mark at 64 and the wordmark in Fraunces 600, the proportions of the header (32 / 22.4).
const LOCKUP = { height: 64, gap: 20, fontSize: 44, baseline: 47 };
const latinFraunces = readFileSync(
  join(root, "node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2"),
).toString("base64");

function lockupSvg(ink, width) {
  const { height, gap, fontSize, baseline } = LOCKUP;
  const scale = height / MARK.size;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<title>Frame</title>`,
    `<style>@font-face{font-family:"Fraunces Variable";font-weight:100 900;src:url(data:font/woff2;base64,${latinFraunces}) format("woff2")}`,
    `text{font-family:"Fraunces Variable",Georgia,serif;font-weight:600;font-optical-sizing:auto}</style>`,
    `<g transform="scale(${scale})"><rect width="${MARK.size}" height="${MARK.size}" rx="${MARK.radius}" fill="${MARK.tile}"/><path fill="${MARK.letter}" d="${MARK.f}"/></g>`,
    `<text x="${height + gap}" y="${baseline}" font-size="${fontSize}" letter-spacing="-1.1" fill="${ink}">Frame</text>`,
    `</svg>`,
  ].join("");
}

function ogHtml() {
  // a contact sheet of stills turned slightly; one is lit, and it is the mark
  const cells = Array.from({ length: 20 }, (_, i) => {
    if (i === 9) return `<div class="cell lit">${sized(markSvg(), 150)}</div>`;
    const tone = ["#141317", "#1c1b20", "#18171c", "#222127"][(i * 7) % 4];
    return `<div class="cell" style="background:${tone}"></div>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
  *{box-sizing:border-box}
  body{margin:0;width:1200px;height:630px;overflow:hidden;background:${CANVAS_DARK};-webkit-font-smoothing:antialiased}
  .stage{position:relative;width:1200px;height:630px;overflow:hidden;
    background:radial-gradient(ellipse 40% 55% at 78% 50%,rgba(249,182,72,.17),transparent 70%),${CANVAS_DARK}}
  .sheet{position:absolute;left:640px;top:-120px;display:grid;grid-template-columns:repeat(4,150px);gap:22px;
    transform:rotate(-9deg);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30%)}
  .cell{width:150px;height:150px;border-radius:37.5px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)}
  .cell.lit{box-shadow:0 0 90px 10px rgba(249,182,72,.32)}
  .cell svg{display:block}
  .copy{position:absolute;left:96px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
  h1{margin:0;font:600 172px/0.9 "Fraunces Variable",serif;font-optical-sizing:auto;letter-spacing:-.03em;color:${INK_DARK}}
  p{margin:36px 0 0;font:500 26px/1.3 "Hanken Grotesk Variable",sans-serif;color:${MUTED_DARK};white-space:nowrap}
  p+p{margin-top:6px}
  </style></head><body><div class="stage">
  <div class="sheet">${cells}</div>
  <div class="copy"><h1>Frame</h1>
  <p>Odkrywaj filmy i sprawdzaj, gdzie je obejrzeć.</p><p>Discover films and find where to watch them.</p></div>
  </div></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();

async function png(html, width, height, file, { transparent = true, scale = 1 } = {}) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const image = await page.screenshot({
    clip: { x: 0, y: 0, width: width, height: height },
    omitBackground: transparent,
    scale: scale === 1 ? "css" : "device",
  });
  writeFileSync(out(file), image);
  console.log("wrote", file);
}
const bare = (svg) =>
  `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace("<svg ", '<svg style="display:block" ')}</body></html>`;

writeFileSync(out("public/favicon.svg"), markSvg() + "\n");
console.log("wrote public/favicon.svg");

for (const size of [192, 512]) {
  await png(bare(sized(markSvg(), size)), size, size, `public/icons/icon-${size}.png`);
}
await png(bare(sized(maskable, 512)), 512, 512, "public/icons/icon-maskable-512.png", {
  transparent: false,
});
await png(
  bare(sized(markSvg({ rounded: false }), 180)),
  180,
  180,
  "public/icons/apple-touch-icon.png",
  {
    transparent: false,
  },
);
await png(ogHtml(), 1200, 630, "public/og.png", { transparent: false });

// The lockups: measure the wordmark in the real font, then write the SVG at its exact width.
for (const [name, ink] of [
  ["dark", INK_DARK],
  ["light", INK_LIGHT],
]) {
  await page.setContent(bare(lockupSvg(ink, 400)), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const textWidth = await page.evaluate(() => {
    const box = document.querySelector("text").getBBox();
    return Math.ceil(box.x + box.width);
  });
  const svg = lockupSvg(ink, textWidth + 2);
  writeFileSync(out(`brand/lockup-${name}.svg`), svg + "\n");
  console.log(`wrote brand/lockup-${name}.svg`);
  const ctx = await browser.newContext({ deviceScaleFactor: 4 });
  const hi = await ctx.newPage();
  await hi.setViewportSize({ width: textWidth + 2, height: LOCKUP.height });
  await hi.setContent(bare(svg), { waitUntil: "load" });
  await hi.evaluate(() => document.fonts.ready);
  writeFileSync(out(`brand/lockup-${name}.png`), await hi.screenshot({ omitBackground: true }));
  console.log(`wrote brand/lockup-${name}.png`);
  await ctx.close();
}

await browser.close();
