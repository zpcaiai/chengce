"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { selectTodayAction, todayPlan, type Energy, type TimeBox, type TodayAction } from "@/lib/today";

export function TodayPlanner({ actions }: { actions: TodayAction[] }) {
  const [minutes, setMinutes] = useState<TimeBox>(25); const [energy, setEnergy] = useState<Energy>("MEDIUM"); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const action = useMemo(() => selectTodayAction(actions), [actions]);
  const plan = todayPlan(action, minutes, energy);
  async function complete() { if (!action) return; setBusy(true); try { const response = await fetch(`/api/actions/${action.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "DONE", proof: "在 Today 页面完成；请在项目中补充可复核证明。" }) }); if (!response.ok) throw new Error(); setDone(true); } finally { setBusy(false); } }
  return <section className="mx-auto max-w-3xl"><p className="text-sm text-emerald-300">今天行动</p><h1 className="mt-1 text-3xl font-semibold">今天，只推进一件能留下证据的事。</h1><p className="mt-3 text-slate-400">不追求连续打卡；根据你现在可用的时间和精力，完成一个真实的组织能力转移节点。</p>
    <div className="mt-7 grid gap-4 md:grid-cols-2"><fieldset className="card"><legend className="label">可用时间</legend><div className="flex gap-2">{([5, 25, 60] as TimeBox[]).map((value) => <button key={value} type="button" onClick={() => setMinutes(value)} className={minutes === value ? "button-primary flex-1" : "button-secondary flex-1"}>{value} 分钟</button>)}</div></fieldset><fieldset className="card"><legend className="label">当前精力</legend><div className="flex gap-2">{([ ["LOW", "低"], ["MEDIUM", "中"], ["HIGH", "高"] ] as [Energy, string][]).map(([value, label]) => <button key={value} type="button" onClick={() => setEnergy(value)} className={energy === value ? "button-primary flex-1" : "button-secondary flex-1"}>{label}</button>)}</div></fieldset></div>
    <section className="mt-5 rounded-2xl border border-emerald-800 bg-emerald-950/30 p-6"><p className="text-xs font-medium uppercase tracking-wider text-emerald-300">本次焦点 · {minutes} 分钟</p><h2 className="mt-2 text-xl font-semibold">{plan.title}</h2><p className="mt-3 leading-7 text-slate-200">{plan.instruction}</p><p className="mt-4 text-sm text-emerald-200">完成后：{plan.outcome}</p>{action ? <div className="mt-6 flex flex-wrap gap-3"><Link className="button-primary" href={`/projects/${action.projectId}`}>打开项目并执行</Link><button className="button-secondary" disabled={busy || done} onClick={complete}>{done ? "已记录完成" : busy ? "记录中…" : "完成后记录"}</button></div> : <Link className="button-primary mt-6 inline-block" href="/setup">创建第一项项目行动</Link>}</section>
    <div className="mt-6 rounded-xl border border-slate-800 p-4 text-sm text-slate-400"><p className="font-medium text-slate-200">为什么是这一项？</p><p className="mt-1">优先选择已开始或已到期、尚未完成且不受阻塞的行动。你可以随时在项目工作台调整负责人、证明和截止日期。</p></div>
  </section>;
}
