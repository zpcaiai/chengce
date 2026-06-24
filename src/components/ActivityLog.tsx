"use client";
import { useState } from "react";

type Log = { id: string; action: string; detail: string; createdAt: string; actor: string };

const ACTION_LABEL: Record<string, string> = {
  "diagnosis.run": "运行能力诊断",
  "capability.update": "更新能力转移状态",
};

function label(action: string): string {
  if (ACTION_LABEL[action]) return ACTION_LABEL[action];
  if (action.startsWith("assessment.")) return "运行组织诊断";
  if (action.startsWith("simulation")) return "组织数字孪生模拟";
  if (action === "decision.create") return "登记决策";
  if (action === "decision.review") return "决策复盘";
  if (action === "decision.status") return "更新决策状态";
  return action;
}

export function ActivityLog({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/audit`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setLogs(json.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setBusy(false);
    }
  }

  return <section className="space-y-4">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">8</p>
      <h2 className="mt-1 text-xl font-semibold">活动记录</h2>
      <p className="mt-1 text-sm text-slate-400">谁在何时运行了诊断、批准了规则、复盘了决策——每一步可追溯、可审计。</p>
    </div>
    {error && <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>}
    {logs === null
      ? <button className="button-secondary" disabled={busy} onClick={load}>{busy ? "加载中…" : "查看活动记录"}</button>
      : logs.length
        ? <div className="card divide-y divide-slate-800">{logs.map((l) => <div key={l.id} className="py-2.5"><div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><span><span className="text-slate-200">{l.actor}</span> <span className="text-slate-500">{label(l.action)}</span></span><span className="text-xs text-slate-500">{new Date(l.createdAt).toLocaleString("zh-CN")}</span></div>{l.detail && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{l.detail}</p>}</div>)}</div>
        : <p className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">还没有活动记录。</p>}
  </section>;
}
