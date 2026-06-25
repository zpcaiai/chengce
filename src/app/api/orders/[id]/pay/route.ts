import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { fulfillOrder } from "@/services/orders";

/** Local "pay now" — fulfils the order without a real gateway. In production the
 *  Alipay/WeChat notify webhook drives fulfilment instead (see /api/payments/*). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!order) throw new HttpError(404, "订单不存在");
    await requireWorkspaceAccess(userId, order.workspaceId, "OWNER");
    return { order: await fulfillOrder(id) };
  });
}
