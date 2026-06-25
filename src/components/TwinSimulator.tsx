"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Effect = { dimension: string; direction: "UP" | "DOWN" | "FLAT"; magnitude: number; rationale: string };
type Prediction = { prediction: string; effects: Effect[]; risks: string[]; recommendations: string[] };
type Simulation = { id: string; scenario: string; prediction: Prediction; accuracy: number; createdAt: string };

const PRESETS = ["创始人在 6 个月内退出日常运营", "关键骨干/工程师离职", "12 个月内团队规模翻倍", "丢失最大的客户"];
const percent = (v: number) => `${Math.round(v * 100)}%`;
const date = (v: string) => new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(v));
const DIR: Record<string, { mark: string; tone: string }> = {
  UP: { mark: "▲", tone: "text-emerald-300" },
  DOWN: { mark: "▼", tone: "text-rose-300" },
  FLAT: { mark: "→", tone: "text-slate-400" },
};

export function TwinSimulator({ projectId, simulations, canRun }: { projectId: string; simulations: Simulation[]; canRun: boolean }) {
  const router = useRouter();
  const [scenario, setScenario] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());

  async function run() {
    if (scenario.trim().length < 4) { setError("请先描述一个情景"); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/simulations`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "模拟失败");
      setScenario("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "模拟失败");
    } finally {
      setBusy(false);
    }
  }

  async function addAction(title: string, scenario: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/actions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: title.slice(0, 160), description: `来自数字孪生：${scenario}` }) });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "加入失败"); }
      setAdded((s) => new Set(s).add(title));
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "加入失败"); }
  }

  return <section className="space-y-4">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">6</p>
      <h2 className="mt-1 text-xl font-semibold">组织数字孪生</h2>
      <p className="mt-1 text-sm text-slate-400">用当前的能力与诊断指标作为基线，模拟“如果……会怎样”。结果是带准确度说明的决策辅助，不是承诺的预测。</p>
    </div>
    {error && <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>}
    {canRun && <div className="card space-y-3">
      <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <button key={p} type="button" onClick={() => setScenario(p)} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-700 hover:text-emerald-300">{p}</button>)}</div>
      <textarea value={scenario} onChange={(e) => setScenario(e.target.value)} rows={2} placeholder="描述一个情景，例如：创始人退出日常运营、关键人离职、规模翻倍……" />
      <button className="button-primary" disabled={busy} onClick={run}>{busy ? "模拟中…" : "运行模拟"}</button>
    </div>}
    {simulations.length ? <div className="space-y-3">{simulations.map((sim) => <article key={sim.id} className="card">
      <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{sim.scenario}</h3><span className="h-fit whitespace-nowrap rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">准确度 {percent(sim.accuracy)} · {date(sim.createdAt)}</span></div>
      <p className="mt-2 text-sm text-slate-300">{sim.prediction.prediction}</p>
      <div className="mt-4 space-y-2">{sim.prediction.effects.map((e, i) => <div key={i}><div className="flex items-center justify-between text-xs"><span className="text-slate-300"><span className={DIR[e.direction]?.tone}>{DIR[e.direction]?.mark}</span> {e.dimension}</span><span className="text-slate-500">{percent(e.magnitude)}</span></div><div className="mt-1 h-1.5 rounded bg-slate-800"><div className={`h-1.5 rounded ${e.direction === "DOWN" ? "bg-rose-600" : e.direction === "FLAT" ? "bg-slate-600" : "bg-emerald-600"}`} style={{ width: percent(e.magnitude) }}/></div><p className="mt-1 text-xs text-slate-500">{e.rationale}</p></div>)}</div>
      {sim.prediction.risks.length > 0 && <div className="mt-3"><p className="text-xs text-rose-300">风险</p><ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-300">{sim.prediction.risks.map((r) => <li key={r}>{r}</li>)}</ul></div>}
      {sim.prediction.recommendations.length > 0 && <div className="mt-3"><p className="text-xs text-emerald-300">降风险动作</p><ul className="mt-1 space-y-0.5 text-sm text-emerald-200/90">{sim.prediction.recommendations.map((r) => <li key={r} className="flex items-start justify-between gap-2"><span>· {r}</span>{canRun && <button className="shrink-0 text-xs text-emerald-300 hover:underline disabled:text-slate-600" disabled={added.has(r)} onClick={() => addAction(r, sim.scenario)}>{added.has(r) ? "已加入" : "+ 行动"}</button>}</li>)}</ul></div>}
    </article>)}</div> : <p className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">还没有模拟。先运行一次诊断建立基线，再模拟一个情景。</p>}
  </section>;
}
