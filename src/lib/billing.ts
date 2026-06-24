// Pure helpers for mapping Stripe subscription metadata to our billing model.
// Kept prisma-free so the webhook's plan/seat logic is unit-testable.
export type BillingPlanName = "DIAGNOSTIC" | "DELIVERY" | "CONTINUITY";

const PLANS: BillingPlanName[] = ["DIAGNOSTIC", "DELIVERY", "CONTINUITY"];

export function planFromMetadata(meta: Record<string, string | undefined | null> | undefined, fallback: BillingPlanName = "CONTINUITY"): BillingPlanName {
  const value = String(meta?.plan ?? "").toUpperCase() as BillingPlanName;
  return PLANS.includes(value) ? value : fallback;
}

export function seatsFromMetadata(meta: Record<string, string | undefined | null> | undefined, quantity?: number | null, fallback = 1): number {
  const raw = Number(meta?.seats ?? quantity ?? fallback);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}
