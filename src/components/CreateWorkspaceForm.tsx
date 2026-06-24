"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateWorkspaceForm() {
  const router = useRouter(); const [name, setName] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const res = await fetch("/api/workspaces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }); const json = await res.json(); if (!res.ok) throw new Error(json.error); router.push(`/setup?workspace=${json.workspace.id}`); } catch (err) { setError(err instanceof Error ? err.message : "创建失败"); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="space-y-3"><label className="label">公司或工作区名称</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：北极星科技" required minLength={2} />{error && <p className="text-sm text-rose-400">{error}</p>}<button className="button-primary" disabled={busy}>{busy ? "创建中…" : "创建工作区"}</button></form>;
}
