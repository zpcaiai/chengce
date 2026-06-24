"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ASSESSMENT_META, ASSESSMENT_KINDS, type AssessmentFindings } from "@/domains/assessment";

type Assessment = { id: string; kind: string; headlineScore: number; findings: AssessmentFindings; summary: string; createdAt: string };

const percent = (v: number) => `${Math.round(v * 100)}%`;
const date = (v: string) => new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(v));

export function AssessmentPanel({ projectId, assessments, canRun }: { projectId: string; assessments: Assessment[]; canRun: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // `assessments` arrives newest-first, so the first hit per kind is the latest.
  const latest = new Map<string, Assessment>();
  for (const a of assessments) if (!latest.has(a.kind)) latest.set(a.kind, a);

  async function run(kind: string) {
    setBusy(kind); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/assessments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "运行失败");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "运行失败");
    } finally {
      setBusy("");
    }
  }

  return <section className="space-y-4">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">5</p>
      <h2 className="mt-1 text-xl font-semibold">组织诊断</h2>
      <p className="mt-1 text-sm text-slate-400">关键人依赖压力测试与第二阶段诊断（管理杠杆、组织健康、决策治理、协作）。每个结论都基于证据并附引文，可直接进入月度报告与销售演示。</p>
    </div>
    {error && <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>}
    <div className="grid gap-4 lg:grid-cols-2">
      {ASSESSMENT_KINDS.map((kind) => {
        const meta = ASSESSMENT_META[kind];
        const a = latest.get(kind);
        return <article key={kind} className="card">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-semibold">{meta.label}</h3><p className="mt-1 text-sm text-slate-400">{meta.blurb}</p></div>
            {canRun && <button className="button-secondary !px-3 !py-1 text-xs" disabled={busy === kind} onClick={() => run(kind)}>{busy === kind ? "运行中…" : a ? "重新运行" : "运行"}</button>}
          </div>
          {a ? <div className="mt-4 space-y-3">
            <div className="flex items-baseline gap-2"><span className="text-2xl font-semibold text-emerald-300">{percent(a.headlineScore)}</span><span className="text-xs text-slate-500">{date(a.createdAt)}</span></div>
            <p className="text-sm text-slate-300">{a.summary}</p>
            <div className="space-y-2">{a.findings.metrics.map((m) => <div key={m.label}><div className="flex justify-between text-xs text-slate-400"><span>{m.label}</span><span>{percent(m.value)}</span></div><div className="mt-1 h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded bg-emerald-600" style={{ width: percent(m.value) }}/></div></div>)}</div>
            {a.findings.items.slice(0, 3).map((it, i) => <div key={i} className="border-l-2 border-slate-700 pl-3"><p className="text-sm text-slate-300">{it.label}<span className="text-slate-500">：{it.detail}</span></p>{it.quote && <p className="mt-0.5 text-xs text-slate-500">“{it.quote}”{it.evidenceTitle ? ` — ${it.evidenceTitle}` : ""}</p>}</div>)}
            {a.findings.recommendations.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-200/90">{a.findings.recommendations.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>}
          </div> : <p className="mt-4 text-sm text-slate-500">尚未运行。点击“运行”，基于现有证据生成评分、引文与建议。</p>}
        </article>;
      })}
    </div>
  </section>;
}
