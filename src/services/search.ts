import { prisma } from "@/lib/db";
import { embed } from "@/lib/embeddings";
import { cosine, keywordScore } from "@/lib/similarity";

export interface SearchResult { id: string; title: string; snippet: string; score: number }

/** Semantic evidence search with graceful keyword fallback. When OPENAI_API_KEY is
 *  set it ranks by embedding cosine (lazily backfilling missing embeddings); otherwise
 *  it ranks by keyword overlap. */
export async function searchEvidence(projectId: string, query: string, limit = 8): Promise<{ mode: "semantic" | "keyword"; results: SearchResult[] }> {
  const evidence = await prisma.evidence.findMany({ where: { projectId }, select: { id: true, title: true, content: true, embedding: true }, take: 500 });
  const qEmb = await embed(query);
  let mode: "semantic" | "keyword" = "keyword";
  let scored: { id: string; title: string; content: string; score: number }[];

  if (qEmb) {
    mode = "semantic";
    const missing = evidence.filter((e) => !e.embedding?.length).slice(0, 20);
    for (const e of missing) {
      const emb = await embed(`${e.title}\n${e.content}`);
      if (emb) { await prisma.evidence.update({ where: { id: e.id }, data: { embedding: emb } }); e.embedding = emb; }
    }
    scored = evidence.map((e) => ({ id: e.id, title: e.title, content: e.content, score: e.embedding?.length ? cosine(qEmb, e.embedding) : keywordScore(query, `${e.title} ${e.content}`) * 0.5 }));
  } else {
    scored = evidence.map((e) => ({ id: e.id, title: e.title, content: e.content, score: keywordScore(query, `${e.title} ${e.content}`) }));
  }

  const results = scored
    .filter((x) => x.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => ({ id: x.id, title: x.title, snippet: x.content.slice(0, 140), score: Math.round(x.score * 100) / 100 }));
  return { mode, results };
}
