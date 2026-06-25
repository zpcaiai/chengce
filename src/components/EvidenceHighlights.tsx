"use client";
import { useState } from "react";

type H = { quote: string; why: string; suggestion: string };

export function EvidenceHighlights({ evidenceId, canRun }: { evidenceId: string; canRun: boolean }) {
  const [items, setItems] = useState<H[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/highlights`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提取失败");
      setItems(json.highlights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提取失败");
    } finally {
      setBusy(false);
    }
  }

  if (!canRun) return null;
  return <div className="mt-3">
    <button className="text-xs text-emerald-300 hover:underline" disabled={busy} onClick={run}>{busy ? "提取中…" : "AI 提取关键判断时刻"}</button>
    {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    {items && <div className="mt-2 space-y-2">{items.map((h, i) => <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-xs"><p className="text-slate-300">“{h.quote}”</p><p className="mt-0.5 text-slate-500">{h.why}</p><p className="mt-0.5 text-emerald-300">建议建模：{h.suggestion}</p></div>)}</div>}
  </div>;
}
