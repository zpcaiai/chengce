import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { planFromMetadata, seatsFromMetadata } from "@/lib/billing";
import { stripeClient } from "@/lib/stripe";

function workspaceIdOf(object: Stripe.Checkout.Session | Stripe.Subscription): string | null {
  return object.metadata?.workspaceId ?? null;
}
const periodEnd = (subscription: Stripe.Subscription) => subscription.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000);

export async function POST(req: Request) {
  const raw = await req.text(); const signature = req.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) return Response.json({ error: "Webhook is not configured" }, { status: 400 });
  let event: Stripe.Event;
  try { event = stripeClient().webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET); } catch { return Response.json({ error: "Invalid webhook signature" }, { status: 400 }); }
  if (await prisma.subscriptionEvent.findUnique({ where: { providerEventId: event.id } })) return Response.json({ received: true, duplicate: true });
  let workspaceId: string | null = null;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session; workspaceId = workspaceIdOf(session);
    if (workspaceId && session.subscription) { const subscription = await stripeClient().subscriptions.retrieve(String(session.subscription)); await prisma.subscription.upsert({ where: { workspaceId }, update: { stripeCustomerId: String(session.customer), stripeSubscriptionId: subscription.id, stripePriceId: subscription.items.data[0]?.price.id, status: subscription.status, plan: planFromMetadata(subscription.metadata), seats: seatsFromMetadata(subscription.metadata, subscription.items.data[0]?.quantity), renewsAt: new Date(periodEnd(subscription) * 1000) }, create: { workspaceId, stripeCustomerId: String(session.customer), stripeSubscriptionId: subscription.id, stripePriceId: subscription.items.data[0]?.price.id, status: subscription.status, plan: planFromMetadata(subscription.metadata), seats: seatsFromMetadata(subscription.metadata, subscription.items.data[0]?.quantity), renewsAt: new Date(periodEnd(subscription) * 1000) } }); }
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") { const subscription = event.data.object as Stripe.Subscription; workspaceId = workspaceIdOf(subscription); if (workspaceId) await prisma.subscription.updateMany({ where: { workspaceId }, data: { status: subscription.status, seats: Number(subscription.items.data[0]?.quantity ?? 1), renewsAt: new Date(periodEnd(subscription) * 1000) } }); }
  await prisma.subscriptionEvent.create({ data: { providerEventId: event.id, workspaceId, eventType: event.type, payload: JSON.parse(raw) } });
  return Response.json({ received: true });
}
