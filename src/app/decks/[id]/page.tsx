import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DeckEditor } from "@/components/deck/DeckEditor";
import { requirePageUser } from "@/lib/page-auth";
import { prisma } from "@/lib/db";
import { THEMES } from "@/lib/deck/themes";
import type { Slide } from "@/lib/deck/types";

export const dynamic = "force-dynamic";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requirePageUser(`/decks/${id}`);
  const deck = await prisma.deck.findUnique({ where: { id } });
  if (!deck || deck.createdById !== userId) notFound();
  const data = { id: deck.id, title: deck.title, themeId: deck.themeId, scenario: deck.scenario, slides: deck.slides as unknown as Slide[] };
  return <AppShell>
    <div className="mb-4"><a href="/decks" className="text-sm text-slate-400 hover:text-emerald-300">← 返回 PPT 工坊</a></div>
    <DeckEditor deck={JSON.parse(JSON.stringify(data))} themes={THEMES} />
  </AppShell>;
}
