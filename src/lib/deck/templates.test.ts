import { describe, it, expect } from "vitest";
import { DECK_TEMPLATES, getDeckTemplate } from "@/lib/deck/templates";
import { THEMES, getTheme } from "@/lib/deck/themes";

const LAYOUTS = ["cover", "section", "bullets", "twoColumn", "metrics", "quote", "timeline", "closing"];

describe("deck templates integrity", () => {
  it("has multiple unique templates, each a cover-first deck with valid layouts and themes", () => {
    expect(DECK_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    const ids = new Set<string>();
    for (const t of DECK_TEMPLATES) {
      expect(ids.has(t.id)).toBe(false); ids.add(t.id);
      expect(t.slides.length).toBeGreaterThanOrEqual(4);
      expect(t.slides[0].layout).toBe("cover");
      expect(getTheme(t.themeId).id).toBe(t.themeId);
      for (const s of t.slides) expect(LAYOUTS).toContain(s.layout);
    }
    expect(getDeckTemplate(DECK_TEMPLATES[0].id)?.id).toBe(DECK_TEMPLATES[0].id);
  });
  it("themes are unique and getTheme falls back safely", () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    expect(getTheme("nonexistent").id).toBe(THEMES[0].id);
  });
});
