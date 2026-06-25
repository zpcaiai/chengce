"use client";
import { useState } from "react";

type R = { id: string; title: string; snippet: string; score: number };

export function EvidenceSearch({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<R[] | null>(null);
  const [mode, setMode] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) });
      const json = await res.json();
      if (res.ok) { setResults(json.results); setMode(json.mode); }
    } finally {
      setBusy(false);
    }
  }

  return <div className="card space-y-2">
    <div className="flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="检索证据，例如：关于定价的判断" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); run(); } }} /><button className="button-secondary" disabled={busy} onClick={run}>{busy ? "检索中…" : "检索"}</button></div>
    {results && <div className="space-y-1">
      <p className="text-xs text-slate-500">{mode === "semantic" ? "语义检索" : "关键词检索"} · {results.length} 条</p>
      {results.length ? results.map((r) => <div key={r.id} className="rounded-lg border border-slate-800 p-2"><div className="flex justify-between gap-2"><span className="text-sm font-medium text-slate-200">{r.title}</span><span className="text-xs text-slate-600">{Math.round(r.score * 100)}%</span></div><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{r.snippet}</p></div>)
        : <p className="text-xs text-slate-500">没有匹配的证据。</p>}
    </div>}
  </div>;
}
