// Pure deck generation (no prisma) — unit-testable against the mock provider.
import type { Deck, Slide } from "@/lib/deck/types";
import { DeckWriter } from "@/agents/deck";

export async function computeDeck(input: { topic: string; scenario?: string; audience?: string; points?: string[]; themeId?: string }): Promise<Deck> {
  const out = await DeckWriter.run({ topic: input.topic, scenario: input.scenario ?? "", audience: input.audience ?? "", points: input.points ?? [] });
  return { title: out.title, themeId: input.themeId ?? "midnight", scenario: input.scenario ?? "", slides: out.slides as Slide[] };
}
