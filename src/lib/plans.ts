// Plan catalog, entitlements and pricing for chengce. Pure + string-based so it is
// safe to import from client components (no Prisma). The three plans ARE the tiers —
// we deliberately reuse the existing workspace BillingPlan instead of introducing a
// second, conflicting membership-tier system.

export type PlanName = "DIAGNOSTIC" | "DELIVERY" | "CONTINUITY";
export type BillingPeriod = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export const PLAN_RANK: Record<PlanName, number> = { DIAGNOSTIC: 0, DELIVERY: 1, CONTINUITY: 2 };
export const PLANS: PlanName[] = ["DIAGNOSTIC", "DELIVERY", "CONTINUITY"];

export interface PlanInfo { plan: PlanName; label: string; tagline: string; features: string[] }

export const PLAN_INFO: Record<PlanName, PlanInfo> = {
  DIAGNOSTIC: {
    plan: "DIAGNOSTIC", label: "诊断版", tagline: "看清创始人依赖与组织风险。",
    features: ["证据采集与关键能力萃取", "五项组织诊断（关键人/杠杆/健康/治理/协作）", "一键完整诊断 + 月度报告", "PPT 工坊与导出"],
  },
  DELIVERY: {
    plan: "DELIVERY", label: "交付版", tagline: "把判断变成可执行的系统。",
    features: ["诊断版全部能力", "系统资产/SOP 与审批闭环", "组织数字孪生模拟", "决策治理与团队复盘", "语义检索与引用校验", "多客户/CRM 档案"],
  },
  CONTINUITY: {
    plan: "CONTINUITY", label: "持续版", tagline: "规模化、品牌化、企业级。",
    features: ["交付版全部能力", "品牌化客户门户", "SSO / SCIM 企业接入", "定时重诊断与通知", "优先支持"],
  },
};

// feature key -> minimum plan rank required.
export const FEATURES: Record<string, number> = {
  evidence: 0, capabilities: 0, assessments: 0, full_diagnosis: 0, report: 0, decks: 0,
  assets: 1, simulations: 1, decisions: 1, experiments: 1, semantic_search: 1, citations: 1, clients: 1,
  branded_portal: 2, sso: 2, scheduled_rediagnosis: 2,
};

export function hasPlanFeature(plan: PlanName, featureKey: string): boolean {
  const need = FEATURES[featureKey] ?? 0;
  return PLAN_RANK[plan] >= need;
}

/** Lowest plan that unlocks a feature (for upgrade prompts). */
export function minPlanFor(featureKey: string): PlanName {
  const need = FEATURES[featureKey] ?? 0;
  return PLANS.find((p) => PLAN_RANK[p] >= need) ?? "CONTINUITY";
}

// ── Pricing (¥ / seat / month) ─────────────────────────────────────────────
export const PLAN_MONTHLY: Record<PlanName, number> = { DIAGNOSTIC: 99, DELIVERY: 299, CONTINUITY: 699 };
export const PERIODS: Record<BillingPeriod, { months: number; discount: number; label: string }> = {
  MONTHLY: { months: 1, discount: 1, label: "按月" },
  QUARTERLY: { months: 3, discount: 0.9, label: "按季（9 折）" },
  ANNUAL: { months: 12, discount: 0.8, label: "按年（8 折）" },
};
export const PERIOD_DAYS: Record<BillingPeriod, number> = { MONTHLY: 30, QUARTERLY: 90, ANNUAL: 365 };

/** Total order price for a subscription term, rounded to whole ¥. */
export function planPrice(plan: PlanName, seats: number, period: BillingPeriod): number {
  const seatCount = Math.max(1, Math.floor(seats || 1));
  const { months, discount } = PERIODS[period];
  return Math.round(PLAN_MONTHLY[plan] * seatCount * months * discount);
}

// ── One-time service packages (sold as PACKAGE orders) ─────────────────────
export interface ServicePackage { id: string; name: string; description: string; amount: number }
export const SERVICE_PACKAGES: ServicePackage[] = [
  { id: "deep-diagnosis", name: "单次深度诊断", description: "由资深顾问主导的一次性全维组织诊断与解读。", amount: 1999 },
  { id: "custom-report", name: "定制月度报告", description: "为董事会/投资人定制的深度月度可复制报告。", amount: 999 },
  { id: "template-pack", name: "行业模板包", description: "针对你所在行业的 SOP 与诊断模板合集。", amount: 599 },
  { id: "onboarding", name: "落地陪跑（一期）", description: "四周交付陪跑：把诊断结论变成上线的系统资产。", amount: 4999 },
];

export function getServicePackage(id: string): ServicePackage | undefined {
  return SERVICE_PACKAGES.find((p) => p.id === id);
}
