import { describe, expect, it } from "vitest";
import { projectReadiness } from "./project-readiness";

describe("project readiness", () => {
  it("keeps an unvalidated project from looking release-ready", () => {
    const readiness = projectReadiness({ targetUser: "", mvpOutcome: "", successMetric: "", evidenceCount: 4, approvedAssets: 1, actions: [{ ownerName: "Li", status: "DONE", proof: "demo" }], experiments: [], weeklyReviewCount: 1 });
    expect(readiness.percent).toBeLessThan(100);
    expect(readiness.checks.find((check) => check.label === "明确 MVP")?.done).toBe(false);
  });
});
