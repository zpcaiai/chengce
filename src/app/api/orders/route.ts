import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { createSubscriptionOrder, createPackageOrder, listOrders } from "@/services/orders";

const body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("SUBSCRIPTION"), workspaceId: z.string().cuid(), plan: z.enum(["DIAGNOSTIC", "DELIVERY", "CONTINUITY"]), seats: z.number().int().min(1).max(500).default(3), period: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).default("MONTHLY"), provider: z.enum(["mock", "alipay", "wechat"]).default("mock") }),
  z.object({ kind: z.literal("PACKAGE"), workspaceId: z.string().cuid(), packageId: z.string().min(1), provider: z.enum(["mock", "alipay", "wechat"]).default("mock") }),
]);

export async function POST(req: Request) {
  return route(async () => {
    const userId = await getUserId();
    const input = await parseBody(req, body);
    if (input.kind === "SUBSCRIPTION") {
      await requireWorkspaceAccess(userId, input.workspaceId, "OWNER");
      return created(await createSubscriptionOrder({ ...input, createdById: userId }));
    }
    await requireWorkspaceAccess(userId, input.workspaceId, "ADMIN");
    return created(await createPackageOrder({ ...input, createdById: userId }));
  });
}

export async function GET(req: Request) {
  return route(async () => {
    const userId = await getUserId();
    const workspaceId = new URL(req.url).searchParams.get("workspaceId") ?? "";
    await requireWorkspaceAccess(userId, workspaceId, "ADMIN");
    return { orders: await listOrders(workspaceId) };
  });
}
