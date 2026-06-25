import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";
import { parsePaymentNotification, verifyWebhookSignature, isProviderConfigured } from "@/lib/payments";

const SECRET = "test-secret";
const sign = (body: string) => crypto.createHmac("sha256", SECRET).update(body).digest("hex");
function req(body: string, sig: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (sig) headers["x-pay-signature"] = sig;
  return new Request("https://x/notify", { method: "POST", headers, body });
}

describe("payments webhook", () => {
  beforeAll(() => { process.env.ALIPAY_WEBHOOK_SECRET = SECRET; });

  it("reports a provider configured when its secret is present", () => {
    expect(isProviderConfigured("alipay")).toBe(true);
  });

  it("parses a valid paid alipay notification", async () => {
    const body = JSON.stringify({ outTradeNo: "CSUB123", trade_status: "TRADE_SUCCESS", transaction_id: "T1" });
    const n = await parsePaymentNotification("alipay", req(body, sign(body)));
    expect(n.paid).toBe(true);
    expect(n.outTradeNo).toBe("CSUB123");
    expect(n.transactionId).toBe("T1");
  });

  it("treats pending statuses as not paid", async () => {
    const body = JSON.stringify({ outTradeNo: "CSUB124", status: "WAIT_BUYER_PAY" });
    const n = await parsePaymentNotification("alipay", req(body, sign(body)));
    expect(n.paid).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const body = JSON.stringify({ outTradeNo: "CSUB125", status: "SUCCESS" });
    await expect(parsePaymentNotification("alipay", req(body, "deadbeef"))).rejects.toThrow();
  });

  it("throws when the provider is unconfigured", () => {
    delete process.env.WECHAT_PAY_WEBHOOK_SECRET;
    expect(() => verifyWebhookSignature("wechat", "{}", "anything")).toThrow();
  });
});
