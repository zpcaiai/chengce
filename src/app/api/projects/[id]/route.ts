import { getUserId } from "@/lib/auth";
import { route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    const { project } = await requireProjectAccess(userId, id);
    return project;
  });
}
