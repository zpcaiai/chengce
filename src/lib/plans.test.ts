import { describe, it, expect } from "vitest";
import { hasPlanFeature, minPlanFor, planPrice, getServicePackage, SERVICE_PACKAGES, PLAN_MONTHLY } from "@/lib/plans";

describe("plan entitlements & pricing", () => {
  it("gates features by plan rank", () => {
    expect(hasPlanFeature("DIAGNOSTIC", "assessments")).toBe(true);
    expect(hasPlanFeature("DIAGNOSTIC", "simulations")).toBe(false);
    expect(hasPlanFeature("DELIVERY", "simulations")).toBe(true);
    expect(hasPlanFeature("CONTINUITY", "sso")).toBe(true);
    expect(hasPlanFeature("DELIVERY", "sso")).toBe(false);
  });

  it("resolves the minimum plan that unlocks a feature", () => {
    expect(minPlanFor("simulations")).toBe("DELIVERY");
    expect(minPlanFor("sso")).toBe("CONTINUITY");
    expect(minPlanFor("report")).toBe("DIAGNOSTIC");
  });

  it("prices subscription terms with period discounts and seat scaling", () => {
    expect(planPrice("DELIVERY", 1, "MONTHLY")).toBe(PLAN_MONTHLY.DELIVERY);
    expect(planPrice("DELIVERY", 1, "ANNUAL")).toBeLessThan(PLAN_MONTHLY.DELIVERY * 12);
    expect(planPrice("DELIVERY", 3, "MONTHLY")).toBe(PLAN_MONTHLY.DELIVERY * 3);
  });

  it("exposes one-time service packages", () => {
    expect(SERVICE_PACKAGES.length).toBeGreaterThan(0);
    expect(getServicePackage("deep-diagnosis")?.amount).toBeGreaterThan(0);
    expect(getServicePackage("does-not-exist")).toBeUndefined();
  });
});
