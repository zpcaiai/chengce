import { AppShell } from "@/components/AppShell";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { CreateWorkspaceForm } from "@/components/CreateWorkspaceForm";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const userId = await requirePageUser("/setup"); const { workspace: workspaceId } = await searchParams;
  const workspaces = await prisma.workspace.findMany({ where: { members: { some: { userId } } }, orderBy: { updatedAt: "desc" } });
  const workspace = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0];
  return <AppShell><div className="max-w-2xl"><p className="text-sm text-emerald-300">承策启动向导</p><h1 className="mt-2 text-3xl font-semibold">先建立可信的组织边界。</h1><p className="mt-3 text-slate-400">项目资料、AI 检索、审批与导出都归属一个工作区。组织 ID 永远由服务器从成员关系判定。</p><div className="mt-8 grid gap-5 md:grid-cols-2"><section className="card"><h2 className="text-lg font-semibold">1 · 工作区</h2><div className="mt-4"><CreateWorkspaceForm /></div></section><section className="card"><h2 className="text-lg font-semibold">2 · 转移项目</h2>{workspace ? <div className="mt-4"><p className="mb-3 text-sm text-slate-400">当前工作区：{workspace.name}</p><CreateProjectForm workspaceId={workspace.id} /></div> : <p className="mt-4 text-sm text-slate-500">先创建一个工作区。</p>}</section></div></div></AppShell>;
}
