export type SlideLayout = "cover" | "section" | "bullets" | "twoColumn" | "metrics" | "quote" | "timeline" | "closing";

export interface SlideMetric { label: string; value: string }
export interface SlideColumn { heading: string; bullets: string[] }
export interface SlideStep { label: string; detail: string }

export interface Slide {
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  columns?: SlideColumn[];
  metrics?: SlideMetric[];
  quote?: string;
  author?: string;
  steps?: SlideStep[];
  note?: string;
}

/** Colors are hex WITHOUT the leading # (pptxgenjs format); the CSS layer prepends #. */
export interface Theme {
  id: string;
  name: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
}

export interface Deck {
  title: string;
  themeId: string;
  scenario: string;
  slides: Slide[];
}

export const DECK_CATEGORIES = [
  "融资路演", "销售提案", "经营管理", "产品发布", "战略规划",
  "HR与组织", "咨询交付", "教育培训", "市场品牌", "项目汇报",
  "客户成功", "技术架构", "创业初期", "年度总结", "其他",
] as const;

export type DeckCategory = typeof DECK_CATEGORIES[number];

export interface DeckTemplate {
  id: string;
  name: string;
  scenario: string;
  category: DeckCategory;
  description: string;
  themeId: string;
  slides: Slide[];
}
