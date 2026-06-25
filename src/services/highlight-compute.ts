// Pure highlight extraction (no prisma) — unit-testable against the mock provider.
import { InterviewHighlighter } from "@/agents/highlight";

export interface Highlight { quote: string; why: string; suggestion: string }

export async function computeHighlights(title: string, content: string): Promise<Highlight[]> {
  const out = await InterviewHighlighter.run({ title, content });
  return out.highlights;
}
