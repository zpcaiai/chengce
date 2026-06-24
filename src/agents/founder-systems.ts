import { z } from "zod";
import { defineAgent } from "@/lib/ai/agent";

const score = z.number().min(0).max(1);
const evidence = z.object({ title: z.string(), content: z.string() });

export const FounderSystemsAnalyst = defineAgent({
  name: "FounderSystemsAnalyst",
  description: "Identifies transferable founder capabilities from evidence, never inventing facts.",
  system: `You are a rigorous organizational-systems analyst. Identify only patterns supported by the supplied evidence. Do not diagnose people. Every capability must name an exact evidence title and a short supporting quote. Prefer 3–7 high-leverage capabilities. Scores are estimates, not facts.`,
  inputSchema: z.object({ company: z.string(), evidence: z.array(evidence).min(1) }),
  outputSchema: z.object({
    summary: z.string(),
    capabilities: z.array(z.object({
      name: z.string(), description: z.string(), dependencyScore: score, repeatabilityScore: score,
      riskIfLost: z.string(), ownerName: z.string(), evidenceTitle: z.string(), quote: z.string(),
    })).min(1),
    actions: z.array(z.object({ title: z.string(), description: z.string(), ownerName: z.string() })).max(5),
  }),
  example: {
    input: { company: "Northstar", evidence: [{ title: "Founder interview", content: "I personally approve every enterprise proposal because I know the buyer objections." }] },
    output: {
      summary: "Enterprise proposal judgment is concentrated in the founder and should be made transferable first.",
      capabilities: [{ name: "Enterprise proposal qualification", description: "Separates high-fit proposals from costly custom work.", dependencyScore: 0.85, repeatabilityScore: 0.35, riskIfLost: "Pipeline quality and margin may deteriorate when the founder is unavailable.", ownerName: "Commercial lead", evidenceTitle: "Founder interview", quote: "I personally approve every enterprise proposal because I know the buyer objections." }],
      actions: [{ title: "Capture proposal qualification criteria", description: "Turn the founder's buyer-objection checks into a reviewed decision rule.", ownerName: "Commercial lead" }],
    },
  },
  buildUserPrompt: (input) => JSON.stringify(input),
});

export const SystemAssetAuthor = defineAgent({
  name: "SystemAssetAuthor",
  description: "Turns evidence-backed expertise into a reviewable organizational rule or playbook.",
  system: `You write concise, executable operating assets. Do not claim evidence that was not provided. Write steps that a capable colleague can follow. Flag exceptions rather than hiding uncertainty.`,
  inputSchema: z.object({ kind: z.enum(["DECISION_RULE", "OPERATING_PRINCIPLE", "PLAYBOOK"]), title: z.string(), capability: z.string(), evidence: z.array(evidence).min(1) }),
  outputSchema: z.object({
    purpose: z.string(), whenToUse: z.string(), owner: z.string(), trigger: z.string(), steps: z.array(z.string()).min(2),
    doneWhen: z.string(), exceptions: z.array(z.string()), examples: z.array(z.string()), citations: z.array(z.object({ evidenceTitle: z.string(), quote: z.string(), reason: z.string() })).min(1),
  }),
  example: {
    input: { kind: "DECISION_RULE", title: "Qualify enterprise proposals", capability: "Enterprise proposal qualification", evidence: [{ title: "Founder interview", content: "I personally approve every enterprise proposal because I know the buyer objections." }] },
    output: { purpose: "Protect margin and focus in enterprise proposals.", whenToUse: "Before committing solution design or pricing.", owner: "Commercial lead", trigger: "A prospect asks for a proposal.", steps: ["Document buyer problem, budget and decision process.", "Check standard-fit criteria and escalation risks.", "Escalate any custom commitment beyond the agreed boundary."], doneWhen: "A documented go/no-go and next owner exist.", exceptions: ["Strategic accounts may be escalated to the founder."], examples: ["A qualified buyer has a named problem owner and a defined budget."], citations: [{ evidenceTitle: "Founder interview", quote: "I personally approve every enterprise proposal", reason: "Shows the decision is founder-dependent today." }] },
  },
  buildUserPrompt: (input) => JSON.stringify(input),
});
