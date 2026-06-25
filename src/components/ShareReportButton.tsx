"use client";
import { useState } from "react";

export function ShareReportButton({ snapshotId }: { snapshotId: string }) {
  const [url, setUrl] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function createShare() { setBusy(true); setError(""); try { const res = await fetch(`/api/snapshots/${snapshotId}/share`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expiresInDays: 30 }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "无法创建分享链接"); setUrl(data.url); } catch (err) { setError(err instanceof Error ? err.message : "无法创建分享链接"); } finally { setBusy(false); } }
  async function revoke() { if (!url) return; if (!confirm("撤销后该只读链接立即失效，确定撤销？")) return; const token = url.split("/").pop(); if (!token) return; const res = await fetch(`/api/shares/${token}/revoke`, { method: "POST" }); if (res.ok) { setUrl(""); setError(""); } else setError("撤销失败"); }
  return <div className="mt-4 flex flex-wrap items-center gap-2"><button className="button-secondary" disabled={busy} onClick={createShare}>{busy ? "创建中…" : "生成 30 天只读链接"}</button><a className="button-secondary" href={`/api/snapshots/${snapshotId}/pdf`}>下载 PDF</a><a className="button-secondary" href={`/api/snapshots/${snapshotId}/pptx`}>导出 PPT</a><a className="button-secondary" href={`/api/snapshots/${snapshotId}/xlsx`}>导出 Excel</a>{url && <><a href={url} target="_blank" rel="noreferrer" className="max-w-xs truncate text-xs text-emerald-300 underline">{url}</a><button className="text-xs text-rose-300 underline" onClick={revoke}>撤销</button></>}{error && <p className="w-full text-xs text-rose-300">{error}</p>}</div>;
}
