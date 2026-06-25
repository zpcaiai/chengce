import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PrintButton } from "@/components/PrintButton";

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await prisma.reportShare.findUnique({ where: { token }, include: { snapshot: { include: { project: { include: { workspace: { select: { name: true, brandName: true, brandLogoUrl: true, brandColor: true } } } } } } } });
  if (!share || share.revokedAt || (share.expiresAt && share.expiresAt < new Date())) notFound();
  const report = share.snapshot;
  const ws = report.project.workspace;
  const brand = ws.brandName || ws.name;
  const accent = ws.brandColor || "#34d399";
  return <main className="mx-auto min-h-screen max-w-3xl bg-slate-950 px-6 py-12 text-slate-100 print:bg-white print:text-slate-950"><div className="mb-10 flex items-center justify-between border-b border-slate-800 pb-5 print:border-slate-300"><div>{ws.brandLogoUrl ? <img src={ws.brandLogoUrl} alt={brand} className="h-8 w-auto"/> : <p className="text-sm font-medium" style={{ color: accent }}>{brand}</p>}<h1 className="mt-1 text-2xl font-semibold">{report.project.name} · 月度复制报告</h1><p className="mt-1 text-sm text-slate-400">{brand} · {report.createdAt.toLocaleDateString("zh-CN")}</p></div><PrintButton /></div><p className="text-lg leading-8">{report.summary}</p><div className="mt-8 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5 print:border-emerald-300"><p className="text-xs text-slate-500">创始人可复制度</p><p className="mt-1 text-4xl font-semibold" style={{ color: accent }}>{Math.round(report.replicationReadiness * 100)}%</p></div><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5"><Metric label="创始人依赖" value={report.founderDependency}/><Metric label="抗脆弱韧性" value={report.resilience}/><Metric label="知识覆盖" value={report.knowledgeCoverage}/><Metric label="决策一致性" value={report.decisionConsistency}/><Metric label="手册落地" value={report.playbookAdoption}/></div><section className="mt-10"><h2 className="text-lg font-semibold">下月优先事项</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-300 print:text-slate-700">{report.priorities.map((priority) => <li key={priority}>{priority}</li>)}</ol><p className="mt-6 text-sm text-slate-500">开放高风险能力：{report.openRiskCount} 项</p></section></main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-800 p-3 print:border-slate-300"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{Math.round(value * 100)}%</p></div>; }
