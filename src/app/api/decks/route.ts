import { z } from "zod";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, parseBody, HttpError } from "@/lib/http";
import { getDeckTemplate } from "@/lib/deck/templates";
import { computeDeck } from "@/services/deck-compute";

export async function GET() {
  return route(async () => {
    const userId = await getUserId();
    const decks = await prisma.deck.findMany({ where: { createdById: userId }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, scenario: true, themeId: true, updatedAt: true } });
    return { decks };
  });
}

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

export async function POST(req: Request) {
  return route(async () => {
    const userId = await getUserId();
    const b = await parseBody(req, body);
    let title: string, themeId: string, scenario: string, slides: unknown;
    if (b.mode === "template") {
      const tpl = b.templateId ? getDeckTemplate(b.templateId) : undefined;
      if (!tpl) throw new HttpError(400, "模板不存在");
      title = b.title || tpl.name; themeId = b.themeId || tpl.themeId; scenario = tpl.scenario; slides = tpl.slides;
    } else {
      if (!b.topic) throw new HttpError(400, "请填写演示主题");
      const deck = await computeDeck({ topic: b.topic, scenario: b.scenario, audience: b.audience, points: b.points, themeId: b.themeId });
      title = b.title || deck.title; themeId = deck.themeId; scenario = deck.scenario; slides = deck.slides;
    }
    const deck = await prisma.deck.create({ data: { createdById: userId, title, themeId, scenario, slides: slides as Prisma.InputJsonValue } });
    return created({ deck: { id: deck.id } });
  });
}
