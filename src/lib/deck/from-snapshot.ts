import type { Deck, Slide } from "@/lib/deck/types";

// Turns a monthly report snapshot into a Deck, so the report and the PPT 工坊 share
// one theming + rendering pipeline instead of each maintaining its own pptxgenjs code.
export type SnapshotLike = {
  founderDependency: number; knowledgeCoverage: number; decisionConsistency: number;
  playbookAdoption: number; openRiskCount: number; replicationReadiness: number;
  resilience: number; globalManagement: number; summary: string; priorities: string[];
  createdAt: Date | string;
};

const pct = (n: number) => `${Math.round((n ?? 0) * 100)}%`;

export function deckFromSnapshot(snapshot: SnapshotLike, projectName: string): Deck {
  const dateStr = new Date(snapshot.createdAt).toLocaleDateString("zh-CN");
  const title = `${projectName} · 月度可复制报告`;
  const slides: Slide[] = [
    { layout: "cover", title, subtitle: snapshot.summary, note: `承策 · ${dateStr}` },
    { layout: "metrics", title: "可复制度核心指标", metrics: [
      { label: "可复制度", value: pct(snapshot.replicationReadiness) },
      { label: "创始人依赖", value: pct(snapshot.founderDependency) },
      { label: "抗脆弱韧性", value: pct(snapshot.resilience) },
      { label: "全局管理", value: pct(snapshot.globalManagement) },
    ] },
    { layout: "metrics", title: "知识与执行落地", metrics: [
      { label: "知识覆盖", value: pct(snapshot.knowledgeCoverage) },
      { label: "决策一致性", value: pct(snapshot.decisionConsistency) },
      { label: "手册落地", value: pct(snapshot.playbookAdoption) },
      { label: "未关闭高风险", value: String(snapshot.openRiskCount ?? 0) },
    ] },
  ];
  if (snapshot.priorities?.length) slides.push({ layout: "bullets", title: "下月优先", bullets: snapshot.priorities.slice(0, 6) });
  slides.push({ layout: "closing", title: "把判断变成可复制的系统", subtitle: projectName, note: `承策 · ${dateStr}` });
  return { title, themeId: "ink", scenario: "consulting-diagnosis", slides };
}
