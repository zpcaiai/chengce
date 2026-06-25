import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";

export async function POST(req: Request) {
  return route(async () => {
    const userId = await getUserId();
    const body = await parseBody(req, z.object({ workspaceId: z.string().cuid(), name: z.string().min(2).max(100), description: z.string().max(1000).default(""), clientId: z.string().cuid().optional() }));
    await requireWorkspaceAccess(userId, body.workspaceId, "ADMIN");
    const project = await prisma.transformationProject.create({ data: body });
    return created({ project });
  });
}
