import { describe, expect, it } from "vitest";
import { getWorkspaceTemplate, workspaceTemplates } from "@/lib/workspace-templates";

describe("workspace templates", () => {
  it("offers a usable starting system for every template", () => {
    expect(workspaceTemplates.length).toBeGreaterThanOrEqual(10);
    for (const template of workspaceTemplates) {
      expect(template.project.targetUser).not.toHaveLength(0);
      expect(template.project.mvpOutcome).not.toHaveLength(0);
      expect(template.evidence.length).toBeGreaterThan(0);
      expect(template.capabilities.length).toBeGreaterThan(0);
      expect(template.assets.length).toBeGreaterThan(0);
      expect(template.actions.length).toBeGreaterThan(0);
      expect(template.experiment.hypothesis).not.toHaveLength(0);
    }
  });

  it("finds templates by their stable id", () => {
    expect(getWorkspaceTemplate("b2b-saas-growth")?.name).toContain("SaaS");
    expect(getWorkspaceTemplate("missing")).toBeUndefined();
  });
});
