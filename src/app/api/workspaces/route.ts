import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";

const slugify = (name: string) => `${name.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 7)}`;

export async function GET() {
  return route(async () => {
    const userId = await getUserId();
    return prisma.workspace.findMany({ where: { members: { some: { userId } } }, include: { _count: { select: { projects: true } } }, orderBy: { updatedAt: "desc" } });
  });
}

export async function POST(req: Request) {
  return route(async () => {
    const userId = await getUserId();
    const { name } = await parseBody(req, z.object({ name: z.string().min(2).max(80) }));
    const workspace = await prisma.workspace.create({ data: { name, slug: slugify(name), members: { create: { userId, role: "OWNER" } } } });
    return created({ workspace });
  });
}
