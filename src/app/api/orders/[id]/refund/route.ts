import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { refundOrder } from "@/services/orders";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!order) throw new HttpError(404, "订单不存在");
    await requireWorkspaceAccess(userId, order.workspaceId, "OWNER");
    return { order: await refundOrder(id) };
  });
}
