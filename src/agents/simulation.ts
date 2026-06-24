import { z } from "zod";
import { defineAgent } from "@/lib/ai/agent";
import { ANALYST_TONE, score } from "@/agents/shared";

/* ──────────────────────────── Organizational digital twin ────────────────────────────
 * Given the project's current scoreboard (a snapshot of the replication metrics, top
 * capabilities and dependency areas), simulate a scenario and predict its effect on the
 * organization — always with an explicit accuracy caveat. This is a decision aid, not a
 * forecast. */
export const OrgTwinSimulator = defineAgent({
  name: "OrgTwinSimulator",
  description: "Simulate how a scenario would move the organization's replication metrics, with an honest accuracy caveat.",
  system: `${ANALYST_TONE} You operate an organizational digital twin. Given the current scoreboard and a scenario, predict the directional effect on each relevant metric (UP = healthier, DOWN = worse, FLAT = little change) with a magnitude in [0,1], name the key risks and the highest-leverage moves to de-risk it, and give an honest accuracy score in [0,1] (lower when the baseline is thin or the scenario is far from current evidence). Never present a simulation as a guaranteed outcome.`,
  inputSchema: z.object({
    company: z.string(),
    baseline: z.object({
      metrics: z.array(z.object({ label: z.string(), value: score })),
      dependencies: z.array(z.string()).default([]),
      capabilities: z.array(z.string()).default([]),
    }),
    scenario: z.string(),
  }),
  outputSchema: z.object({
    prediction: z.string(),
    effects: z.array(z.object({ dimension: z.string(), direction: z.enum(["UP", "DOWN", "FLAT"]), magnitude: score, rationale: z.string() })).min(1),
    risks: z.array(z.string()).min(1),
    recommendations: z.array(z.string()).min(1),
    accuracy: score,
  }),
  buildUserPrompt: (i) =>
    `Company: ${i.company}\nCurrent scoreboard:\n${i.baseline.metrics.map((m) => `- ${m.label}: ${Math.round(m.value * 100)}%`).join("\n")}\nTop dependencies: ${i.baseline.dependencies.join("; ") || "(none recorded)"}\nKey capabilities: ${i.baseline.capabilities.join("; ") || "(none recorded)"}\nScenario: ${i.scenario}\nSimulate the effect on the replication metrics, list risks and de-risking moves, and give an accuracy caveat.`,
  example: {
    input: {
      company: "Northstar",
      baseline: { metrics: [{ label: "可复制度", value: 0.42 }, { label: "创始人依赖", value: 0.8 }, { label: "抗脆弱韧性", value: 0.45 }], dependencies: ["大客户定价决策"], capabilities: ["高触达客户成功"] },
      scenario: "创始人在 6 个月内退出日常运营",
    },
    output: {
      prediction: "若不先把定价决策授权下去，短期决策速度会下降，但只要先交接关键判断，6 个月后可复制度与韧性会明显改善。",
      effects: [
        { dimension: "决策速度", direction: "DOWN", magnitude: 0.3, rationale: "定价仍集中在创始人，授权未完成前会变慢。" },
        { dimension: "可复制度", direction: "UP", magnitude: 0.35, rationale: "被迫把隐性判断显性化为规则。" },
        { dimension: "抗脆弱韧性", direction: "UP", magnitude: 0.3, rationale: "关键决策不再单点。" },
      ],
      risks: ["若未先授权定价，管道质量与毛利在过渡期下滑", "关键客户关系随创始人流失"],
      recommendations: ["先把定价拍板编码为决策规则并指定 DRI", "对前 10 大客户做关系交接演练"],
      accuracy: 0.5,
    },
  },
});
