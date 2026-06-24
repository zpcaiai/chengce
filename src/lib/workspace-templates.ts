import type { AssetBody } from "@/domains/types";

export type WorkspaceTemplate = {
  id: string;
  category: string;
  name: string;
  description: string;
  tags: string[];
  project: {
    name: string;
    description: string;
    targetUser: string;
    mvpOutcome: string;
    successMetric: string;
  };
  evidence: { title: string; sourceName: string; content: string }[];
  capabilities: { name: string; description: string; riskIfLost: string; ownerName: string }[];
  assets: { kind: "DECISION_RULE" | "OPERATING_PRINCIPLE" | "PLAYBOOK"; title: string; ownerName: string; content: AssetBody }[];
  actions: { title: string; description: string; ownerName: string; status: "TODO" | "IN_PROGRESS" }[];
  experiment: { hypothesis: string; method: string; metric: string; ownerName: string };
};

type TemplateInput = Omit<WorkspaceTemplate, "evidence" | "capabilities" | "assets" | "actions" | "experiment"> & {
  evidence?: WorkspaceTemplate["evidence"];
  capabilities?: WorkspaceTemplate["capabilities"];
  assets?: WorkspaceTemplate["assets"];
  actions?: WorkspaceTemplate["actions"];
  experiment?: WorkspaceTemplate["experiment"];
};

const starterEvidence = (focus: string) => [{
  title: "模板启动假设（请替换为真实访谈或数据）",
  sourceName: "承策模板",
  content: `这是一个可编辑的起点，不是已经验证的事实。请在第一周补充至少 3 条真实证据：${focus}。记录原话、数据出处、发生场景与反例，再据此调整以下行动与规则。`,
}];

const capability = (name: string, description: string, riskIfLost: string) => ({ name, description, riskIfLost, ownerName: "待指定" });

const playbook = (title: string, purpose: string, trigger: string) => ({
  kind: "PLAYBOOK" as const,
  title,
  ownerName: "待指定",
  content: {
    purpose,
    whenToUse: trigger,
    owner: "待指定",
    trigger,
    steps: ["收集事实与上下文", "按模板完成一次处理", "记录结果、例外与下一步", "在周复盘中更新规则"],
    doneWhen: "结果、负责人和可复核证据均已记录。",
    exceptions: ["涉及高风险、合规或重大金额时，升级给负责人决策。"],
    examples: ["把本模板替换成你们最近一次真实案例。"],
  },
});

const template = (input: TemplateInput): WorkspaceTemplate => ({
  ...input,
  evidence: input.evidence ?? starterEvidence(input.project.targetUser),
  capabilities: input.capabilities ?? [capability("关键判断", "把关键经验转成团队可执行、可复核的步骤。", "负责人不在场时，团队无法稳定交付。")],
  assets: input.assets ?? [playbook("首个可执行手册", "将关键经验变为可重复执行的流程。", "每次遇到该类工作时")],
  actions: input.actions ?? [
    { title: "补充 3 条真实用户或业务证据", description: "替换模板假设，记录原话、数据出处与反例。", ownerName: "待指定", status: "IN_PROGRESS" },
    { title: "指定首个流程负责人", description: "明确谁执行、谁复核、何时升级。", ownerName: "待指定", status: "TODO" },
    { title: "完成一次真实场景演练", description: "用真实案例验证手册，并记录例外。", ownerName: "待指定", status: "TODO" },
  ],
  experiment: input.experiment ?? { hypothesis: "目标用户愿意用当前流程完成一次关键任务。", method: "找 5 个真实场景进行观察和回访。", metric: "完成率、耗时、阻塞原因与复用意愿", ownerName: "待指定" },
});

export const workspaceTemplates: WorkspaceTemplate[] = [
  template({
    id: "b2b-saas-growth", category: "B2B SaaS", name: "B2B SaaS 增长与客户交付", description: "把从获客、演示到上线与续费的关键经验做成可复制的团队系统。", tags: ["销售", "客户成功", "续费"],
    project: { name: "首批付费客户增长", description: "验证理想客户、首个价值闭环与可复制的交付动作。", targetUser: "有明确业务痛点、愿意试点的目标企业决策者与一线使用者", mvpOutcome: "让 3 个目标客户完成一次关键工作流，并愿意继续付费使用", successMetric: "每周有效商机数、试点激活率、首月续用意愿" },
    capabilities: [capability("商机资格判断", "区分真实付费痛点与礼貌性兴趣。", "团队把时间耗在低质量线索上。"), capability("客户上线交付", "让客户在首次使用中尽快得到可见结果。", "签约后价值迟迟无法落地，续费风险上升。")],
    assets: [playbook("B2B 发现访谈与商机资格手册", "统一发现访谈、资格判断和下一步承诺。", "收到新线索或进入销售发现阶段时")],
    actions: [{ title: "完成 5 次理想客户发现访谈", description: "只记录客户原话、现有替代方案、预算与决策链。", ownerName: "销售负责人", status: "IN_PROGRESS" }, { title: "为 1 个试点客户跑通上线", description: "记录从签约到首次价值的每一步和阻塞点。", ownerName: "客户成功负责人", status: "TODO" }, { title: "复盘试点是否形成付费证据", description: "以留存、使用行为和付费承诺判断，不用主观满意度替代。", ownerName: "创始人", status: "TODO" }],
    experiment: { hypothesis: "目标客户愿意为减少该流程中的人工和风险支付试点费用。", method: "用问题访谈后提出付费试点，比较不同价值主张。", metric: "有效访谈→试点转化率、首次价值时间、付费承诺", ownerName: "销售负责人" },
  }),
  template({
    id: "ai-product-discovery", category: "AI 产品", name: "AI 产品验证与发布", description: "从高频场景、可控 AI 输出到首批用户验证的一套启动工作区。", tags: ["AI", "MVP", "用户研究"],
    project: { name: "AI MVP 用户验证", description: "找到一个高频、高价值、可安全交付的 AI 工作流。", targetUser: "在明确工作流中反复花费时间、且愿意尝试新工具的一线专业用户", mvpOutcome: "让 5 位目标用户在真实任务中完成一次 AI 辅助交付", successMetric: "任务完成率、人工节省时间、关键错误率、再次使用意愿" },
    capabilities: [capability("场景与边界定义", "把模糊需求收束为可验证的单一任务。", "产品演示很惊艳，真实任务却不可用。"), capability("AI 输出安全评估", "识别高风险内容、人工复核点与失败兜底。", "错误输出伤害用户信任或带来业务风险。")],
    assets: [playbook("AI 真实任务测试手册", "在真实任务中测试 AI 的价值、安全性与人工介入点。", "每次邀请用户试用 MVP 时")],
    experiment: { hypothesis: "在人工可复核的条件下，AI 能将目标任务耗时降低 30% 以上。", method: "观察 5 位用户用旧方式和 MVP 各完成一次真实任务。", metric: "任务成功率、耗时、人工修正次数、再次使用意愿", ownerName: "产品负责人" },
  }),
  template({
    id: "consulting-delivery", category: "专业服务", name: "咨询与专业服务交付", description: "把专家型交付拆成可销售、可交付、可复盘的标准化服务。", tags: ["咨询", "项目交付", "客户价值"],
    project: { name: "标杆服务产品化", description: "将一次成功交付变成团队可复制的服务包。", targetUser: "有明确业务问题、需要专业外部支持并愿意为结果付费的客户负责人", mvpOutcome: "完成 1 个可复用的标杆项目，并沉淀客户可感知的结果证据", successMetric: "项目毛利、交付周期、客户推荐意愿、复购线索" },
    capabilities: [capability("需求诊断", "将客户问题转译为可交付范围与结果标准。", "范围不断漂移，项目难以盈利。"), capability("结果型复盘", "用可验证结果而非工时证明服务价值。", "客户只记得过程，不愿意续约或推荐。")],
    assets: [playbook("咨询项目启动与成果复盘手册", "对齐客户目标、边界、节奏与成果证据。", "新项目立项或里程碑复盘时")],
  }),
  template({
    id: "ecommerce-operations", category: "电商品牌", name: "电商品牌运营与复购", description: "围绕商品、内容、转化和复购搭建可验证的运营实验系统。", tags: ["电商", "内容", "复购"],
    project: { name: "核心品类增长实验", description: "验证一个商品主张和复购路径是否可持续。", targetUser: "有具体使用场景、愿意为产品价值持续购买的目标消费者", mvpOutcome: "让一组核心用户完成购买并出现可解释的复购或推荐行为", successMetric: "转化率、客单价、复购率、内容到成交归因" },
    capabilities: [capability("商品主张表达", "把用户痛点、产品差异与购买理由讲清楚。", "流量来了却不转化。"), capability("复购运营", "识别关键使用节点并安排有价值的触达。", "只依赖投放，老客价值流失。")],
    assets: [playbook("商品页与复购实验手册", "让每次内容和运营动作都对应一个用户假设。", "上新、改版商品页或发起复购活动时")],
  }),
  template({
    id: "manufacturing-supply-chain", category: "制造与供应链", name: "制造与供应链协同", description: "聚焦交期、质量、异常升级与跨部门协同的可执行模板。", tags: ["制造", "供应链", "质量"],
    project: { name: "关键订单交付稳定性", description: "降低关键订单在交付链路中的延期与质量风险。", targetUser: "需要稳定交期与质量保证的重点客户及内部交付团队", mvpOutcome: "让一个关键订单从排产到交付拥有可追踪的异常闭环", successMetric: "准时交付率、一次合格率、异常响应时间、返工成本" },
    capabilities: [capability("异常分级与升级", "在影响扩大前判定责任人和处理时限。", "问题被晚发现、晚升级，造成交期和质量损失。"), capability("关键订单协同", "让销售、计划、采购、生产使用同一交付事实。", "部门各自优化，客户承诺无法兑现。")],
    assets: [playbook("关键订单异常升级手册", "对交期、质量和供应风险进行分级、响应与复盘。", "发现可能影响关键订单的异常时")],
  }),
  template({
    id: "agency-client-delivery", category: "代理与内容服务", name: "品牌代理与内容交付", description: "让创意服务的客户协同、交付标准和复购机会不再只靠个人经验。", tags: ["代理", "内容", "客户管理"],
    project: { name: "标杆客户交付复制", description: "把一次优质服务沉淀为团队可使用的交付系统。", targetUser: "重视业务结果、需要持续内容或营销支持的品牌客户", mvpOutcome: "一个客户项目按统一节奏交付，并形成可展示的成果案例", successMetric: "准时交付率、返工轮次、客户续约意向、案例转介绍" },
    capabilities: [capability("客户需求澄清", "把模糊的创意反馈转为可判断的交付标准。", "反复返工，团队和客户都疲惫。"), capability("成果案例沉淀", "将交付过程与结果转化为可销售的案例资产。", "好项目做完即消失，无法带来新业务。")],
    assets: [playbook("客户项目启动与反馈手册", "建立目标、范围、评审节奏和变更控制。", "新客户启动或出现重大需求变更时")],
  }),
  template({
    id: "education-delivery", category: "教育与培训", name: "教育培训产品交付", description: "从招生承诺、学习体验到学习成果，建立可改进的教学服务闭环。", tags: ["教育", "培训", "学习成果"],
    project: { name: "核心课程成果验证", description: "验证课程能否帮助目标学员达成一个可观察的进步。", targetUser: "有明确学习或职业目标、愿意投入时间完成练习的学员", mvpOutcome: "让一班学员完成关键练习并展示可观察的学习成果", successMetric: "到课率、作业完成率、成果达成率、续报与转介绍" },
    capabilities: [capability("学习成果设计", "把课程内容转成可观察、可反馈的成果。", "学员感觉学了很多，却没有实际改变。"), capability("学习干预", "在掉队前识别风险并提供支持。", "中途流失高，教学质量难以持续改进。")],
    assets: [playbook("学习成果与风险学员跟进手册", "追踪学习证据，并对掉队风险做及时干预。", "每周教学复盘或发现学员连续缺席时")],
  }),
  template({
    id: "marketplace-operations", category: "平台与双边市场", name: "平台供需与服务质量", description: "用于撮合平台的供给激活、需求匹配和服务质量验证。", tags: ["平台", "供需匹配", "运营"],
    project: { name: "首个供需闭环", description: "在一个细分场景建立可重复的供需匹配与质量反馈。", targetUser: "在同一细分场景中有明确需求的一方与能稳定服务的供给方", mvpOutcome: "完成 10 次可复核的有效匹配，并记录双方结果", successMetric: "有效匹配率、履约率、复购率、供给方留存" },
    capabilities: [capability("供需匹配判断", "按场景、质量、时效和风险做匹配而非只看数量。", "低质量匹配消耗双方信任。"), capability("服务质量闭环", "将纠纷、取消和好评转为可运营的标准。", "平台规模增长但体验不断变差。")],
    assets: [playbook("供需匹配与质量复盘手册", "记录匹配依据、履约结果和需要调整的规则。", "每次完成关键匹配或发生服务异常时")],
  }),
  template({
    id: "property-operations", category: "地产与空间服务", name: "空间服务与物业运营", description: "用于租赁、物业或空间服务，聚焦客户体验、现场响应和续约。", tags: ["地产", "物业", "现场服务"],
    project: { name: "重点客户续约体验", description: "通过可见的服务改善，提高重点客户的续约与推荐。", targetUser: "对现场服务、响应时效与稳定性有明确期待的重点客户", mvpOutcome: "解决一个高频服务痛点并让重点客户确认改善", successMetric: "工单响应时效、问题一次解决率、满意度、续约意向" },
    capabilities: [capability("现场问题分流", "将报修、投诉和紧急事项按影响等级处理。", "重要问题被淹没在日常工单中。"), capability("客户续约沟通", "在续约前持续呈现服务成果和待改进项。", "只在合同到期时才发现客户不满意。")],
    assets: [playbook("重点客户现场服务与续约复盘手册", "让每次问题响应都成为信任和续约证据。", "重点客户出现服务需求、投诉或续约前 90 天")],
  }),
  template({
    id: "startup-founder-system", category: "创业公司", name: "创始人能力转移", description: "将创始人最关键的判断、客户经验与决策流程交给团队，而不是堆更多待办。", tags: ["创业", "组织能力", "决策"],
    project: { name: "创始人关键能力转移", description: "先选一个团队高度依赖创始人的场景，建立可复制的规则、负责人和验证证据。", targetUser: "需要独立承担关键客户、产品或运营判断的核心团队成员", mvpOutcome: "由团队成员在真实场景中独立完成一次关键判断，并获得可复核结果", successMetric: "团队独立完成率、升级次数、决策时效、结果质量" },
    capabilities: [capability("关键决策判断", "把创始人的判断依据、边界与升级条件写清楚。", "所有关键问题都回到创始人，组织无法放大。"), capability("案例复盘", "用真实结果校正规则，而不是用分数制造幻觉。", "团队重复犯错，经验无法积累。")],
    assets: [playbook("关键决策授权与复盘手册", "支持团队在边界内独立行动，并把例外沉淀为新规则。", "出现需要创始人判断的高频场景时")],
  }),
];

export function getWorkspaceTemplate(id: string) {
  return workspaceTemplates.find((item) => item.id === id);
}
