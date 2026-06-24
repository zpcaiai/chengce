"use client";

import { useState } from "react";
import { projectReadiness } from "@/lib/project-readiness";

type Experiment = { id: string; hypothesis: string; method: string; metric: string; ownerName: string; status: "PLANNED" | "RUNNING" | "LEARNED" | "PAUSED"; result: string; nextDecision: string; dueAt: string | null };
type WeeklyReview = { id: string; weekOf: string; outcome: string; evidence: string; risk: string; nextFocus: string };
type Action = { ownerName: string; status: string; proof: string };
type Save = (key: string, url: string, method?: string, payload?: unknown) => Promise<unknown>;

const statusLabel = { PLANNED: "待开始", RUNNING: "进行中", LEARNED: "已学到", PAUSED: "暂停" } as const;

export function ProjectControlPanel({ project, actions, approvedAssets, save }: { project: { id: string; targetUser: string; mvpOutcome: string; successMetric: string; evidenceCount: number; experiments: Experiment[]; weeklyReviews: WeeklyReview[] }; actions: Action[]; approvedAssets: number; save: Save }) {
  const [targetUser, setTargetUser] = useState(project.targetUser);
  const [mvpOutcome, setMvpOutcome] = useState(project.mvpOutcome);
  const [successMetric, setSuccessMetric] = useState(project.successMetric);
  const [hypothesis, setHypothesis] = useState(""); const [method, setMethod] = useState(""); const [metric, setMetric] = useState(""); const [ownerName, setOwnerName] = useState("");
  const [outcome, setOutcome] = useState(""); const [evidence, setEvidence] = useState(""); const [risk, setRisk] = useState(""); const [nextFocus, setNextFocus] = useState("");
  const readiness = projectReadiness({ targetUser, mvpOutcome, successMetric, evidenceCount: project.evidenceCount, approvedAssets, actions, experiments: project.experiments, weeklyReviewCount: project.weeklyReviews.length });

  return <section className="space-y-5 rounded-2xl border border-emerald-900/60 bg-slate-900/60 p-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-emerald-300">项目控制面</p><h2 className="mt-1 text-xl font-semibold">让真实产出，而不是分数，决定下一步。</h2><p className="mt-1 text-sm text-slate-400">MVP → 实验 → 证据 → 负责人 → 周复盘 → 可交付系统。</p></div><div className="text-right"><p className="text-3xl font-semibold text-emerald-300">{readiness.percent}%</p><p className="text-xs text-slate-500">交付准备度</p></div></div>
    <p className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">下一项：{readiness.next}</p>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{readiness.checks.map((check) => <div key={check.label} className={`rounded-xl border p-3 ${check.done ? "border-emerald-900 bg-emerald-950/20" : "border-slate-800 bg-slate-950/30"}`}><p className={check.done ? "text-sm text-emerald-300" : "text-sm text-slate-300"}>{check.done ? "✓" : "○"} {check.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p></div>)}</div>
    <div className="grid gap-5 xl:grid-cols-2">
      <form className="rounded-xl border border-slate-800 p-4" onSubmit={async (event) => { event.preventDefault(); await save("mvp", `/api/projects/${project.id}`, "PATCH", { targetUser, mvpOutcome, successMetric }); }}>
        <h3 className="font-semibold">MVP 定义</h3><p className="mt-1 text-xs text-slate-500">先承诺一个用户结果和验证信号，再扩展功能。</p>
        <div className="mt-3 space-y-2"><input value={targetUser} onChange={(event) => setTargetUser(event.target.value)} placeholder="首批用户，例如：负责大客户的销售负责人"/><input value={mvpOutcome} onChange={(event) => setMvpOutcome(event.target.value)} placeholder="MVP 结果，例如：能独立判断定制需求并给出报价路径"/><input value={successMetric} onChange={(event) => setSuccessMetric(event.target.value)} placeholder="成功信号，例如：连续 3 次无需创始人介入"/></div>
        <button className="button-secondary mt-3">保存 MVP 定义</button>
      </form>
      <form className="rounded-xl border border-slate-800 p-4" onSubmit={async (event) => { event.preventDefault(); const result = await save("weekly-review", `/api/projects/${project.id}/weekly-reviews`, "POST", { outcome, evidence, risk, nextFocus }); if (result) { setOutcome(""); setEvidence(""); setRisk(""); setNextFocus(""); } }}>
        <h3 className="font-semibold">本周复盘</h3><p className="mt-1 text-xs text-slate-500">记录变化与下一步，不追踪羞耻型连续打卡。</p>
        <div className="mt-3 space-y-2"><textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} rows={2} placeholder="本周实际发生了什么？" required/><input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="哪条证据证明了它？（可选）"/><input value={risk} onChange={(event) => setRisk(event.target.value)} placeholder="下周需要注意的风险（可选）"/><input value={nextFocus} onChange={(event) => setNextFocus(event.target.value)} placeholder="下周唯一重点" required/></div>
        <button className="button-primary mt-3">完成本周复盘</button>
      </form>
    </div>
    <div className="rounded-xl border border-slate-800 p-4"><h3 className="font-semibold">实验队列</h3><p className="mt-1 text-xs text-slate-500">实验是对 MVP 假设的低成本检验，不是更多待办。</p>
      <form className="mt-3 grid gap-2 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const result = await save("experiment", `/api/projects/${project.id}/experiments`, "POST", { hypothesis, method, metric, ownerName }); if (result) { setHypothesis(""); setMethod(""); setMetric(""); setOwnerName(""); } }}><input className="md:col-span-2" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} placeholder="假设：如果…，那么…" required minLength={8}/><input value={method} onChange={(event) => setMethod(event.target.value)} placeholder="最小测试方式"/><input value={metric} onChange={(event) => setMetric(event.target.value)} placeholder="观察什么信号"/><input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="负责人"/><button className="button-secondary">加入实验队列</button></form>
      {project.experiments.length ? <div className="mt-4 space-y-2">{project.experiments.map((experiment) => <article key={experiment.id} className="rounded-lg border border-slate-800 bg-slate-950/30 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-medium">{experiment.hypothesis}</p><p className="mt-1 text-xs text-slate-500">{experiment.method || "待定义方法"} · {experiment.metric || "待定义信号"} · {experiment.ownerName || "待指定负责人"}</p></div><select className="!w-auto !py-1 text-xs" value={experiment.status} onChange={(event) => save(`experiment-${experiment.id}`, `/api/experiments/${experiment.id}`, "PATCH", { status: event.target.value })}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{experiment.status === "LEARNED" && <p className="mt-2 text-xs text-emerald-300">已形成学习结论：{experiment.result || "请补充结果与下一项决策。"}</p>}</article>)}</div> : <p className="mt-4 text-sm text-slate-500">尚无实验。先用一个最小测试验证最关键假设。</p>}
    </div>
    {project.weeklyReviews[0] && <p className="text-xs text-slate-500">最近复盘：{new Date(project.weeklyReviews[0].weekOf).toLocaleDateString("zh-CN")} · 下一重点：{project.weeklyReviews[0].nextFocus}</p>}
  </section>;
}
