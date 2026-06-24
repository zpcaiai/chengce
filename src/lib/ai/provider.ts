// Provider-agnostic LLM access. Zero-dependency (uses fetch) so it runs on the
// edge or node. Switch via AI_PROVIDER = openai | anthropic | ollama | mock.

export interface CompleteParams {
  system: string;
  user: string;
  /** Ask the model to return strict JSON. */
  json?: boolean;
  responseSchema?: {
    name: string;
    schema: unknown;
  };
  temperature?: number;
}

export interface LLMProvider {
  readonly name: string;
  complete(params: CompleteParams): Promise<string>;
}

class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  constructor(private apiKey: string, private model: string) {}
  async complete({ system, user, json, responseSchema, temperature = 0.4 }: CompleteParams): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature,
        ...(responseSchema
          ? {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: responseSchema.name,
                  strict: true,
                  schema: responseSchema.schema,
                },
              },
            }
          : json
            ? { response_format: { type: "json_object" } }
            : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  constructor(private apiKey: string, private model: string) {}
  async complete({ system, user, responseSchema, temperature = 0.4 }: CompleteParams): Promise<string> {
    // Native structured output: when a schema is provided, force a single tool
    // whose input IS the schema — the model must emit valid JSON for it.
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 2048,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    };
    if (responseSchema) {
      body.tools = [{
        name: "emit_result",
        description: "Emit the final structured result.",
        input_schema: responseSchema.schema,
      }];
      body.tool_choice = { type: "tool", name: "emit_result" };
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (responseSchema) {
      const toolUse = (data.content ?? []).find((b: { type: string }) => b.type === "tool_use");
      if (toolUse?.input) return JSON.stringify(toolUse.input);
    }
    const text = (data.content ?? []).find((b: { type: string }) => b.type === "text");
    return text?.text ?? "";
  }
}

class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  constructor(private baseUrl: string, private model: string) {}
  async complete({ system, user, json, responseSchema, temperature = 0.4 }: CompleteParams): Promise<string> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        options: { temperature },
        // Ollama structured outputs: `format` accepts a JSON schema (or "json").
        ...(responseSchema ? { format: responseSchema.schema } : json ? { format: "json" } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.message?.content ?? "";
  }
}

/** Mock provider: returns the sentinel so agents fall back to their example output. */
class MockProvider implements LLMProvider {
  readonly name = "mock";
  async complete(): Promise<string> {
    return "__MOCK__";
  }
}

export const MOCK_SENTINEL = "__MOCK__";

let cached: LLMProvider | null = null;
export function getProvider(): LLMProvider {
  if (cached) return cached;
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    cached = new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL ?? "gpt-4o");
  } else if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    cached = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest");
  } else if (provider === "ollama") {
    cached = new OllamaProvider(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434", process.env.OLLAMA_MODEL ?? "llama3.1");
  } else {
    cached = new MockProvider();
  }
  return cached;
}
