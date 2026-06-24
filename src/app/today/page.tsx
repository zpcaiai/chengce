import { AppShell } from "@/components/AppShell";
import { TodayPlanner } from "@/components/TodayPlanner";
import { requirePageUser } from "@/lib/page-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const userId = await requirePageUser("/today");
  const actions = await prisma.transferAction.findMany({ where: { project: { workspace: { members: { some: { userId } } } } }, include: { project: { select: { id: true, name: true } } }, orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }], take: 100 });
  return <AppShell><TodayPlanner actions={actions.map((action) => ({ id: action.id, title: action.title, description: action.description, dueAt: action.dueAt?.toISOString() ?? null, status: action.status, projectId: action.project.id, projectName: action.project.name }))}/></AppShell>;
}
