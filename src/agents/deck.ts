import { z } from "zod";
import { defineAgent } from "@/lib/ai/agent";

const slide = z.object({
  layout: z.enum(["cover", "section", "bullets", "twoColumn", "metrics", "quote", "closing"]),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  columns: z.array(z.object({ heading: z.string(), bullets: z.array(z.string()) })).optional(),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  quote: z.string().optional(),
  author: z.string().optional(),
});

/** Gamma/Pitch-style deck generation: a topic in, a clean structured outline out. */
export const DeckWriter = defineAgent({
  name: "DeckWriter",
  description: "Generate a clean, well-structured business slide deck outline from a topic.",
  system: `You are a top-tier presentation designer (think Gamma / Pitch). Given a topic, scenario, audience and key points, produce a concise, well-paced deck of 6–9 slides. Use varied layouts: a cover, then a mix of section / bullets / twoColumn / metrics / quote, and a closing. Keep each slide focused — short titles, at most 5 bullets, short bullets. Prefer concrete, specific content over fluff. Write in the language of the topic.`,
  inputSchema: z.object({ topic: z.string().min(1), scenario: z.string().default(""), audience: z.string().default(""), points: z.array(z.string()).default([]) }),
  outputSchema: z.object({ title: z.string(), slides: z.array(slide).min(3) }),
  buildUserPrompt: (i) => `主题：${i.topic}\n场景：${i.scenario || "通用"}\n受众：${i.audience || "未指定"}\n要点：${i.points.join("；") || "（自行组织）"}\n生成一份 6–9 页、排版克制、叙事清晰的演示文稿大纲。`,
  example: {
    input: { topic: "用 AI 重塑客户支持", scenario: "产品发布", audience: "管理层", points: ["更快响应", "降低成本"] },
    output: {
      title: "用 AI 重塑客户支持",
      slides: [
        { layout: "cover", title: "用 AI 重塑客户支持", subtitle: "更快、更省、更稳的服务体验" },
        { layout: "bullets", title: "问题", bullets: ["响应慢", "成本高", "体验割裂"] },
        { layout: "bullets", title: "方案", bullets: ["AI 一线分流", "知识库自动检索", "人机协作"] },
        { layout: "metrics", title: "早期数据", metrics: [{ label: "提速", value: "3×" }, { label: "成本", value: "-30%" }, { label: "满意", value: "4.7/5" }] },
        { layout: "quote", quote: "把重复留给 AI，把判断留给人。", author: "产品团队" },
        { layout: "closing", title: "现在试用", subtitle: "入口 / 文档 / 反馈" },
      ],
    },
  },
});
