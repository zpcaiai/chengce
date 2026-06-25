import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { planPrice, getServicePackage, PERIOD_DAYS, PLAN_INFO, PERIODS, type PlanName, type BillingPeriod } from "@/lib/plans";

type ProviderInput = "mock" | "alipay" | "wechat";
const PROVIDER_ENUM = { mock: "MOCK", alipay: "ALIPAY", wechat: "WECHAT" } as const;

const DAY_MS = 86_400_000;
function outTradeNo(prefix: string) { return prefix + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1e4).toString().padStart(4, "0"); }

// Prisma Decimal doesn't serialize cleanly to the client; always expose amount as a number.
type OrderRow = { amount: { toString(): string } } & Record<string, unknown>;
export function serializeOrder<T extends OrderRow>(o: T) { return { ...o, amount: Number(o.amount) }; }

export async function createSubscriptionOrder(input: {
  workspaceId: string; createdById: string; plan: PlanName; seats: number; period: BillingPeriod; provider?: ProviderInput;
}) {
  const seats = Math.max(1, Math.min(500, Math.floor(input.seats || 1)));
  const amount = planPrice(input.plan, seats, input.period);
  const order = await prisma.order.create({
    data: {
      workspaceId: input.workspaceId, createdById: input.createdById, kind: "SUBSCRIPTION",
      plan: input.plan, seats, period: input.period, amount, currency: "CNY",
      title: `${PLAN_INFO[input.plan].label} · ${PERIODS[input.period].label} · ${seats} 席`,
      provider: PROVIDER_ENUM[input.provider ?? "mock"], outTradeNo: outTradeNo("CSUB"),
    },
  });
  return { order: serializeOrder(order), payUrl: null as string | null };
}

export async function createPackageOrder(input: {
  workspaceId: string; createdById: string; packageId: string; provider?: ProviderInput;
}) {
  const pkg = getServicePackage(input.packageId);
  if (!pkg) throw new HttpError(404, "服务包不存在或已下架");
  const order = await prisma.order.create({
    data: {
      workspaceId: input.workspaceId, createdById: input.createdById, kind: "PACKAGE",
      packageId: pkg.id, amount: pkg.amount, currency: "CNY", title: pkg.name,
      provider: PROVIDER_ENUM[input.provider ?? "mock"], outTradeNo: outTradeNo("CPKG"),
    },
  });
  return { order: serializeOrder(order), payUrl: null as string | null };
}

/** Mark an order paid and apply its effect, atomically. Idempotent so a gateway can
 *  safely retry the notify callback (re-paying a PAID order is a no-op). */
export async function fulfillOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new HttpError(404, "订单不存在");
    if (order.status === "PAID") return serializeOrder(order); // idempotent
    if (order.status === "CANCELLED" || order.status === "REFUNDED") throw new HttpError(400, "订单已取消或退款");

    const now = new Date();
    let note = "";

    if (order.kind === "SUBSCRIPTION" && order.plan) {
      const period = (order.period as BillingPeriod) ?? "MONTHLY";
      const days = PERIOD_DAYS[period] ?? 30;
      const existing = await tx.subscription.findUnique({ where: { workspaceId: order.workspaceId } });
      const activeSamePlan = existing && existing.plan === order.plan && existing.renewsAt && existing.renewsAt.getTime() > now.getTime();
      const base = activeSamePlan ? existing!.renewsAt!.getTime() : now.getTime();
      const renewsAt = new Date(base + days * DAY_MS);
      await tx.subscription.upsert({
        where: { workspaceId: order.workspaceId },
        update: { plan: order.plan, seats: order.seats, status: "active", renewsAt },
        create: { workspaceId: order.workspaceId, plan: order.plan, seats: order.seats, status: "active", renewsAt },
      });
      note = `已开通 ${PLAN_INFO[order.plan as PlanName].label}，有效期至 ${renewsAt.toISOString().slice(0, 10)}`;
    } else if (order.kind === "PACKAGE") {
      note = `已购买「${order.title}」，顾问团队将与你联系交付。`;
    }

    const updated = await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: now, note } });
    return serializeOrder(updated);
  });
}

export async function fulfillByOutTradeNo(no: string) {
  const order = await prisma.order.findUnique({ where: { outTradeNo: no } });
  if (!order) throw new HttpError(404, "订单不存在");
  return fulfillOrder(order.id);
}

export async function refundOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "订单不存在");
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "REFUNDED", note: (order.note ? order.note + " · " : "") + "已退款/取消" },
  });
  return serializeOrder(updated);
}

export async function listOrders(workspaceId: string) {
  const rows = await prisma.order.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 100 });
  return rows.map(serializeOrder);
}
