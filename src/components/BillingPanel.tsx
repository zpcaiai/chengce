"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_INFO, PLANS, PERIODS, planPrice, SERVICE_PACKAGES, type PlanName, type BillingPeriod } from "@/lib/plans";

type Order = { id: string; kind: string; title: string; amount: number; currency: string; status: string; provider: string; createdAt: string; note: string };
type Sub = { plan: string; seats: number; status: string; renewsAt: string | null } | null;
type Ent = { plan: string | null; status: string; features: { key: string; enabled: boolean }[] };

const PROVIDERS: { id: "mock" | "alipay" | "wechat"; label: string }[] = [
  { id: "alipay", label: "支付宝" }, { id: "wechat", label: "微信支付" }, { id: "mock", label: "本地（演示）" },
];
const STATUS: Record<string, { label: string; tone: string }> = {
  CREATED: { label: "待支付", tone: "text-amber-300" }, PAID: { label: "已支付", tone: "text-emerald-300" },
  CANCELLED: { label: "已取消", tone: "text-slate-400" }, REFUNDED: { label: "已退款", tone: "text-rose-300" },
};
const FEATURE_LABEL: Record<string, string> = { assets: "系统资产", simulations: "数字孪生", decisions: "决策治理", semantic_search: "语义检索", clients: "客户/CRM", branded_portal: "品牌门户", sso: "SSO/SCIM" };

export function BillingPanel({ workspaceId, subscription, orders, entitlements, isOwner }: { workspaceId: string; subscription: Sub; orders: Order[]; entitlements: Ent; isOwner: boolean }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanName>((subscription?.plan as PlanName) ?? "DELIVERY");
  const [seats, setSeats] = useState(subscription?.seats ?? 3);
  const [period, setPeriod] = useState<BillingPeriod>("ANNUAL");
  const [provider, setProvider] = useState<"mock" | "alipay" | "wechat">("alipay");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const price = planPrice(plan, seats, period);

  async function api(url: string, payload?: unknown) {
    const res = await fetch(url, { method: "POST", headers: payload ? { "content-type": "application/json" } : undefined, body: payload ? JSON.stringify(payload) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "操作失败");
    return data;
  }

  async function order(payload: Record<string, unknown>, key: string) {
    setBusy(key); setNotice("");
    try {
      const { order } = await api("/api/orders", payload);
      if (provider === "mock") { await api(`/api/orders/${order.id}/pay`, {}); setNotice("已开通（演示支付）。"); }
      else { setNotice(`订单已创建（${order.outTradeNo}）。请在${provider === "alipay" ? "支付宝" : "微信"}完成支付，回调成功后自动开通。`); }
      router.refresh();
    } catch (e) { setNotice(e instanceof Error ? e.message : "操作失败"); } finally { setBusy(""); }
  }

  async function refund(id: string) {
    if (!confirm("确认退款/取消该订单？")) return;
    setBusy(`r-${id}`); setNotice("");
    try { await api(`/api/orders/${id}/refund`, {}); router.refresh(); } catch (e) { setNotice(e instanceof Error ? e.message : "操作失败"); } finally { setBusy(""); }
  }

  return <div className="space-y-7">
    {notice && <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

    <section className="card">
      <h2 className="text-lg font-semibold">当前方案与权益</h2>
      {subscription ? <p className="mt-1 text-sm text-slate-400">{PLAN_INFO[subscription.plan as PlanName]?.label ?? subscription.plan} · {subscription.seats} 席 · {subscription.status}{subscription.renewsAt ? ` · 续费至 ${new Date(subscription.renewsAt).toLocaleDateString("zh-CN")}` : ""}</p>
        : <p className="mt-1 text-sm text-slate-400">尚未订阅（当前按未配置计费处理，功能全开）。</p>}
      <div className="mt-3 flex flex-wrap gap-2">{entitlements.features.map((f) => <span key={f.key} className={`rounded-full border px-2.5 py-1 text-xs ${f.enabled ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-slate-800 text-slate-500"}`}>{f.enabled ? "✓" : "锁"} {FEATURE_LABEL[f.key] ?? f.key}</span>)}</div>
    </section>

    {isOwner && <section className="card">
      <h2 className="text-lg font-semibold">升级 / 续费（支付宝 · 微信）</h2>
      <p className="mt-1 text-sm text-slate-400">面向中国大陆的真实收款通道；下单后由支付回调自动开通。未配置网关时可用「本地（演示）」直接开通。</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PLANS.map((p) => <button key={p} type="button" onClick={() => setPlan(p)} className={`rounded-xl border p-4 text-left ${plan === p ? "border-emerald-600 bg-emerald-950/30" : "border-slate-800 hover:border-slate-700"}`}>
          <p className="font-semibold">{PLAN_INFO[p].label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{PLAN_INFO[p].tagline}</p>
          <p className="mt-2 text-sm text-emerald-300">¥{planPrice(p, seats, period)} <span className="text-xs text-slate-500">/ {PERIODS[period].label}</span></p>
        </button>)}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-400">席位<input className="mt-1 block max-w-24" type="number" min={1} max={500} value={seats} onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))} /></label>
        <label className="text-sm text-slate-400">周期<select className="mt-1 block" value={period} onChange={(e) => setPeriod(e.target.value as BillingPeriod)}>{(Object.keys(PERIODS) as BillingPeriod[]).map((k) => <option key={k} value={k}>{PERIODS[k].label}</option>)}</select></label>
        <label className="text-sm text-slate-400">支付方式<select className="mt-1 block" value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}>{PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <div className="ml-auto text-right"><p className="text-2xl font-semibold text-emerald-300">¥{price}</p><p className="text-xs text-slate-500">{PLAN_INFO[plan].label} · {seats} 席 · {PERIODS[period].label}</p></div>
      </div>
      <button className="button-primary mt-4" disabled={busy === "sub"} onClick={() => order({ kind: "SUBSCRIPTION", workspaceId, plan, seats, period, provider }, "sub")}>{busy === "sub" ? "下单中…" : `下单 ¥${price}`}</button>
    </section>}

    {isOwner && <section className="card">
      <h2 className="text-lg font-semibold">服务包（一次性）</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{SERVICE_PACKAGES.map((pkg) => <div key={pkg.id} className="rounded-xl border border-slate-800 p-4">
        <div className="flex items-start justify-between gap-2"><p className="font-semibold">{pkg.name}</p><span className="text-emerald-300">¥{pkg.amount}</span></div>
        <p className="mt-1 text-xs text-slate-500">{pkg.description}</p>
        <button className="button-secondary mt-3" disabled={busy === `p-${pkg.id}`} onClick={() => order({ kind: "PACKAGE", workspaceId, packageId: pkg.id, provider }, `p-${pkg.id}`)}>{busy === `p-${pkg.id}` ? "下单中…" : "购买"}</button>
      </div>)}</div>
    </section>}

    <section className="card">
      <h2 className="text-lg font-semibold">订单记录</h2>
      {orders.length ? <div className="mt-3 divide-y divide-slate-800">{orders.map((o) => { const st = STATUS[o.status] ?? { label: o.status, tone: "text-slate-400" }; return <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div><p className="font-medium">{o.title}</p><p className="text-xs text-slate-500">{o.kind === "SUBSCRIPTION" ? "订阅" : "服务包"} · {o.provider} · {new Date(o.createdAt).toLocaleDateString("zh-CN")}{o.note ? ` · ${o.note}` : ""}</p></div>
        <div className="flex items-center gap-3"><span className="text-sm text-slate-300">¥{o.amount}</span><span className={`text-xs ${st.tone}`}>{st.label}</span>{isOwner && o.status === "PAID" && <button className="text-xs text-rose-300 hover:underline" disabled={busy === `r-${o.id}`} onClick={() => refund(o.id)}>退款</button>}</div>
      </div>; })}</div> : <p className="mt-3 rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">还没有订单。</p>}
    </section>
  </div>;
}
