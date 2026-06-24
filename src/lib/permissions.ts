import { MembershipRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { roleAtLeast } from "@/lib/roles";

export async function requireProjectAccess(userId: string, projectId: string, minimum: MembershipRole = "VIEWER") {
  const project = await prisma.transformationProject.findUnique({
    where: { id: projectId },
    include: { workspace: { include: { members: { where: { userId }, take: 1 } } } },
  });
  if (!project) throw new HttpError(404, "Project not found");
  const membership = project.workspace.members[0];
  if (!membership || !roleAtLeast(membership.role, minimum)) throw new HttpError(403, "You do not have access to this workspace");
  return { project, membership };
}

export async function requireWorkspaceAccess(userId: string, workspaceId: string, minimum: MembershipRole = "VIEWER") {
  const membership = await prisma.membership.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
  if (!membership || !roleAtLeast(membership.role, minimum)) throw new HttpError(403, "You do not have access to this workspace");
  return membership;
}
