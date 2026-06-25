import { route } from "@/lib/http";
import { parsePaymentNotification } from "@/lib/payments";
import { fulfillByOutTradeNo } from "@/services/orders";

/** WeChat Pay async payment notification. Verifies the signature, then fulfils the
 *  order by outTradeNo (idempotent — safe under gateway retries). */
export async function POST(req: Request) {
  return route(async () => {
    const n = await parsePaymentNotification("wechat", req);
    if (!n.paid) return { ok: true, ignored: true };
    const order = await fulfillByOutTradeNo(n.outTradeNo);
    return { ok: true, order };
  });
}
