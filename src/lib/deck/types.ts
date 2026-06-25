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

export interface DeckTemplate {
  id: string;
  name: string;
  scenario: string;
  description: string;
  themeId: string;
  slides: Slide[];
}
