"use client";
import { useState } from "react";

type C = { id: string; body: string; author: string; createdAt: string };

export function CommentThread({ projectId, targetType, targetId, canComment }: { projectId: string; targetType: "CAPABILITY" | "ASSET" | "DECISION"; targetId: string; canComment: boolean }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<C[] | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments?targetType=${targetType}&targetId=${targetId}`);
      const json = await res.json();
      if (res.ok) setComments(json.comments);
    } catch { /* ignore */ }
  }
  async function submit() {
    if (!body.trim()) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ targetType, targetId, body }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发送失败");
      setBody("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-3">
    <button className="text-xs text-slate-400 hover:text-emerald-300" onClick={() => { if (open) setOpen(false); else { setOpen(true); if (comments === null) load(); } }}>
      {open ? "收起讨论" : `讨论${comments ? ` (${comments.length})` : ""}`}
    </button>
    {open && <div className="mt-2 space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      {comments === null ? <p className="text-xs text-slate-500">加载中…</p>
        : comments.length ? comments.map((c) => <div key={c.id} className="text-xs"><span className="text-slate-300">{c.author}</span> <span className="text-slate-600">{new Date(c.createdAt).toLocaleString("zh-CN")}</span><p className="mt-0.5 whitespace-pre-wrap text-slate-400">{c.body}</p></div>)
        : <p className="text-xs text-slate-600">还没有讨论。</p>}
      {canComment && <div className="flex gap-2"><input value={body} onChange={(e) => setBody(e.target.value)} placeholder="写评论，用 @姓名 提及成员" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} /><button className="button-secondary !px-3 !py-1 text-xs" disabled={busy} onClick={submit}>{busy ? "发送中…" : "发送"}</button></div>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>}
  </div>;
}
