import { prisma } from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";

export async function GET() {
  return route(async () => {
    const userId = await getOptionalUserId();
    if (!userId) throw new HttpError(401, "请先登录");
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { notifications, unread };
  });
}
