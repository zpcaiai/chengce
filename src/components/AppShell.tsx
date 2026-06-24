import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">
    <header className="border-b border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/dashboard" className="flex items-baseline gap-2"><span className="text-xl font-semibold tracking-tight text-emerald-300">承策</span><span className="text-xs text-slate-500">Chengce · Founder Transfer System</span></Link>
        <nav aria-label="主导航" className="flex items-center gap-1 sm:gap-4"><Link href="/today" className="text-sm text-emerald-200 hover:text-emerald-300">今天行动</Link><Link href="/setup" className="text-sm text-slate-300 hover:text-emerald-300">选择模板</Link><Link href="/dashboard" className="text-sm text-slate-400 hover:text-emerald-300">深度探索</Link><Link href="/guide" className="hidden text-sm text-slate-500 hover:text-emerald-300 md:block">方法</Link><LogoutButton/></nav>
      </div>
    </header>
    <main className="mx-auto w-full max-w-7xl px-5 py-8">{children}</main>
  </div>;
}
