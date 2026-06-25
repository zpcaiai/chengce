"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Client = { id: string; name: string; industry: string; stage: string; contactName: string; contactEmail: string; notes: string; _count: { projects: number } };

const STAGES: { id: string; label: string; tone: string }[] = [
  { id: "LEAD", label: "线索", tone: "text-amber-300" },
  { id: "ACTIVE", label: "进行中", tone: "text-emerald-300" },
  { id: "PAUSED", label: "暂停", tone: "text-slate-400" },
  { id: "CLOSED", label: "结束", tone: "text-slate-500" },
];
const stageOf = (s: string) => STAGES.find((x) => x.id === s) ?? STAGES[0];

export function ClientsPanel({ workspaceId, clients, canManage }: { workspaceId: string; clients: Client[]; canManage: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", industry: "", contactName: "", contactEmail: "" });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function api(url: string, method: string, payload?: unknown) {
    const res = await fetch(url, { method, headers: payload ? { "content-type": "application/json" } : undefined, body: payload ? JSON.stringify(payload) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "操作失败");
    return data;
  }

  return <div className="space-y-6">
    {error && <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>}
    {canManage && <section className="card">
      <h2 className="text-lg font-semibold">新建客户</h2>
      <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (!f.name.trim()) return; setBusy("new"); setError(""); try { await api(`/api/workspaces/${workspaceId}/clients`, "POST", f); setF({ name: "", industry: "", contactName: "", contactEmail: "" }); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "操作失败"); } finally { setBusy(""); } }}>
        <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="客户/组织名称" required />
        <input value={f.industry} onChange={(e) => set("industry", e.target.value)} placeholder="行业（可选）" />
        <input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="联系人（可选）" />
        <input value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="联系邮箱（可选）" />
        <button className="button-primary sm:col-span-2 sm:w-fit" disabled={busy === "new"}>{busy === "new" ? "创建中…" : "创建客户"}</button>
      </form>
    </section>}

    <section>
      <h2 className="mb-3 text-lg font-semibold">客户（{clients.length}）</h2>
      {clients.length ? <div className="space-y-2">{clients.map((c) => { const st = stageOf(c.stage); return <article key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><h3 className="font-semibold">{c.name}</h3><span className={`text-xs ${st.tone}`}>{st.label}</span></div><p className="mt-0.5 text-xs text-slate-500">{[c.industry, c.contactName, c.contactEmail].filter(Boolean).join(" · ") || "—"} · {c._count.projects} 个项目</p></div>
        {canManage && <div className="flex items-center gap-2">
          <select value={c.stage} onChange={async (e) => { try { await api(`/api/clients/${c.id}`, "PATCH", { stage: e.target.value }); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "操作失败"); } }}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          <button className="button-secondary !px-2 !py-1 text-xs" disabled={busy === `d-${c.id}`} onClick={async () => { if (!confirm(`删除客户「${c.name}」？其项目会保留但解除关联。`)) return; setBusy(`d-${c.id}`); try { await api(`/api/clients/${c.id}`, "DELETE"); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "操作失败"); } finally { setBusy(""); } }}>删除</button>
        </div>}
      </article>; })}</div> : <p className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">还没有客户。把被诊断的组织登记为客户，便于按账户管理交付与续约。</p>}
    </section>
  </div>;
}
