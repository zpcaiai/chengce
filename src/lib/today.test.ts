import { describe, expect, it } from "vitest";
import { selectTodayAction, todayPlan } from "./today";

describe("today planner", () => {
  const base = { id: "a", title: "验证报价", description: "", projectId: "p", projectName: "项目", status: "TODO" };
  it("prefers an overdue action", () => {
    const picked = selectTodayAction([{ ...base, id: "later", dueAt: "2099-01-01" }, { ...base, id: "now", dueAt: "2020-01-01" }]);
    expect(picked?.id).toBe("now");
  });
  it("turns a task into a 5-minute minimum action", () => {
    expect(todayPlan({ ...base, dueAt: null }, 5, "LOW").instruction).toContain("最小可交付版本");
  });
});
