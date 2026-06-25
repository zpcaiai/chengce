import { AppShell } from "@/components/AppShell";
import { DeckStudio } from "@/components/deck/DeckStudio";
import { requirePageUser } from "@/lib/page-auth";
import { prisma } from "@/lib/db";
import { DECK_TEMPLATES } from "@/lib/deck/templates";
import { THEMES } from "@/lib/deck/themes";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
  const userId = await requirePageUser("/decks");
  const decks = await prisma.deck.findMany({ where: { createdById: userId }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, scenario: true, themeId: true, updatedAt: true }, take: 50 });
  const templates = DECK_TEMPLATES.map((t) => ({ id: t.id, name: t.name, scenario: t.scenario, description: t.description, themeId: t.themeId, cover: t.slides[0] }));
  return <AppShell><DeckStudio templates={JSON.parse(JSON.stringify(templates))} themes={THEMES} decks={JSON.parse(JSON.stringify(decks))} /></AppShell>;
}
