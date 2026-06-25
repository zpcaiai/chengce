import { z } from "zod";
import { route, parseBody, HttpError } from "@/lib/http";
import { getDeckTemplate } from "@/lib/deck/templates";
import { computeDeck } from "@/services/deck-compute";

const body = z.object({
  mode: z.enum(["template", "ai"]),
  templateId: z.string().optional(),
  themeId: z.string().optional(),
  title: z.string().max(120).optional(),
  topic: z.string().max(200).optional(),
  scenario: z.string().max(80).optional(),
  audience: z.string().max(120).optional(),
  points: z.array(z.string()).optional(),
});

/** Returns computed slides without persisting — used for the preview step. */
export async function POST(req: Request) {
  return route(async () => {
    const b = await parseBody(req, body);
    if (b.mode === "template") {
      const tpl = b.templateId ? getDeckTemplate(b.templateId) : undefined;
      if (!tpl) throw new HttpError(400, "模板不存在");
      return { title: tpl.name, themeId: b.themeId || tpl.themeId, scenario: tpl.scenario, slides: tpl.slides };
    } else {
      if (!b.topic) throw new HttpError(400, "请填写演示主题");
      const deck = await computeDeck({ topic: b.topic, scenario: b.scenario, audience: b.audience, points: b.points, themeId: b.themeId });
      return { title: b.title || deck.title, themeId: deck.themeId, scenario: deck.scenario, slides: deck.slides };
    }
  });
}
