import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ClientsPanel } from "@/components/ClientsPanel";
import { requirePageUser } from "@/lib/page-auth";
import { prisma } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { ROLE_RANK } from "@/lib/roles";
import { listClients } from "@/services/clients";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requirePageUser(`/workspaces/${id}/clients`);
  let role = "VIEWER";
  try { const membership = await requireWorkspaceAccess(userId, id, "MEMBER"); role = membership.role; } catch { notFound(); }
  const [workspace, clients] = await Promise.all([
    prisma.workspace.findUnique({ where: { id }, select: { name: true } }),
    listClients(id),
  ]);
  if (!workspace) notFound();
  return <AppShell>
    <nav className="mb-5 flex items-center gap-2 text-sm text-slate-500"><Link href={`/workspaces/${id}`} className="hover:text-emerald-300">{workspace.name}</Link><span>/</span><span className="text-slate-300">客户</span></nav>
    <p className="text-sm text-emerald-300">客户 / CRM</p>
    <h1 className="mt-1 text-3xl font-semibold">{workspace.name}</h1>
    <div className="mt-8"><ClientsPanel workspaceId={id} clients={JSON.parse(JSON.stringify(clients))} canManage={ROLE_RANK[role as keyof typeof ROLE_RANK] >= ROLE_RANK.ADMIN} /></div>
  </AppShell>;
}
