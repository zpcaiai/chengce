import { z } from "zod";

/** Shared tone for every chengce diagnostic agent. Organization-level, evidence-only,
 *  never a diagnosis of a person. Ported in spirit from the founder-systems analyst. */
export const ANALYST_TONE =
  "You are a rigorous organizational-systems analyst inside chengce, a founder-replication workbench. " +
  "Work at the level of systems, decisions and capabilities — never diagnose individuals. " +
  "Use only patterns supported by the supplied evidence; never invent facts. " +
  "Every scored finding must name an exact evidence title and a short supporting quote. " +
  "Scores are estimates in [0,1], not facts. Be specific, observable and falsifiable. No motivational language.";

export const score = z.number().min(0).max(1);

/** A single piece of project evidence handed to an agent. */
export const evidenceItem = z.object({ title: z.string(), content: z.string() });

/** Standard agent input: the company name plus its evidence base. */
export const diagnosticInput = z.object({
  company: z.string(),
  evidence: z.array(evidenceItem).min(1),
});

/** A scored, evidence-cited dimension — the common unit the UI renders. */
export const scoredDimension = z.object({
  key: z.string(),
  label: z.string(),
  /** [0,1], higher = healthier. */
  score,
  finding: z.string(),
  evidenceTitle: z.string(),
  quote: z.string(),
});

export type ScoredDimension = z.infer<typeof scoredDimension>;
