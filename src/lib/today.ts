export type TimeBox = 5 | 25 | 60;
export type Energy = "LOW" | "MEDIUM" | "HIGH";

export interface TodayAction {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: string;
  projectId: string;
  projectName: string;
}

export function selectTodayAction(actions: TodayAction[]): TodayAction | null {
  const active = actions.filter((action) => action.status !== "DONE" && action.status !== "BLOCKED");
  return [...active].sort((a, b) => {
    const overdue = (value: TodayAction) => value.dueAt && new Date(value.dueAt).getTime() <= Date.now() ? 0 : 1;
    return overdue(a) - overdue(b) || Number(a.status !== "IN_PROGRESS") - Number(b.status !== "IN_PROGRESS") || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
  })[0] ?? null;
}

export function todayPlan(action: TodayAction | null, minutes: TimeBox, energy: Energy) {
  if (!action) return {
    title: "先建立一个可验证的下一步",
    instruction: "进入项目，记录一条证据或新建一项有负责人的行动。今天只需要让系统拥有一个真实起点。",
    outcome: "得到一条可执行、可复盘的项目行动。",
  };
  const prefix = energy === "LOW" ? "只做最小可交付版本" : energy === "HIGH" ? "完成需要判断的核心部分" : "推进到一个可验证节点";
  const instruction = minutes === 5
    ? `${prefix}：打开「${action.title}」，写下完成证明、一个阻塞点或下一步，而不是开始新任务。`
    : minutes === 25
      ? `${prefix}：专注处理「${action.title}」，结束时记录证据或将它拆成下一项明确行动。`
      : `${prefix}：完成「${action.title}」的一次完整交接/演练，并留下可由他人复核的证明。`;
  return { title: action.title, instruction, outcome: `${action.projectName} 将获得一条真实推进记录。` };
}
