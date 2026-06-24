import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import { requirePageUser } from "@/lib/page-auth";
import { prisma } from "@/lib/db";
import { requireProjectAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requirePageUser(`/projects/${id}`);
  try { await requireProjectAccess(userId, id); } catch { notFound(); }
  const project = await prisma.transformationProject.findUnique({ where: { id }, include: { workspace: { select: { id: true, name: true } }, evidence: { orderBy: { createdAt: "desc" } }, capabilities: { include: { references: { include: { evidence: { select: { title: true } } } } }, orderBy: { dependencyScore: "desc" } }, assets: { include: { references: { include: { evidence: { select: { title: true } } } } }, orderBy: { updatedAt: "desc" } }, actions: { orderBy: [{ status: "asc" }, { createdAt: "asc" }] }, snapshots: { orderBy: { createdAt: "desc" }, take: 1 }, assessments: { orderBy: { createdAt: "desc" } }, simulations: { orderBy: { createdAt: "desc" }, take: 20 }, decisions: { include: { reviews: { orderBy: { createdAt: "desc" } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] } } });
  if (!project) notFound();
  return <AppShell><nav className="mb-5 flex items-center gap-2 text-sm text-slate-500"><Link href="/dashboard" className="hover:text-emerald-300">工作台</Link><span>/</span><span>{project.workspace.name}</span><span>/</span><span className="text-slate-300">{project.name}</span></nav><ProjectWorkspace project={JSON.parse(JSON.stringify(project))}/></AppShell>;
}
