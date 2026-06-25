// Pure citation-integrity check: does a cited quote actually appear in the source?
// Normalizes whitespace and quote punctuation before substring matching.
const norm = (s: string) => s.replace(/[\s"“”'']/g, "").toLowerCase();

export function quoteFound(quote: string, content: string): boolean {
  const q = norm(quote);
  if (q.length < 2) return true; // trivial/empty quotes are not flagged
  return norm(content).includes(q);
}
