import { prisma } from "@/lib/db";

export type ClientStageName = "LEAD" | "ACTIVE" | "PAUSED" | "CLOSED";

export async function listClients(workspaceId: string) {
  return prisma.client.findMany({
    where: { workspaceId },
    orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { projects: true } } },
  });
}

export async function createClient(input: {
  workspaceId: string; name: string; industry?: string; stage?: ClientStageName; contactName?: string; contactEmail?: string; notes?: string;
}) {
  return prisma.client.create({
    data: {
      workspaceId: input.workspaceId, name: input.name, industry: input.industry ?? "",
      stage: input.stage ?? "LEAD", contactName: input.contactName ?? "", contactEmail: input.contactEmail ?? "", notes: input.notes ?? "",
    },
  });
}

export async function updateClient(id: string, patch: Partial<{ name: string; industry: string; stage: ClientStageName; contactName: string; contactEmail: string; notes: string }>) {
  return prisma.client.update({ where: { id }, data: patch });
}

export async function deleteClient(id: string) {
  // Projects keep working — clientId is set null on delete (onDelete: SetNull).
  return prisma.client.delete({ where: { id } });
}
