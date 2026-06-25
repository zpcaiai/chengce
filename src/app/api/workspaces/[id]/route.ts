import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, parseBody } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";

/** Update workspace-level client-portal branding (admins only). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireWorkspaceAccess(userId, id, "ADMIN");
    const data = await parseBody(req, z.object({
      brandName: z.string().max(80).optional(),
      brandLogoUrl: z.string().max(500).optional(),
      brandColor: z.string().max(20).optional(),
    }));
    const workspace = await prisma.workspace.update({ where: { id }, data });
    return { workspace: { id: workspace.id, brandName: workspace.brandName, brandLogoUrl: workspace.brandLogoUrl, brandColor: workspace.brandColor } };
  });
}
