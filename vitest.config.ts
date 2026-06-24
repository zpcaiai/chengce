import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Force the offline mock AI provider so agent-backed tests are deterministic.
    env: { AI_PROVIDER: "mock" },
  },
});
