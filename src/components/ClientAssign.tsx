"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Mini = { id: string; name: string };

/** Inline "归属客户" control shown in the project header. Read-only label for members
 *  below ADVISOR; a picker (loaded on demand) for managers. */
export function ClientAssign({ projectId, workspaceId, current, canManage }: { projectId: string; workspaceId: string; current: Mini | null; canManage: boolean }) {
  const router = useRouter();
  const [clients, setClients] = useState<Mini[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canManage || loaded) return;
    fetch(`/api/workspaces/${workspaceId}/clients`).then((r) => r.ok ? r.json() : { clients: [] }).then((d) => { setClients((d.clients ?? []).map((c: Mini) => ({ id: c.id, name: c.name }))); setLoaded(true); }).catch(() => setLoaded(true));
  }, [canManage, loaded, workspaceId]);

  if (!canManage) return <span className="text-slate-400">客户：{current?.name ?? "未关联"}</span>;

  async function assign(clientId: string) {
    setBusy(true);
    try { await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId: clientId || null }) }); router.refresh(); } finally { setBusy(false); }
  }

  return <span className="flex items-center gap-1">客户：
    <select className="!py-0.5 !text-xs" disabled={busy} value={current?.id ?? ""} onChange={(e) => assign(e.target.value)}>
      <option value="">未关联</option>
      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      {current && !clients.some((c) => c.id === current.id) && <option value={current.id}>{current.name}</option>}
    </select>
  </span>;
}
