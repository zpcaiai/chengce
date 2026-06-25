import { route } from "@/lib/http";
import { DECK_TEMPLATES } from "@/lib/deck/templates";
import { THEMES } from "@/lib/deck/themes";

export async function GET() {
  return route(async () => ({
    templates: DECK_TEMPLATES.map((t) => ({ id: t.id, name: t.name, scenario: t.scenario, description: t.description, themeId: t.themeId, slideCount: t.slides.length })),
    themes: THEMES,
  }));
}
