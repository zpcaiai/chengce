import { describe, it, expect } from "vitest";
import { roleAtLeast, ROLE_RANK } from "@/lib/roles";

describe("workspace role hierarchy", () => {
  it("ranks roles in ascending authority", () => {
    expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK.ADMIN);
    expect(ROLE_RANK.ADMIN).toBeGreaterThan(ROLE_RANK.ADVISOR);
    expect(ROLE_RANK.ADVISOR).toBeGreaterThan(ROLE_RANK.MEMBER);
    expect(ROLE_RANK.MEMBER).toBeGreaterThan(ROLE_RANK.VIEWER);
  });
  it("roleAtLeast enforces the minimum threshold", () => {
    expect(roleAtLeast("OWNER", "ADVISOR")).toBe(true);
    expect(roleAtLeast("ADVISOR", "ADVISOR")).toBe(true);
    expect(roleAtLeast("MEMBER", "ADVISOR")).toBe(false);
    expect(roleAtLeast("VIEWER", "MEMBER")).toBe(false);
  });
});
