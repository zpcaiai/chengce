import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";

/** Local checkout is intentional: swap this handler for a signed Stripe/WeChat/Alipay webhook in production. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return route(async () => { const userId = await getUserId(); const { id } = await params; await requireWorkspaceAccess(userId, id, "ADMIN"); return prisma.subscription.findUnique({ where: { workspaceId: id } }); }); }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { return route(async () => { const userId = await getUserId(); const { id: workspaceId } = await params; await requireWorkspaceAccess(userId, workspaceId, "OWNER"); const body = await parseBody(req, z.object({ plan: z.enum(["DIAGNOSTIC", "DELIVERY", "CONTINUITY"]), seats: z.number().int().min(1).max(500) })); return { subscription: await prisma.subscription.upsert({ where: { workspaceId }, update: { ...body, status: "active", renewsAt: new Date(Date.now() + 30 * 864e5) }, create: { workspaceId, ...body, status: "active", renewsAt: new Date(Date.now() + 30 * 864e5) } }), checkoutMode: "local" }; }); }
