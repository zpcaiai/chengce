// Agent base. An Agent = system prompt + zod input/output schema + example.
// `run()` validates input, calls the provider for strict JSON, and validates the
// output. The seam `orchestrate()` is where a LangGraph multi-step graph can wrap
// one or more agents (AGENT_ORCHESTRATOR=langgraph) without changing call sites.

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getProvider, MOCK_SENTINEL, type CompleteParams } from "./provider";
import { hardenDeep } from "./sanitize";

export interface AgentExample<I, O> {
  input: I;
  output: O;
}

export interface AgentSpec<I, O> {
  name: string;
  description: string;
  system: string;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  example: AgentExample<I, O>;
  /** Build the user prompt from validated input. */
  buildUserPrompt: (input: I) => string;
  temperature?: number;
}

export interface Agent<I, O> {
  readonly name: string;
  readonly spec: AgentSpec<I, O>;
  run(input: I): Promise<O>;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Agent returned non-JSON output");
  }
}

export function defineAgent<IS extends z.ZodTypeAny, OS extends z.ZodTypeAny>(spec: {
  name: string;
  description: string;
  system: string;
  inputSchema: IS;
  outputSchema: OS;
  example: { input: z.input<IS>; output: z.output<OS> };
  /** Build the user prompt from the PARSED input (defaults applied). */
  buildUserPrompt: (input: z.output<IS>) => string;
  temperature?: number;
}): Agent<z.input<IS>, z.output<OS>> {
  const responseSchema = zodToJsonSchema(spec.outputSchema, {
    name: `${spec.name}Output`,
    nameStrategy: "title",
    $refStrategy: "none",
    target: "openAi",
  });

  return {
    name: spec.name,
    spec: spec as unknown as AgentSpec<z.input<IS>, z.output<OS>>,
    async run(rawInput): Promise<z.output<OS>> {
      // Validate first, then harden every string field against prompt injection.
      const input = hardenDeep(spec.inputSchema.parse(rawInput)) as z.output<IS>;
      const provider = getProvider();
      const params: CompleteParams = {
        system: spec.system + "\n\nReturn ONLY a JSON object matching the agreed schema.",
        user: spec.buildUserPrompt(input),
        json: true,
        responseSchema: { name: `${spec.name}Output`, schema: responseSchema },
        temperature: spec.temperature ?? 0.4,
      };
      const raw = await provider.complete(params);
      // Mock provider → deterministic example output (lets the whole app run offline).
      if (raw === MOCK_SENTINEL) return spec.example.output as z.output<OS>;
      return spec.outputSchema.parse(extractJson(raw)) as z.output<OS>;
    },
  };
}

export type InferInput<A> = A extends Agent<infer I, unknown> ? I : never;
export type InferOutput<A> = A extends Agent<unknown, infer O> ? O : never;
