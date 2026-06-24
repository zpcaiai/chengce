import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route, HttpError } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { stripeClient } from "@/lib/stripe";

export async function POST(req: Request) { return route(async () => { const userId = await getUserId(); const { workspaceId } = await parseBody(req, z.object({ workspaceId: z.string().cuid() })); await requireWorkspaceAccess(userId, workspaceId, "OWNER"); const sub = await prisma.subscription.findUnique({ where: { workspaceId } }); if (!sub?.stripeCustomerId) throw new HttpError(400, "No Stripe subscription found"); const session = await stripeClient().billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${new URL(req.url).origin}/workspaces/${workspaceId}` }); return { url: session.url }; }); }
