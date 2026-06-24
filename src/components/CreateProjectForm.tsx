"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateProjectForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter(); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const res = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId, name, description }) }); const json = await res.json(); if (!res.ok) throw new Error(json.error); router.push(`/projects/${json.project.id}`); } catch (err) { setError(err instanceof Error ? err.message : "创建失败"); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="space-y-3"><label className="label">转移项目名称</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="2026 商业能力转移" required minLength={2}/><label className="label">项目背景</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="例如：让销售负责人能独立判断大客户定制需求。" />{error && <p className="text-sm text-rose-400">{error}</p>}<button className="button-primary" disabled={busy}>{busy ? "创建中…" : "开始诊断"}</button></form>;
}
