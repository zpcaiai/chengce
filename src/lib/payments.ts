import crypto from "node:crypto";
import { HttpError } from "./http";

// Provider-agnostic payment notification handling. Migrated and adapted from the
// AreteOS commerce stack so chengce can take real RMB payments (Alipay / WeChat Pay)
// alongside the existing Stripe path. Verification is HMAC + timing-safe compare;
// swap in each gateway's native signature scheme in production.
export type PaymentProvider = "alipay" | "wechat";

export interface PaymentNotification {
  provider: PaymentProvider;
  outTradeNo: string;
  transactionId?: string;
  paid: boolean;
  raw: unknown;
}

function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function secretFor(provider: PaymentProvider): string | undefined {
  return provider === "alipay" ? process.env.ALIPAY_WEBHOOK_SECRET : process.env.WECHAT_PAY_WEBHOOK_SECRET;
}

/** Whether a real gateway secret is configured (vs. the local mock flow). */
export function isProviderConfigured(provider: PaymentProvider): boolean {
  return !!secretFor(provider);
}

export function verifyWebhookSignature(provider: PaymentProvider, rawBody: string, signature: string | null) {
  const secret = secretFor(provider);
  if (!secret) throw new HttpError(501, `${provider} 支付回调未配置`);
  if (!signature) throw new HttpError(401, "缺少支付签名");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!timingSafeEqual(expected, signature)) throw new HttpError(401, "支付签名无效");
}

const PAID_STATES = ["TRADE_SUCCESS", "TRADE_FINISHED", "SUCCESS", "PAID"];

export async function parsePaymentNotification(provider: PaymentProvider, req: Request): Promise<PaymentNotification> {
  const rawBody = await req.text();
  verifyWebhookSignature(provider, rawBody, req.headers.get("x-pay-signature"));

  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody) as Record<string, unknown>; } catch { throw new HttpError(400, "支付回调体不是合法 JSON"); }

  const outTradeNo = String(body.outTradeNo ?? body.out_trade_no ?? "");
  if (!outTradeNo) throw new HttpError(400, "缺少 outTradeNo");

  const tradeStatus = String(body.tradeStatus ?? body.trade_status ?? body.status ?? "").toUpperCase();
  const paid = PAID_STATES.includes(tradeStatus);

  return {
    provider,
    outTradeNo,
    transactionId: body.transactionId ? String(body.transactionId) : body.transaction_id ? String(body.transaction_id) : undefined,
    paid,
    raw: body,
  };
}
