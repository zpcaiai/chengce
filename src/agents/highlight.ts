import { z } from "zod";
import { defineAgent } from "@/lib/ai/agent";
import { ANALYST_TONE } from "@/agents/shared";

/** Surfaces the "key judgment moments" buried in a long interview or document so the
 *  user doesn't have to read everything to find what's worth modeling. */
export const InterviewHighlighter = defineAgent({
  name: "InterviewHighlighter",
  description: "Extract key judgment moments from a founder interview or document.",
  system: `${ANALYST_TONE} From the supplied evidence text, surface 3–7 "key judgment moments" — places where a non-obvious judgment, standard, threshold or decision rule was applied. For each, quote the exact supporting text, explain why it matters for replication, and suggest a transferable capability or rule name. Use only the supplied text; do not invent.`,
  inputSchema: z.object({ title: z.string(), content: z.string().min(1) }),
  outputSchema: z.object({
    highlights: z.array(z.object({ quote: z.string(), why: z.string(), suggestion: z.string() })).min(1),
  }),
  buildUserPrompt: (i) => `证据「${i.title}」：\n${i.content}\n\n抽取关键判断时刻。`,
  example: {
    input: { title: "创始人访谈", content: "只要需要超过两周的定制开发，必须先验证年度合同额、可复用性和决策链条。" },
    output: {
      highlights: [{
        quote: "超过两周的定制开发，必须先验证年度合同额、可复用性和决策链条。",
        why: "这是创始人对大客户定制的隐性准入门槛，直接决定毛利与产品节奏。",
        suggestion: "大客户定制评估规则",
      }],
    },
  },
});
