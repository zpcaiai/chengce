// Pure decision-retrospective computation. No prisma — unit-testable via mock provider.
import { DecisionRetrospectiveCoach } from "@/agents/decisions";

export interface DecisionInput {
  title: string;
  context: string;
  decision: string;
  rationale: string;
  reversibility: "LOW" | "MEDIUM" | "HIGH";
  expectedOutcome: string;
}

export interface RetrospectiveResult {
  summary: string;
  soundness: number;
  governanceScore: number;
  lessons: string[];
  suggestedRule: string;
  followUps: { title: string; ownerHint: string }[];
}

export async function computeRetrospective(company: string, decision: DecisionInput, outcome: string): Promise<RetrospectiveResult> {
  return DecisionRetrospectiveCoach.run({ company, decision, outcome });
}
