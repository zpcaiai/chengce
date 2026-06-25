"use client";
import { useState } from "react";

type Data = { total: number; unverifiedCount: number; unverified: { id: string; quote: string; evidenceTitle: string; on: string }[] };

export function CitationCheck({ projectId }: { projectId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/citation-check`);
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setBusy(false);
    }
  }

  return <section className="card">
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="font-semibold">引文校验</h2><p className="mt-1 text-sm text-slate-400">核对每条 AI 引文是否真的出现在所引证据中，防止幻觉。</p></div>
      <button className="button-secondary !px-3 !py-1 text-xs" disabled={busy} onClick={run}>{busy ? "校验中…" : "运行校验"}</button>
    </div>
    {data && <div className="mt-3 text-sm">{data.unverifiedCount === 0
      ? <p className="text-emerald-300">全部 {data.total} 条引文均可在证据中核对。✓</p>
      : <div><p className="text-rose-300">{data.unverifiedCount}/{data.total} 条引文无法在证据中找到原文：</p><ul className="mt-2 space-y-1 text-xs text-slate-400">{data.unverified.map((u) => <li key={u.id}>· 「{u.quote}」<span className="text-slate-600"> — 引自 {u.evidenceTitle}（用于 {u.on}）</span></li>)}</ul></div>}</div>}
  </section>;
}
