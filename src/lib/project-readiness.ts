// Outcome-first project readiness. Pure logic so the dashboard and workspace
// agree on what "ready to hand off" means without inventing a vanity score.

export interface ReadinessInput {
  targetUser: string;
  mvpOutcome: string;
  successMetric: string;
  evidenceCount: number;
  approvedAssets: number;
  actions: { ownerName: string; status: string; proof: string }[];
  experiments: { status: string }[];
  weeklyReviewCount: number;
}

export interface Readiness {
  percent: number;
  next: string;
  checks: { label: string; done: boolean; detail: string }[];
}

export function projectReadiness(input: ReadinessInput): Readiness {
  const owned = input.actions.length > 0 && input.actions.every((action) => action.ownerName.trim());
  const proven = input.actions.some((action) => action.status === "DONE" && action.proof.trim());
  const learned = input.experiments.some((experiment) => experiment.status === "LEARNED");
  const checks = [
    { label: "明确 MVP", done: Boolean(input.targetUser.trim() && input.mvpOutcome.trim() && input.successMetric.trim()), detail: "用户、结果与成功信号都已写清。" },
    { label: "证据基础", done: input.evidenceCount >= 3, detail: `${input.evidenceCount}/3 条可核查来源。` },
    { label: "验证实验", done: learned, detail: learned ? "至少一个实验已形成结论。" : "先验证一个关键假设。" },
    { label: "负责人", done: owned, detail: owned ? "每项行动都有负责人。" : "给每项行动指定负责人。" },
    { label: "真实证明", done: proven, detail: proven ? "已有一次带证明的交接完成。" : "完成一次真实交接并记录证明。" },
    { label: "组织资产", done: input.approvedAssets > 0, detail: `${input.approvedAssets} 个已批准规则或手册。` },
    { label: "每周学习", done: input.weeklyReviewCount > 0, detail: input.weeklyReviewCount ? "已记录本周复盘。" : "写下本周变化与下周重点。" },
  ];
  const firstOpen = checks.find((check) => !check.done);
  return { percent: Math.round((checks.filter((check) => check.done).length / checks.length) * 100), next: firstOpen?.detail ?? "准备度已达标，安排一次真实交接验收。", checks };
}
