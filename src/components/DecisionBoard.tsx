"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Analysis = { summary: string; soundness: number; governanceScore: number; lessons: string[]; suggestedRule: string; followUps: { title: string; ownerHint: string }[] };
type Review = { id: string; outcome: string; analysis: Analysis; governanceScore: number; reviewerName: string; createdAt: string };
type Decision = { id: string; title: string; context: string; decision: string; rationale: string; ownerName: string; reversibility: "LOW" | "MEDIUM" | "HIGH"; expectedOutcome: string; status: "OPEN" | "REVIEWING" | "CLOSED"; createdAt: string; reviews: Review[] };

const percent = (v: number) => `${Math.round(v * 100)}%`;
const REV: Record<string, string> = { LOW: "难以逆转", MEDIUM: "部分可逆", HIGH: "容易逆转" };
const STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: "进行中", tone: "text-amber-300" },
  REVIEWING: { label: "复盘中", tone: "text-sky-300" },
  CLOSED: { label: "已复盘", tone: "text-emerald-300" },
};

export function DecisionBoard({ projectId, decisions, canRun }: { projectId: string; decisions: Decision[]; canRun: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function send(key: string, url: string, method: string, payload: unknown) {
    setBusy(key); setError("");
    try {
      const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "请求失败");
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
      return false;
    } finally {
      setBusy("");
    }
  }

  return <section className="space-y-4">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">7</p>
      <h2 className="mt-1 text-xl font-semibold">决策治理与复盘</h2>
      <p className="mt-1 text-sm text-slate-400">登记重要决策，事后做团队复盘：把决策质量与结果运气分开看，沉淀教训与可复用规则，逐步提升决策一致性。</p>
    </div>
    {error && <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>}
    {canRun && <DecisionForm projectId={projectId} busy={busy} send={send} />}
    {decisions.length ? <div className="space-y-3">{decisions.map((d) => <DecisionCard key={d.id} decision={d} busy={busy} canRun={canRun} send={send} />)}</div>
      : <p className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">还没有登记决策。先记录一个重要决策的背景、决定与预期。</p>}
  </section>;
}

function DecisionForm({ projectId, busy, send }: { projectId: string; busy: string; send: (k: string, u: string, m: string, p: unknown) => Promise<boolean> }) {
  const [f, setF] = useState({ title: "", context: "", decision: "", rationale: "", ownerName: "", reversibility: "MEDIUM", expectedOutcome: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return <form className="card space-y-3" onSubmit={async (e) => { e.preventDefault(); if (await send("new", `/api/projects/${projectId}/decisions`, "POST", f)) setF({ title: "", context: "", decision: "", rationale: "", ownerName: "", reversibility: "MEDIUM", expectedOutcome: "" }); }}>
    <div className="grid gap-3 sm:grid-cols-2"><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="决策标题" required /><input value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="决策负责人（DRI）" /></div>
    <textarea value={f.context} onChange={(e) => set("context", e.target.value)} rows={2} placeholder="背景：当时面对什么、有哪些信息" />
    <div className="grid gap-3 sm:grid-cols-2"><textarea value={f.decision} onChange={(e) => set("decision", e.target.value)} rows={2} placeholder="决定：最终怎么做" /><textarea value={f.rationale} onChange={(e) => set("rationale", e.target.value)} rows={2} placeholder="理由：为什么这么决定" /></div>
    <div className="grid gap-3 sm:grid-cols-2"><select value={f.reversibility} onChange={(e) => set("reversibility", e.target.value)}><option value="LOW">难以逆转</option><option value="MEDIUM">部分可逆</option><option value="HIGH">容易逆转</option></select><input value={f.expectedOutcome} onChange={(e) => set("expectedOutcome", e.target.value)} placeholder="预期结果" /></div>
    <button className="button-primary" disabled={busy === "new"}>{busy === "new" ? "登记中…" : "登记决策"}</button>
  </form>;
}

function DecisionCard({ decision, busy, canRun, send }: { decision: Decision; busy: string; canRun: boolean; send: (k: string, u: string, m: string, p: unknown) => Promise<boolean> }) {
  const [outcome, setOutcome] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [open, setOpen] = useState(false);
  const review = decision.reviews[0];
  const st = STATUS[decision.status];
  return <article className="card">
    <div className="flex items-start justify-between gap-3">
      <div><h3 className="font-semibold">{decision.title}</h3><p className="mt-1 text-xs text-slate-500">{decision.ownerName || "未指定负责人"} · {REV[decision.reversibility]}</p></div>
      <span className={`h-fit whitespace-nowrap rounded-full bg-slate-800 px-2 py-1 text-xs ${st.tone}`}>{st.label}</span>
    </div>
    {(decision.decision || decision.context) && <p className="mt-2 text-sm text-slate-400">{decision.decision || decision.context}</p>}
    {decision.expectedOutcome && <p className="mt-1 text-xs text-slate-500">预期：{decision.expectedOutcome}</p>}

    {review && <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-sm text-slate-300">{review.analysis.summary}</p>
      <div className="mt-3 grid grid-cols-2 gap-3"><Bar label="决策质量（流程）" value={review.analysis.soundness} /><Bar label="治理得分" value={review.governanceScore} /></div>
      {review.analysis.lessons.length > 0 && <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-slate-300">{review.analysis.lessons.map((l) => <li key={l}>{l}</li>)}</ul>}
      {review.analysis.suggestedRule && <p className="mt-3 rounded-lg border-l-2 border-emerald-700 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">建议规则：{review.analysis.suggestedRule}</p>}
      {review.analysis.followUps.length > 0 && <div className="mt-3 text-sm text-slate-400">跟进：{review.analysis.followUps.map((u) => `${u.title}（${u.ownerHint}）`).join("；")}</div>}
    </div>}

    {canRun && <div className="mt-3">
      {!open ? <button className="button-secondary !px-3 !py-1 text-xs" onClick={() => setOpen(true)}>{review ? "再次复盘" : "运行复盘"}</button>
        : <div className="space-y-2 rounded-xl border border-slate-800 p-3">
          <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} placeholder="实际发生了什么？（结果、偏差、意外）" />
          <div className="flex gap-2"><input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="复盘人" className="flex-1" />
            <button className="button-primary !px-3 !py-1 text-xs" disabled={busy === `rev-${decision.id}`} onClick={async () => { if (await send(`rev-${decision.id}`, `/api/decisions/${decision.id}/reviews`, "POST", { outcome, reviewerName: reviewer })) { setOpen(false); setOutcome(""); } }}>{busy === `rev-${decision.id}` ? "复盘中…" : "运行复盘"}</button>
            <button className="button-secondary !px-3 !py-1 text-xs" onClick={() => setOpen(false)}>取消</button></div>
        </div>}
    </div>}
  </article>;
}

function Bar({ label, value }: { label: string; value: number }) {
  return <div><div className="flex justify-between text-xs text-slate-400"><span>{label}</span><span>{percent(value)}</span></div><div className="mt-1 h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded bg-emerald-600" style={{ width: percent(value) }} /></div></div>;
}
