"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FileUploadForm({ projectId }: { projectId: string }) {
  const router = useRouter(); const [file, setFile] = useState<File | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!file) return; setBusy(true); setMessage(""); try { const form = new FormData(); form.append("file", file); const res = await fetch(`/api/projects/${projectId}/files`, { method: "POST", body: form }); const json = await res.json(); if (!res.ok) throw new Error(json.error || "上传失败"); setMessage(json.transcriptionPending ? "文件已保存。配置 OPENAI_API_KEY 后可自动转写音频。" : "文件已转为证据来源。"); setFile(null); router.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "上传失败"); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="card flex flex-wrap items-center gap-3"><input className="max-w-sm" type="file" accept=".txt,.md,.csv,audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}/><button className="button-secondary" disabled={!file || busy}>{busy ? "上传中…" : "上传资料或录音"}</button><span className="text-xs text-slate-500">支持 TXT、MD、CSV 与音频，最大 20 MB。</span>{message && <p className="w-full text-xs text-slate-400">{message}</p>}</form>;
}
