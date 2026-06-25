import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, parseBody, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

/** Approve or reject a draft asset. Reject sends it back to DRAFT with a reason; both
 *  decisions are recorded as an AssetApproval and an audit-log entry. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const asset = await prisma.systemAsset.findUnique({ where: { id } });
    if (!asset) throw new HttpError(404, "Asset not found");
    await requireProjectAccess(userId, asset.projectId, "ADVISOR");
    const { decision, note } = await parseBody(req, z.object({ decision: z.enum(["APPROVE", "REJECT"]).default("APPROVE"), note: z.string().max(500).default("") }));
    const result = await prisma.$transaction(async (tx) => {
      const updated = decision === "APPROVE"
        ? await tx.systemAsset.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date(), approvedById: userId } })
        : await tx.systemAsset.update({ where: { id }, data: { status: "DRAFT", approvedAt: null, approvedById: null } });
      await tx.assetApproval.create({ data: { assetId: id, approverId: userId, decision, note } });
      await tx.auditLog.create({ data: { projectId: asset.projectId, actorId: userId, action: decision === "APPROVE" ? "asset.approved" : "asset.rejected", target: id, detail: note || asset.title } });
      return updated;
    });
    return { asset: result };
  });
}
