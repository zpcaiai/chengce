import { route, HttpError } from "@/lib/http";
import { sweepNotifications } from "@/services/notifications";

/** Scheduled sweep (Vercel Cron). Secured by CRON_SECRET via Authorization header or ?key=. */
export async function GET(req: Request) {
  return route(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new HttpError(503, "CRON_SECRET 未配置，定时任务已禁用");
    const auth = req.headers.get("authorization");
    const key = new URL(req.url).searchParams.get("key");
    if (auth !== `Bearer ${secret}` && key !== secret) throw new HttpError(401, "未授权");
    return await sweepNotifications();
  });
}
