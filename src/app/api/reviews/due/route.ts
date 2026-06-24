import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route } from "@/lib/http";

export async function GET() { return route(async () => { const userId = await getUserId(); return prisma.systemAsset.findMany({ where: { reviewAt: { lte: new Date() }, status: "APPROVED", project: { workspace: { members: { some: { userId } } } } }, select: { id: true, title: true, reviewAt: true, project: { select: { id: true, name: true } } }, orderBy: { reviewAt: "asc" } }); }); }
