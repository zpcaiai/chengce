import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { requireFeature } from "@/services/entitlements";
import { listClients, createClient } from "@/services/clients";

const body = z.object({
  name: z.string().min(1).max(160),
  industry: z.string().max(120).optional(),
  stage: z.enum(["LEAD", "ACTIVE", "PAUSED", "CLOSED"]).optional(),
  contactName: z.string().max(120).optional(),
  contactEmail: z.string().email().or(z.literal("")).optional(),
  notes: z.string().max(4000).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireWorkspaceAccess(userId, id, "MEMBER");
    return { clients: await listClients(id) };
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireWorkspaceAccess(userId, id, "ADMIN");
    await requireFeature(id, "clients");
    const input = await parseBody(req, body);
    return created({ client: await createClient({ workspaceId: id, ...input }) });
  });
}
