import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { hasPlanFeature, minPlanFor, PLAN_INFO, type PlanName } from "@/lib/plans";

/** Resolve a workspace's effective plan. When no subscription row exists we treat
 *  the workspace as fully enabled (self-host / pre-billing) — same graceful-degradation
 *  stance the rest of the app uses for unconfigured integrations. */
export async function activePlan(workspaceId: string): Promise<{ plan: PlanName | null; status: string }> {
  const sub = await prisma.subscription.findUnique({ where: { workspaceId }, select: { plan: true, status: true } });
  if (!sub) return { plan: null, status: "unconfigured" };
  return { plan: sub.plan as PlanName, status: sub.status };
}

export async function workspaceHasFeature(workspaceId: string, featureKey: string): Promise<boolean> {
  const { plan, status } = await activePlan(workspaceId);
  if (plan === null) return true; // fail-open when billing isn't configured
  if (status !== "active" && status !== "trial") return false;
  return hasPlanFeature(plan, featureKey);
}

/** Throw 402 if the workspace's active plan doesn't unlock the feature. */
export async function requireFeature(workspaceId: string, featureKey: string): Promise<void> {
  if (await workspaceHasFeature(workspaceId, featureKey)) return;
  const need = minPlanFor(featureKey);
  throw new HttpError(402, `该功能需要升级到「${PLAN_INFO[need].label}」`);
}

export interface EntitlementView {
  plan: PlanName | null;
  status: string;
  features: { key: string; enabled: boolean }[];
}

export async function entitlementView(workspaceId: string): Promise<EntitlementView> {
  const { plan, status } = await activePlan(workspaceId);
  const keys = ["assets", "simulations", "decisions", "semantic_search", "clients", "branded_portal", "sso"];
  const features = await Promise.all(
    keys.map(async (key) => ({ key, enabled: await workspaceHasFeature(workspaceId, key) })),
  );
  return { plan, status, features };
}
