import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route, HttpError } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { priceForPlan, stripeClient } from "@/lib/stripe";

export async function POST(req: Request) {
  return route(async () => {
    const userId = await getUserId(); const body = await parseBody(req, z.object({ workspaceId: z.string().cuid(), plan: z.enum(["DIAGNOSTIC", "DELIVERY", "CONTINUITY"]), seats: z.number().int().min(1).max(500) }));
    await requireWorkspaceAccess(userId, body.workspaceId, "OWNER");
    const workspace = await prisma.workspace.findUnique({ where: { id: body.workspaceId }, include: { subscription: true } });
    if (!workspace) throw new HttpError(404, "Workspace not found");
    const stripe = stripeClient(); const price = priceForPlan(body.plan);
    let customerId = workspace.subscription?.stripeCustomerId;
    if (!customerId) { const customer = await stripe.customers.create({ name: workspace.name, metadata: { workspaceId: workspace.id } }); customerId = customer.id; }
    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({ mode: "subscription", customer: customerId, line_items: [{ price, quantity: body.seats }], success_url: `${origin}/workspaces/${workspace.id}?checkout=success`, cancel_url: `${origin}/workspaces/${workspace.id}?checkout=cancelled`, subscription_data: { metadata: { workspaceId: workspace.id, plan: body.plan, seats: String(body.seats) } }, metadata: { workspaceId: workspace.id, plan: body.plan, seats: String(body.seats) } });
    return { url: session.url };
  });
}
