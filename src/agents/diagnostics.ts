import { z } from "zod";
import { defineAgent } from "@/lib/ai/agent";
import { ANALYST_TONE, score, diagnosticInput, scoredDimension } from "@/agents/shared";

/* ──────────────────────────── STRESS_TEST — key-person dependency ────────────────────────────
 * The spec's core diagnostic: how badly does the company break if a key person disappears?
 * Healthy-framed resilience dimensions (higher = more anti-fragile) + an explicit dependency map. */
export const KeyPersonStressTest = defineAgent({
  name: "KeyPersonStressTest",
  description: "Stress-test the company for founder/key-person dependency and map fragility.",
  system: `${ANALYST_TONE} Score resilience dimensions where 1 = anti-fragile and 0 = single point of failure: founderIndependence, keyPersonCoverage, customerDiversification, knowledgeDistribution, productDiversification, operationalRedundancy. Also map concrete dependency areas (0..1, higher = more concentrated). End with a one-line "what breaks first" scenario.`,
  inputSchema: diagnosticInput,
  outputSchema: z.object({
    summary: z.string(),
    dimensions: z.array(scoredDimension).min(1),
    dependencyMap: z.array(z.object({ area: z.string(), dependency: score, evidenceTitle: z.string(), quote: z.string() })).min(1),
    scenario: z.string(),
    recommendations: z.array(z.string()).min(1),
  }),
  buildUserPrompt: (i) => `Company: ${i.company}\nEvidence:\n${i.evidence.map((e) => `# ${e.title}\n${e.content}`).join("\n\n")}\nStress-test resilience, map key-person dependency, and name what breaks first.`,
  example: {
    input: { company: "Northstar", evidence: [{ title: "创始人访谈", content: "所有大客户的报价我都亲自拍板，关键架构也只有我和一个工程师懂。" }] },
    output: {
      summary: "成功仍高度集中在创始人与单一工程师，关键决策与核心知识缺乏第二责任人。",
      dimensions: [
        { key: "founderIndependence", label: "创始人独立度", score: 0.25, finding: "大客户报价全部由创始人拍板。", evidenceTitle: "创始人访谈", quote: "所有大客户的报价我都亲自拍板" },
        { key: "knowledgeDistribution", label: "知识分布度", score: 0.3, finding: "核心架构仅两人掌握，无文档化。", evidenceTitle: "创始人访谈", quote: "关键架构也只有我和一个工程师懂" },
        { key: "keyPersonCoverage", label: "关键人备份", score: 0.3, finding: "关键岗位无交叉备份。", evidenceTitle: "创始人访谈", quote: "只有我和一个工程师懂" },
      ],
      dependencyMap: [
        { area: "大客户定价决策", dependency: 0.9, evidenceTitle: "创始人访谈", quote: "报价我都亲自拍板" },
        { area: "核心系统架构知识", dependency: 0.8, evidenceTitle: "创始人访谈", quote: "只有我和一个工程师懂" },
      ],
      scenario: "若该工程师离开，核心系统迭代将停滞约 6 周。",
      recommendations: ["把定价拍板拆成可复用的决策规则并指定第二责任人", "对核心架构做结对文档化并设置备份负责人"],
    },
  },
});

/* ──────────────────────────── LEVERAGE — management leverage (Grove) ──────────────────────────── */
export const OrgLeverageAnalyst = defineAgent({
  name: "OrgLeverageAnalyst",
  description: "Classify management time into low/medium/high leverage and prescribe a shift.",
  system: `${ANALYST_TONE} From the evidence, classify how management time is spent as LOW / MEDIUM / HIGH leverage, estimate the time share at each tier (the three shares should sum to ~1), and prescribe how to move time toward high-leverage work. Cite evidence for each classified activity.`,
  inputSchema: diagnosticInput,
  outputSchema: z.object({
    summary: z.string(),
    classified: z.array(z.object({ activity: z.string(), tier: z.enum(["LOW", "MEDIUM", "HIGH"]), evidenceTitle: z.string(), quote: z.string() })).min(1),
    shares: z.object({ low: score, medium: score, high: score }),
    recommendations: z.array(z.string()).min(1),
  }),
  buildUserPrompt: (i) => `Company: ${i.company}\nEvidence:\n${i.evidence.map((e) => `# ${e.title}\n${e.content}`).join("\n\n")}\nClassify management time by leverage, estimate the time shares, and prescribe a shift to high leverage.`,
  example: {
    input: { company: "Northstar", evidence: [{ title: "周会记录", content: "管理者大部分时间在开状态会和审批，几乎没有时间做架构和培养骨干。" }] },
    output: {
      summary: "管理时间集中在低杠杆的状态会与审批，高杠杆的骨干培养被挤出。",
      classified: [
        { activity: "状态会议与审批", tier: "LOW", evidenceTitle: "周会记录", quote: "大部分时间在开状态会和审批" },
        { activity: "架构与骨干培养", tier: "HIGH", evidenceTitle: "周会记录", quote: "几乎没有时间做架构和培养骨干" },
      ],
      shares: { low: 0.7, medium: 0.15, high: 0.15 },
      recommendations: ["把一半状态会改为异步看板", "每周固定 3 小时投入架构决策与骨干培养"],
    },
  },
});

/* ──────────────────────────── DECISION_GOVERNANCE ──────────────────────────── */
export const DecisionGovernanceAnalyst = defineAgent({
  name: "DecisionGovernanceAnalyst",
  description: "Assess organizational decision governance and prescribe upgrades.",
  system: `${ANALYST_TONE} Score five decision-governance dimensions (keys: quality, consistency, speed, ownership, learning) where higher = healthier, each with an evidence-cited finding, then prescribe governance upgrades.`,
  inputSchema: diagnosticInput,
  outputSchema: z.object({
    summary: z.string(),
    dimensions: z.array(scoredDimension).min(1),
    recommendations: z.array(z.string()).min(1),
  }),
  buildUserPrompt: (i) => `Company: ${i.company}\nEvidence:\n${i.evidence.map((e) => `# ${e.title}\n${e.content}`).join("\n\n")}\nScore decision governance (quality, consistency, speed, ownership, learning) and prescribe upgrades.`,
  example: {
    input: { company: "Northstar", evidence: [{ title: "复盘记录", content: "重大决策反复被推翻，没有明确负责人，决策记录也没有沉淀。" }] },
    output: {
      summary: "决策缺乏单一负责人且被反复重开，拖慢组织节奏。",
      dimensions: [
        { key: "ownership", label: "决策归属", score: 0.3, finding: "重大决策无明确负责人。", evidenceTitle: "复盘记录", quote: "没有明确负责人" },
        { key: "consistency", label: "决策一致性", score: 0.3, finding: "决策被反复推翻。", evidenceTitle: "复盘记录", quote: "重大决策反复被推翻" },
        { key: "learning", label: "决策学习", score: 0.35, finding: "决策与理由未沉淀。", evidenceTitle: "复盘记录", quote: "决策记录也没有沉淀" },
      ],
      recommendations: ["每个决策指定唯一负责人（DRI）", "用统一决策日志记录决策与理由"],
    },
  },
});

/* ──────────────────────────── ORG_HEALTH ──────────────────────────── */
export const OrgHealthAnalyst = defineAgent({
  name: "OrgHealthAnalyst",
  description: "Measure organizational health across trust, communication, execution, ownership, learning, collaboration.",
  system: `${ANALYST_TONE} Score six organizational-health dimensions (keys: trust, communication, execution, ownership, learning, collaboration) where higher = healthier, each evidence-cited, then prescribe the highest-leverage interventions.`,
  inputSchema: diagnosticInput,
  outputSchema: z.object({
    summary: z.string(),
    dimensions: z.array(scoredDimension).min(1),
    recommendations: z.array(z.string()).min(1),
  }),
  buildUserPrompt: (i) => `Company: ${i.company}\nEvidence:\n${i.evidence.map((e) => `# ${e.title}\n${e.content}`).join("\n\n")}\nScore organizational health (trust, communication, execution, ownership, learning, collaboration) and prescribe interventions.`,
  example: {
    input: { company: "Northstar", evidence: [{ title: "团队访谈", content: "团队之间信息互相囤积，出问题后倾向互相指责。" }] },
    output: {
      summary: "信息囤积与失败后的指责文化在侵蚀信任与协作。",
      dimensions: [
        { key: "trust", label: "信任", score: 0.3, finding: "失败后互相指责。", evidenceTitle: "团队访谈", quote: "出问题后倾向互相指责" },
        { key: "communication", label: "沟通", score: 0.35, finding: "信息被囤积。", evidenceTitle: "团队访谈", quote: "信息互相囤积" },
        { key: "collaboration", label: "协作", score: 0.4, finding: "跨团队默认不共享。", evidenceTitle: "团队访谈", quote: "信息互相囤积" },
      ],
      recommendations: ["推行无指责复盘", "默认信息开放共享"],
    },
  },
});

/* ──────────────────────────── COLLABORATION ──────────────────────────── */
export const CollaborationAnalyst = defineAgent({
  name: "CollaborationAnalyst",
  description: "Diagnose team collaboration quality and prescribe upgrades.",
  system: `${ANALYST_TONE} Score collaboration dimensions (e.g. psychological safety, decision clarity, role clarity, conflict quality, knowledge sharing, cross-functional flow) where higher = healthier, each evidence-cited, then prescribe upgrades.`,
  inputSchema: diagnosticInput,
  outputSchema: z.object({
    summary: z.string(),
    dimensions: z.array(scoredDimension).min(1),
    recommendations: z.array(z.string()).min(1),
  }),
  buildUserPrompt: (i) => `Company: ${i.company}\nEvidence:\n${i.evidence.map((e) => `# ${e.title}\n${e.content}`).join("\n\n")}\nScore collaboration dimensions and prescribe upgrades.`,
  example: {
    input: { company: "Northstar", evidence: [{ title: "观察笔记", content: "会上没人提出异议，分歧都留到会后私下抱怨。" }] },
    output: {
      summary: "冲突被回避，分歧在会后地下化，削弱决策质量。",
      dimensions: [
        { key: "conflictQuality", label: "冲突质量", score: 0.35, finding: "会上回避异议。", evidenceTitle: "观察笔记", quote: "会上没人提出异议" },
        { key: "psychologicalSafety", label: "心理安全", score: 0.4, finding: "异议只在会后私下出现。", evidenceTitle: "观察笔记", quote: "分歧都留到会后私下抱怨" },
      ],
      recommendations: ["引入书面“反对并执行”机制", "在决策会上明确征求异议"],
    },
  },
});
