import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BillingPanel } from "@/components/BillingPanel";
import { requirePageUser } from "@/lib/page-auth";
import { prisma } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { listOrders } from "@/services/orders";
import { entitlementView } from "@/services/entitlements";

export const dynamic = "force-dynamic";

export default async function BillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requirePageUser(`/workspaces/${id}/billing`);
  let role = "VIEWER";
  try { const membership = await requireWorkspaceAccess(userId, id, "ADMIN"); role = membership.role; } catch { notFound(); }
  const [workspace, orders, entitlements] = await Promise.all([
    prisma.workspace.findUnique({ where: { id }, include: { subscription: true } }),
    listOrders(id),
    entitlementView(id),
  ]);
  if (!workspace) notFound();
  return <AppShell>
    <nav className="mb-5 flex items-center gap-2 text-sm text-slate-500"><Link href={`/workspaces/${id}`} className="hover:text-emerald-300">{workspace.name}</Link><span>/</span><span className="text-slate-300">订阅与支付</span></nav>
    <p className="text-sm text-emerald-300">订阅与支付</p>
    <h1 className="mt-1 text-3xl font-semibold">{workspace.name}</h1>
    <div className="mt-8"><BillingPanel workspaceId={id} subscription={JSON.parse(JSON.stringify(workspace.subscription))} orders={JSON.parse(JSON.stringify(orders))} entitlements={JSON.parse(JSON.stringify(entitlements))} isOwner={role === "OWNER"} /></div>
  </AppShell>;
}
