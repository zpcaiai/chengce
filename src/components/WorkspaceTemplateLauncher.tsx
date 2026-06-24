"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceTemplate } from "@/lib/workspace-templates";

export function WorkspaceTemplateLauncher({ templates }: { templates: WorkspaceTemplate[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const [workspaceName, setWorkspaceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(() => templates.find((item) => item.id === selectedId), [selectedId, templates]);

  async function create() {
    if (!selected || workspaceName.trim().length < 2) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/workspace-templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ templateId: selected.id, workspaceName }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "创建失败");
      router.push(`/projects/${json.project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally { setBusy(false); }
  }

  if (!selected) return null;
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`rounded-xl border p-4 text-left transition ${item.id === selected.id ? "border-emerald-500 bg-emerald-950/50 shadow-[0_0_0_1px_rgba(16,185,129,.22)]" : "border-slate-800 bg-slate-900/50 hover:border-slate-600"}`} aria-pressed={item.id === selected.id}>
        <p className="text-xs text-emerald-300">{item.category}</p><h2 className="mt-1 font-semibold text-slate-100">{item.name}</h2><p className="mt-2 text-sm leading-5 text-slate-400">{item.description}</p><div className="mt-3 flex flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{tag}</span>)}</div>
      </button>)}
    </div>
    <section className="rounded-2xl border border-emerald-900/70 bg-gradient-to-br from-emerald-950/45 to-slate-900 p-5">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.9fr]"><div><p className="text-sm text-emerald-300">已选模板 · {selected.category}</p><h2 className="mt-1 text-2xl font-semibold">{selected.name}</h2><p className="mt-2 text-slate-300">{selected.description}</p><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">先服务谁</dt><dd className="mt-1 text-slate-200">{selected.project.targetUser}</dd></div><div><dt className="text-slate-500">首个结果</dt><dd className="mt-1 text-slate-200">{selected.project.mvpOutcome}</dd></div><div><dt className="text-slate-500">验证指标</dt><dd className="mt-1 text-slate-200">{selected.project.successMetric}</dd></div></dl><p className="mt-5 text-xs text-slate-500">创建后会直接带入：{selected.evidence.length} 条起步证据、{selected.capabilities.length} 个关键能力、{selected.assets.length} 份可编辑手册、{selected.actions.length} 个行动与 1 个实验。模板内容均可在项目内修改、补充和保存。</p></div><div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><label className="label" htmlFor="workspaceName">你的公司或工作区名称</label><input id="workspaceName" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} minLength={2} maxLength={80} placeholder="例如：北极星科技" autoComplete="organization"/><p className="mt-2 text-xs text-slate-500">不是空白项目。创建后会立即进入可执行、可编辑的工作台。</p>{error && <p className="mt-3 text-sm text-rose-400">{error}</p>}<button className="button-primary mt-5 w-full" disabled={busy || workspaceName.trim().length < 2} onClick={create}>{busy ? "正在配置你的工作台…" : "用此模板创建工作台"}</button></div></div>
    </section>
  </div>;
}
