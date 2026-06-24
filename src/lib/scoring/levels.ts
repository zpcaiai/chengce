// Maturity model & leverage tiers. Client-safe (no Prisma), Chinese-facing labels.
export type ManagementLevel =
  | "SUPERVISOR"
  | "MANAGER"
  | "DIRECTOR"
  | "LEADER"
  | "VISIONARY"
  | "SYSTEM_ARCHITECT"
  | "ORG_DESIGNER";

export interface LevelInfo {
  level: ManagementLevel;
  n: number;
  focus: string;
  question: string;
}

export const MATURITY: LevelInfo[] = [
  { level: "SUPERVISOR", n: 1, focus: "行为", question: "事情做了吗？" },
  { level: "MANAGER", n: 2, focus: "流程", question: "流程被遵守了吗？" },
  { level: "DIRECTOR", n: 3, focus: "能力", question: "团队能独立胜任吗？" },
  { level: "LEADER", n: 4, focus: "身份", question: "我们正在成为谁？" },
  { level: "VISIONARY", n: 5, focus: "使命", question: "我们为何存在？" },
  { level: "SYSTEM_ARCHITECT", n: 6, focus: "系统", question: "如何把成功规模化？" },
  { level: "ORG_DESIGNER", n: 7, focus: "文化", question: "如何复制卓越？" },
];

export const LEVERAGE_EXAMPLES: Record<"LOW" | "MEDIUM" | "HIGH", string[]> = {
  LOW: ["状态会议", "审批", "检查报告"],
  MEDIUM: ["培训", "文档化", "招聘"],
  HIGH: ["培养骨干", "架构决策", "知识系统", "运营原则"],
};

export const FIRST_PRINCIPLES = [
  "管理是系统设计，不是控制人。",
  "知识工作者要被对齐，而不是被监督。",
  "使命对齐比行为控制产生更大杠杆。",
  "知识必须沉淀为组织资产。",
  "高杠杆活动比活动数量更重要。",
  "组织必须变得反脆弱。",
];
