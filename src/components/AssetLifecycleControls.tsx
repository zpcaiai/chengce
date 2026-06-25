"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type History = {
  revisions: { id: string; version: number; changeNote: string; createdAt: string; content: unknown }[];
  approvals: { id: string; decision: string; note: string; createdAt: string }[];
  feedback: { id: string; kind: string; note: string; createdAt: string }[];
};
type Body = Partial<{ purpose: string; whenToUse: string; owner: string; trigger: string; doneWhen: string; steps: string[]; exceptions: string[]; examples: string[] }>;
type Change = { label: string; kind: "str"; old: string; neu: string } | { label: string; kind: "arr"; added: string[]; removed: string[] };

const FB: Record<string, string> = { USED: "已使用", REVISION_REQUESTED: "请求修订", CASE_ADDED: "补充案例" };
const STR_FIELDS: [keyof Body, string][] = [["purpose", "目的"], ["whenToUse", "何时使用"], ["owner", "所有者"], ["trigger", "触发条件"], ["doneWhen", "完成标准"]];
const ARR_FIELDS: [keyof Body, string][] = [["steps", "步骤"], ["exceptions", "例外"], ["examples", "示例"]];
const day = (v: string) => new Date(v).toLocaleDateString("zh-CN");
const asBody = (v: unknown): Body => (v && typeof v === "object" ? (v as Body) : {});

function diffBody(prev: Body, next: Body): Change[] {
  const out: Change[] = [];
  for (const [k, label] of STR_FIELDS) { const o = (prev[k] as string) ?? ""; const n = (next[k] as string) ?? ""; if (o !== n) out.push({ label, kind: "str", old: o, neu: n }); }
  for (const [k, label] of ARR_FIELDS) { const o = (prev[k] as string[]) ?? []; const n = (next[k] as string[]) ?? []; const added = n.filter((x) => !o.includes(x)); const removed = o.filter((x) => !n.includes(x)); if (added.length || removed.length) out.push({ label, kind: "arr", added, removed }); }
  return out;
}

function DiffView({ prev, next }: { prev: Body; next: Body }) {
  const changes = diffBody(prev, next);
  if (!changes.length) return <p className="mt-1 text-slate-600">与上一版无字段差异。</p>;
  return <div className="mt-2 space-y-2 rounded border border-slate-800 bg-slate-950/40 p-2">{changes.map((c) => <div key={c.label}><p className="text-slate-400">{c.label}</p>{c.kind === "str"
    ? <p className="mt-0.5 break-words"><span className="text-rose-300 line-through">{c.old || "（空）"}</span> <span className="text-slate-500">→</span> <span className="text-emerald-300">{c.neu || "（空）"}</span></p>
    : <div className="mt-0.5 space-y-0.5">{c.removed.map((x) => <p key={`r-${x}`} className="text-rose-300">− {x}</p>)}{c.added.map((x) => <p key={`a-${x}`} className="text-emerald-300">+ {x}</p>)}</div>}</div>)}</div>;
}

export function AssetLifecycleControls({ asset, canEdit = true }: { asset: { id: string; title: string; ownerName: string; content: unknown; reviewAt: string | null }; canEdit?: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState(""); const [message, setMessage] = useState(""); const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(asset.title); const [ownerName, setOwner] = useState(asset.ownerName);
  const [content, setContent] = useState(JSON.stringify(asset.content, null, 2)); const [reviewAt, setReviewAt] = useState(asset.reviewAt?.slice(0, 10) ?? "");
  const [hist, setHist] = useState<History | null>(null); const [histOpen, setHistOpen] = useState(false); const [diffFor, setDiffFor] = useState<string | null>(null);

  async function post(url: string, payload: unknown, method = "POST") {
    setMessage("");
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || "保存失败"); router.refresh(); return data;
  }
  async function feedback(kind: "USED" | "REVISION_REQUESTED" | "CASE_ADDED") {
    try { await post(`/api/assets/${asset.id}/feedback`, { kind, note }); setMessage("反馈已记录。"); setNote(""); } catch (e) { setMessage(e instanceof Error ? e.message : "保存失败"); }
  }
  async function save() {
    try { const parsed = JSON.parse(content) as Record<string, unknown>; await post(`/api/assets/${asset.id}`, { title, ownerName, content: parsed, reviewAt: reviewAt ? new Date(`${reviewAt}T00:00:00Z`).toISOString() : null, changeNote: note }); setMessage("已创建新草稿版本，等待重新批准。"); setEditing(false); } catch (e) { setMessage(e instanceof Error ? e.message : "内容必须是有效 JSON"); }
  }
  async function loadHistory() {
    setHistOpen(true);
    try { const res = await fetch(`/api/assets/${asset.id}`); const data = await res.json(); if (res.ok) setHist(data); } catch { /* ignore */ }
  }

  return <div className="mt-4 border-t border-slate-800 pt-3">
    <div className="flex flex-wrap gap-2">
      {canEdit && <>
        <button className="button-secondary !px-2 !py-1 text-xs" onClick={() => feedback("USED")}>标记已使用</button>
        <button className="button-secondary !px-2 !py-1 text-xs" onClick={() => feedback("REVISION_REQUESTED")}>请求修订</button>
        <button className="button-secondary !px-2 !py-1 text-xs" onClick={() => feedback("CASE_ADDED")}>补充案例</button>
        <button className="button-secondary !px-2 !py-1 text-xs" onClick={() => setEditing(!editing)}>{editing ? "收起编辑" : "编辑并生成新版本"}</button>
      </>}
      <button className="button-secondary !px-2 !py-1 text-xs" onClick={() => (histOpen ? setHistOpen(false) : loadHistory())}>{histOpen ? "收起历史" : "版本与审批历史"}</button>
    </div>
    {canEdit && <input className="mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="使用结果、修订原因或新增案例" />}
    {canEdit && editing && <div className="mt-3 space-y-2 rounded-lg bg-slate-950/50 p-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题" /><input value={ownerName} onChange={(e) => setOwner(e.target.value)} placeholder="所有者" /><input type="date" aria-label="复审日期" value={reviewAt} onChange={(e) => setReviewAt(e.target.value)} /><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} /><button className="button-primary" onClick={save}>保存为新版本</button></div>}
    {histOpen && <div className="mt-3 space-y-3 rounded-lg border border-slate-800 p-3 text-xs">{hist ? <>
      <div><p className="font-medium text-slate-300">版本历史</p>{hist.revisions.length ? hist.revisions.map((r, i) => { const older = hist.revisions[i + 1]; return <div key={r.id} className="mt-1"><div className="flex items-center justify-between gap-2"><span className="text-slate-500">v{r.version} · {r.changeNote || "（无修订说明）"} · {day(r.createdAt)}</span>{older && <button className="shrink-0 text-emerald-300 hover:underline" onClick={() => setDiffFor(diffFor === r.id ? null : r.id)}>{diffFor === r.id ? "收起对比" : "对比上一版"}</button>}</div>{diffFor === r.id && older && <DiffView prev={asBody(older.content)} next={asBody(r.content)} />}</div>; }) : <p className="mt-0.5 text-slate-600">仅初始版本，暂无可对比的修订。</p>}</div>
      <div><p className="font-medium text-slate-300">审批记录</p>{hist.approvals.length ? hist.approvals.map((a) => <p key={a.id} className="mt-0.5 text-slate-500">{a.decision}{a.note ? ` · ${a.note}` : ""} · {day(a.createdAt)}</p>) : <p className="mt-0.5 text-slate-600">尚未审批。</p>}</div>
      <div><p className="font-medium text-slate-300">使用反馈</p>{hist.feedback.length ? hist.feedback.map((f) => <p key={f.id} className="mt-0.5 text-slate-500">{FB[f.kind] || f.kind}{f.note ? ` · ${f.note}` : ""} · {day(f.createdAt)}</p>) : <p className="mt-0.5 text-slate-600">暂无反馈。</p>}</div>
    </> : <p className="text-slate-500">加载中…</p>}</div>}
    {message && <p className="mt-2 text-xs text-slate-400">{message}</p>}
  </div>;
}
