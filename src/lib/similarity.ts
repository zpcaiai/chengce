// Pure ranking helpers for evidence search — unit-testable, dependency-free.

export function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

/** Keyword relevance fallback. Handles space-separated terms and CJK (no-space) queries. */
export function keywordScore(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 1;
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length > 1) {
    let hits = 0;
    for (const term of terms) if (t.includes(term)) hits++;
    return hits / terms.length;
  }
  // single CJK-ish term: partial credit by character overlap
  const chars = [...new Set(q.split(""))].filter((c) => c.trim());
  if (!chars.length) return 0;
  let hits = 0;
  for (const c of chars) if (t.includes(c)) hits++;
  return (hits / chars.length) * 0.6;
}
