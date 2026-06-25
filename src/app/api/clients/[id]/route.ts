import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route, HttpError } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { updateClient, deleteClient } from "@/services/clients";

const patch = z.object({
  name: z.string().min(1).max(160).optional(),
  industry: z.string().max(120).optional(),
  stage: z.enum(["LEAD", "ACTIVE", "PAUSED", "CLOSED"]).optional(),
  contactName: z.string().max(120).optional(),
  contactEmail: z.string().email().or(z.literal("")).optional(),
  notes: z.string().max(4000).optional(),
});

async function ownerWorkspace(userId: string, clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { workspaceId: true } });
  if (!client) throw new HttpError(404, "客户不存在");
  await requireWorkspaceAccess(userId, client.workspaceId, "ADMIN");
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await ownerWorkspace(userId, id);
    const body = await parseBody(req, patch);
    return { client: await updateClient(id, body) };
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await ownerWorkspace(userId, id);
    await deleteClient(id);
    return { ok: true };
  });
}
