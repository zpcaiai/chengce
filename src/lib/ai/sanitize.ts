// Prompt-injection hardening shared by the coach and all agents.
// Strategy: user data is DATA — strip characters/markup commonly used to forge
// roles or break prompt structure, and cap lengths so no field can flood the
// context window.

const ROLE_TAG = /<\/?(system|assistant|developer|instructions?)[^>]*>/gi;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function hardenText(text: string, limit = 4000): string {
  return text.replace(CONTROL, "").replace(ROLE_TAG, "").trim().slice(0, limit);
}

/** Recursively harden every string in a (validated) agent input object. */
export function hardenDeep<T>(value: T, limit = 4000): T {
  if (typeof value === "string") return hardenText(value, limit) as T;
  if (Array.isArray(value)) return value.map((v) => hardenDeep(v, limit)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = hardenDeep(v, limit);
    return out as T;
  }
  return value;
}
