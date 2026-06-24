// Pure digital-twin computation: run the simulator agent over a baseline scoreboard.
// No prisma here, so it is unit-testable against the mock AI provider.
import { OrgTwinSimulator } from "@/agents/simulation";

export interface SimulationBaseline {
  metrics: { label: string; value: number }[];
  dependencies: string[];
  capabilities: string[];
}

export interface SimulationResult {
  prediction: string;
  effects: { dimension: string; direction: "UP" | "DOWN" | "FLAT"; magnitude: number; rationale: string }[];
  risks: string[];
  recommendations: string[];
  accuracy: number;
}

export async function computeSimulation(company: string, baseline: SimulationBaseline, scenario: string): Promise<SimulationResult> {
  return OrgTwinSimulator.run({ company, baseline, scenario });
}
