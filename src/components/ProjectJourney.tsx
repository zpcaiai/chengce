import { TRANSFER_METHOD } from "@/lib/guidance";

export function ProjectJourney({ evidence, capabilities, assets, actions }: { evidence: number; capabilities: number; assets: number; actions: number }) {
  const stage = evidence === 0 ? 0 : capabilities === 0 ? 1 : assets === 0 ? 2 : actions === 0 ? 3 : 4;
  const next = ["记录一次具体的创始人判断，或上传已有会议记录。", "运行诊断，确认哪些能力最依赖创始人。", "为最高风险能力生成并人工修订第一份规则。", "给第一项转移动作指定负责人和验证方式。", "在真实场景中使用手册，再记录反馈与例外。 "][stage];
  return <section className="card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-emerald-300">14 天能力转移路径</p><h2 className="mt-1 text-lg font-semibold">下一步：{next}</h2></div><span className="text-sm text-slate-500">第 {stage + 1} / 5 阶段</span></div><ol className="mt-5 grid gap-2 md:grid-cols-5">{TRANSFER_METHOD.map((item, index) => <li key={item.key} className={`rounded-xl border p-3 ${index === stage ? "border-emerald-500 bg-emerald-950/40" : index < stage ? "border-emerald-900 bg-slate-950/30" : "border-slate-800"}`}><p className="text-xs text-slate-500">{index + 1}</p><p className="mt-1 text-sm font-medium">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p></li>)}</ol></section>;
}
