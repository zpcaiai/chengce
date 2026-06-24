/** Product knowledge: deliberately practical, non-diagnostic operating guidance. */
export const TRANSFER_METHOD = [
  { key: "evidence", title: "先抓事实，不先写制度", detail: "从一次具体胜利、失误或危机开始。记录原话、情境、判断和结果；AI 的作用是整理，而不是替你编造经验。" },
  { key: "map", title: "只转移真正的关键判断", detail: "优先处理：创始人不在场就变慢、变差或变贵的判断。不要把所有工作都做成流程。" },
  { key: "codify", title: "规则要允许例外", detail: "好规则包含触发条件、负责人、步骤、升级路径和例外。它让团队做出一致判断，而不是机械服从。" },
  { key: "practice", title: "通过演练完成交接", detail: "文档完成不等于能力完成。负责人至少要在真实场景中独立应用，再用结果和反馈修订规则。" },
  { key: "review", title: "用复审保持组织记忆", detail: "业务变化后，过期规则比没有规则更危险。复审并记录例外，组织能力才会积累。" },
] as const;

export const DESIGN_PARTNER_PROTOCOL = {
  outcome: "14 天内形成一份可验证的《创始人可复制蓝图》，并让至少一位负责人完成一次真实能力交接。",
  roles: ["创始人：提供高价值判断的原始情境与最终标准", "负责人：在真实场景中应用规则并报告例外", "顾问/运营负责人：保证证据、行动和复审节奏", "只读客户：查看报告，不接触工作区原始资料"],
  success: ["每项关键能力有至少一条可核查证据", "每项资产有所有者、例外、复审日期和审批记录", "至少一个行动有真实完成证明", "月报能明确指出下一项应降低的依赖"],
} as const;
