import { describe, expect, it } from "vitest";
import favicon from "../../public/favicon.svg?raw";
import { markSvg } from "./mark";

// The owner's rule: the logo and the favicon are the same drawing. Both come from src/brand/mark.ts;
// this fails when public/favicon.svg was edited by hand or not regenerated (node scripts/brand.mjs).
describe("the mark", () => {
  it("is the favicon, byte for byte", () => {
    expect(favicon.trim()).toBe(markSvg());
  });

  it("fills the square when the platform rounds the corners itself", () => {
    expect(markSvg({ rounded: false })).not.toContain("rx=");
    expect(markSvg()).toContain('rx="8"');
  });
});
