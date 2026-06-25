import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth";
import { route, parseBody, HttpError } from "@/lib/http";

export async function POST(req: Request) {
  return route(async () => {
    const userId = await getOptionalUserId();
    if (!userId) throw new HttpError(401, "请先登录");
    const { id } = await parseBody(req, z.object({ id: z.string().cuid().optional() }));
    await prisma.notification.updateMany({ where: { userId, readAt: null, ...(id ? { id } : {}) }, data: { readAt: new Date() } });
    return { ok: true };
  });
}
