import { AppShell } from "@/components/AppShell";
import { WorkspaceTemplateLauncher } from "@/components/WorkspaceTemplateLauncher";
import { requirePageUser } from "@/lib/page-auth";
import { workspaceTemplates } from "@/lib/workspace-templates";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  await requirePageUser("/setup");
  return <AppShell><div className="max-w-6xl"><p className="text-sm text-emerald-300">承策模板工作台</p><h1 className="mt-2 text-3xl font-semibold">不要从空白开始，先选一套能跑起来的业务系统。</h1><p className="mt-3 max-w-3xl text-slate-400">每个模板已经预置一个业务目标、行动、实验、证据占位与可编辑手册。先用它跑真实业务，再把内容改成你自己的事实、负责人和规则。</p><div className="mt-8"><WorkspaceTemplateLauncher templates={workspaceTemplates}/></div></div></AppShell>;
}
