import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { route, parseBody } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { searchEvidence } from "@/services/search";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id);
    const { query } = await parseBody(req, z.object({ query: z.string().min(1).max(300) }));
    return await searchEvidence(id, query);
  });
}
