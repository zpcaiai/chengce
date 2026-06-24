import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, parseBody } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { runSimulation } from "@/services/simulation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id);
    const simulations = await prisma.simulation.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" }, take: 20 });
    return { simulations };
  });
}

const body = z.object({ scenario: z.string().min(4, "请描述一个情景").max(500) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id, "ADVISOR");
    const { scenario } = await parseBody(req, body);
    const simulation = await runSimulation(id, scenario, userId);
    return created({ simulation });
  });
}
