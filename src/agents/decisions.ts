import { z } from "zod";
import { defineAgent } from "@/lib/ai/agent";
import { ANALYST_TONE, score } from "@/agents/shared";

/* ──────────────────────────── Decision-governance retrospective ────────────────────────────
 * A team logs a real decision (context, the call, rationale, reversibility, expected outcome);
 * later they record what actually happened and run this retrospective. It separates decision
 * QUALITY (was the process sound given the information at the time) from OUTCOME (which includes
 * luck), scores governance, and proposes a reusable decision rule when a pattern is clear. */
export const DecisionRetrospectiveCoach = defineAgent({
  name: "DecisionRetrospectiveCoach",
  description: "Run a structured retrospective on a team decision, separating decision quality from outcome luck.",
  system: `${ANALYST_TONE} Review the decision PROCESS, not the person. Judge soundness by the information available at the time, not only by the outcome — a good process can have a bad outcome and vice versa. Score soundness and overall governance quality in [0,1]. Extract concrete lessons. If a repeatable pattern is evident, propose one reusable decision rule (else leave it empty). Suggest a few follow-ups with an owner hint.`,
  inputSchema: z.object({
    company: z.string(),
    decision: z.object({
      title: z.string(),
      context: z.string().default(""),
      decision: z.string().default(""),
      rationale: z.string().default(""),
      reversibility: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
      expectedOutcome: z.string().default(""),
    }),
    outcome: z.string().default(""),
  }),
  outputSchema: z.object({
    summary: z.string(),
    soundness: score,
    governanceScore: score,
    lessons: z.array(z.string()).min(1),
    suggestedRule: z.string(),
    followUps: z.array(z.object({ title: z.string(), ownerHint: z.string() })),
  }),
  buildUserPrompt: (i) =>
    `Company: ${i.company}\nDecision: ${i.decision.title}\nContext: ${i.decision.context || "(none)"}\nThe call: ${i.decision.decision || "(none)"}\nRationale: ${i.decision.rationale || "(none)"}\nReversibility: ${i.decision.reversibility}\nExpected: ${i.decision.expectedOutcome || "(none)"}\nWhat actually happened: ${i.outcome || "(not yet known)"}\nRun the retrospective: separate decision quality from outcome, score soundness and governance, extract lessons, propose a reusable rule if warranted, and list follow-ups.`,
  example: {
    input: {
      company: "Northstar",
      decision: { title: "接下一个大客户的定制需求", context: "对方预算高但要求大量定制", decision: "接了，并承诺 3 个月交付", rationale: "看重 logo 与现金流", reversibility: "LOW", expectedOutcome: "树立标杆客户" },
      outcome: "定制拖累了路线图两个季度，毛利低于预期",
    },
    output: {
      summary: "决策结果不佳，但更关键的是流程缺陷：在不可逆承诺前没有用既定标准评估偏离主线的风险。",
      soundness: 0.4,
      governanceScore: 0.45,
      lessons: ["不可逆的大额定制承诺应先过“是否偏离主线”的硬标准", "logo 与现金流不足以抵消路线图被绑架的代价"],
      suggestedRule: "当定制需求要求不可逆承诺且偏离核心路线图时，默认拒绝，除非由创始人按既定标准例外批准。",
      followUps: [{ title: "把大客户定制评估标准写成决策规则", ownerHint: "商务负责人" }],
    },
  },
});
