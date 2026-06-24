"use client";
import { useState } from "react";

const questions = [
  ["关键胜利", "哪三个结果最能代表公司做对了什么？当时你做了哪些不显而易见的判断？"],
  ["关键失败", "哪些失败代价最大？后来你建立了什么判断标准来避免重演？"],
  ["客户洞察", "你比团队更早看见哪些客户信号？怎样判断一个客户值得投入？"],
  ["招聘与授权", "什么样的人能在这里成功？哪些事情你仍然不愿授权，为什么？"],
  ["产品与危机", "遇到重大产品取舍或危机时，你优先保护什么、舍弃什么？"],
] as const;

export function StructuredInterviewForm({ projectId, save }: { projectId: string; save: (key: string, url: string, method?: string, payload?: unknown) => Promise<unknown> }) {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill("")); const [sourceName, setSource] = useState("创始人");
  async function submit(event: React.FormEvent) { event.preventDefault(); const content = questions.map(([topic, question], index) => `## ${topic}\n问题：${question}\n回答：${answers[index] || "未回答"}`).join("\n\n"); const result = await save("interview", `/api/projects/${projectId}/evidence`, "POST", { kind: "INTERVIEW", title: `结构化访谈 · ${new Date().toLocaleDateString("zh-CN")}`, sourceName, content }); if (result) setAnswers(Array(questions.length).fill("")); }
  return <details className="card" open><summary className="cursor-pointer font-medium">使用结构化访谈向导</summary><form onSubmit={submit} className="mt-4 space-y-4"><input value={sourceName} onChange={(e) => setSource(e.target.value)} placeholder="受访者姓名或角色"/>{questions.map(([topic, question], index) => <label key={topic} className="block"><span className="label">{topic} · {question}</span><textarea value={answers[index]} onChange={(e) => setAnswers((all) => all.map((item, i) => i === index ? e.target.value : item))} rows={3} placeholder="记录原话、场景和具体判断，不要写概括性结论。"/></label>)}<button className="button-primary">保存为可溯源访谈</button></form></details>;
}
