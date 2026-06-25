import { prisma } from "@/lib/db";
import type { NotificationKind } from "@/generated/prisma";

const MEMBER_ROLES = ["OWNER", "ADMIN", "ADVISOR", "MEMBER"] as const;
const LEAD_ROLES = ["OWNER", "ADMIN", "ADVISOR"] as const;

/** Create a notification only if an identical unread one doesn't already exist. */
async function notifyOnce(userId: string, kind: NotificationKind, title: string, body: string, link: string, dedupeKey: string, workspaceId: string | null, projectId: string | null): Promise<boolean> {
  const exists = await prisma.notification.findFirst({ where: { userId, dedupeKey, readAt: null }, select: { id: true } });
  if (exists) return false;
  await prisma.notification.create({ data: { userId, kind, title, body, link, dedupeKey, workspaceId, projectId } });
  return true;
}

/** Daily sweep: surface review-due assets, blocked actions, and founder-dependency rises. */
export async function sweepNotifications(): Promise<{ created: number }> {
  let created = 0;
  const now = new Date();

  const dueAssets = await prisma.systemAsset.findMany({ where: { status: "APPROVED", reviewAt: { lte: now } }, include: { project: { select: { id: true, workspaceId: true, name: true } } }, take: 200 });
  for (const asset of dueAssets) {
    const members = await prisma.membership.findMany({ where: { workspaceId: asset.project.workspaceId, role: { in: [...MEMBER_ROLES] } }, select: { userId: true } });
    for (const m of members) if (await notifyOnce(m.userId, "REVIEW_DUE", `资产需复审：${asset.title}`, `项目「${asset.project.name}」`, `/projects/${asset.project.id}`, `review:${asset.id}`, asset.project.workspaceId, asset.project.id)) created++;
  }

  const blocked = await prisma.transferAction.findMany({ where: { status: "BLOCKED" }, include: { project: { select: { id: true, workspaceId: true, name: true } } }, take: 200 });
  for (const action of blocked) {
    const members = await prisma.membership.findMany({ where: { workspaceId: action.project.workspaceId, role: { in: [...MEMBER_ROLES] } }, select: { userId: true } });
    for (const m of members) if (await notifyOnce(m.userId, "ACTION_BLOCKED", `行动被阻塞：${action.title}`, `项目「${action.project.name}」`, `/projects/${action.project.id}`, `blocked:${action.id}`, action.project.workspaceId, action.project.id)) created++;
  }

  const projects = await prisma.transformationProject.findMany({
    where: { status: { in: ["ACTIVE", "DISCOVERY"] } },
    select: { id: true, workspaceId: true, name: true, snapshots: { orderBy: { createdAt: "desc" }, take: 2, select: { id: true, founderDependency: true } } },
  });
  for (const p of projects) {
    const [latest, prev] = p.snapshots;
    if (latest && prev && latest.founderDependency > prev.founderDependency + 0.05) {
      const members = await prisma.membership.findMany({ where: { workspaceId: p.workspaceId, role: { in: [...LEAD_ROLES] } }, select: { userId: true } });
      for (const m of members) if (await notifyOnce(m.userId, "DEPENDENCY_RISE", `创始人依赖回升：${p.name}`, `从 ${Math.round(prev.founderDependency * 100)}% 升到 ${Math.round(latest.founderDependency * 100)}%`, `/projects/${p.id}`, `deprise:${latest.id}`, p.workspaceId, p.id)) created++;
    }
  }

  return { created };
}
