import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { WorkspaceSettings } from "@/components/WorkspaceSettings";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) { const userId = await getUserId(); const { id } = await params; try { await requireWorkspaceAccess(userId, id, "ADMIN"); } catch { notFound(); } const workspace = await prisma.workspace.findUnique({ where: { id }, include: { members: { include: { user: { select: { name: true, email: true } } } }, subscription: true } }); if (!workspace) notFound(); return <AppShell><p className="text-sm text-emerald-300">工作区设置</p><h1 className="mt-1 text-3xl font-semibold">{workspace.name}</h1><div className="mt-8"><WorkspaceSettings workspaceId={workspace.id} members={workspace.members} subscription={workspace.subscription}/></div></AppShell>; }
