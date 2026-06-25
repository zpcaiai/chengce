import PptxGenJS from "pptxgenjs";
import type { Deck, Slide, Theme } from "./types";
import { getTheme } from "./themes";

const W = 13.333, H = 7.5; // 16:9 widescreen, inches

export async function renderDeckPptx(deck: Deck): Promise<Buffer> {
  const t = getTheme(deck.themeId);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: W, height: H });
  pptx.layout = "WIDE";
  pptx.author = "承策 Chengce";
  pptx.title = deck.title;
  for (const s of deck.slides) renderSlide(pptx, s, t);
  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function titleBlock(slide: any, s: Slide, t: Theme) {
  slide.addText(s.title ?? "", { x: 0.9, y: 0.7, w: W - 1.8, h: 0.9, fontSize: 30, bold: true, color: t.text });
  slide.addShape("rect", { x: 0.95, y: 1.55, w: 1.1, h: 0.05, fill: { color: t.accent } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSlide(pptx: any, s: Slide, t: Theme) {
  const slide = pptx.addSlide();
  slide.background = { color: t.bg };
  if (s.layout === "cover") {
    slide.addShape("rect", { x: 0, y: 0, w: 0.22, h: H, fill: { color: t.accent } });
    if (s.note) slide.addText(s.note, { x: 0.95, y: 1.5, w: W - 1.9, h: 0.4, fontSize: 13, color: t.accent2, charSpacing: 2 });
    slide.addText(s.title ?? "", { x: 0.9, y: 2.4, w: W - 1.8, h: 1.8, fontSize: 46, bold: true, color: t.text });
    slide.addShape("rect", { x: 0.95, y: 4.25, w: 1.6, h: 0.06, fill: { color: t.accent } });
    if (s.subtitle) slide.addText(s.subtitle, { x: 0.95, y: 4.5, w: W - 1.9, h: 0.9, fontSize: 20, color: t.muted });
  } else if (s.layout === "section") {
    slide.background = { color: t.surface };
    slide.addText(s.title ?? "", { x: 0.9, y: 1.9, w: W - 1.8, h: 2.2, fontSize: 78, bold: true, color: t.accent });
    if (s.subtitle) slide.addText(s.subtitle, { x: 0.95, y: 4.3, w: W - 1.9, h: 1, fontSize: 26, color: t.text });
  } else if (s.layout === "bullets") {
    titleBlock(slide, s, t);
    const items = (s.bullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 18 }, color: t.text, fontSize: 18, paraSpaceAfter: 12 } }));
    if (items.length) slide.addText(items, { x: 0.95, y: 2.05, w: W - 2, h: H - 2.7, valign: "top" });
    if (s.subtitle) slide.addText(s.subtitle, { x: 0.95, y: H - 0.7, w: W - 2, h: 0.4, fontSize: 13, color: t.muted });
  } else if (s.layout === "twoColumn") {
    titleBlock(slide, s, t);
    const cols = (s.columns ?? []).slice(0, 2); const n = Math.max(cols.length, 1);
    const gap = 0.4; const cw = (W - 1.9 - gap * (n - 1)) / n;
    cols.forEach((c, i) => {
      const x = 0.95 + i * (cw + gap);
      slide.addShape("roundRect", { x, y: 2.05, w: cw, h: H - 2.8, fill: { color: t.surface }, rectRadius: 0.1, line: { type: "none" } });
      slide.addText(c.heading, { x: x + 0.3, y: 2.3, w: cw - 0.6, h: 0.5, fontSize: 18, bold: true, color: t.accent });
      const items = (c.bullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 16 }, color: t.text, fontSize: 15, paraSpaceAfter: 8 } }));
      if (items.length) slide.addText(items, { x: x + 0.3, y: 2.95, w: cw - 0.6, h: H - 3.8, valign: "top" });
    });
  } else if (s.layout === "metrics") {
    titleBlock(slide, s, t);
    const m = (s.metrics ?? []).slice(0, 4); const n = Math.max(m.length, 1);
    const gap = 0.35; const cw = (W - 1.9 - gap * (n - 1)) / n;
    m.forEach((mm, i) => {
      const x = 0.95 + i * (cw + gap);
      slide.addShape("roundRect", { x, y: 2.5, w: cw, h: 2.5, fill: { color: t.surface }, rectRadius: 0.12, line: { type: "none" } });
      slide.addText(mm.value, { x, y: 2.85, w: cw, h: 1.2, align: "center", fontSize: 40, bold: true, color: t.accent });
      slide.addText(mm.label, { x, y: 4.05, w: cw, h: 0.6, align: "center", fontSize: 15, color: t.muted });
    });
  } else if (s.layout === "quote") {
    slide.addText("“", { x: 0.7, y: 1.1, w: 2.5, h: 2, fontSize: 130, bold: true, color: t.accent });
    slide.addText(s.quote ?? "", { x: 1.6, y: 2.6, w: W - 3.2, h: 2.4, fontSize: 32, italic: true, bold: true, color: t.text, valign: "middle" });
    if (s.author) slide.addText(`— ${s.author}`, { x: 1.6, y: 5.1, w: W - 3.2, h: 0.6, fontSize: 16, color: t.muted });
  } else if (s.layout === "timeline") {
    titleBlock(slide, s, t);
    const steps = (s.steps ?? []).slice(0, 4); const n = Math.max(steps.length, 1);
    const gap = 0.4; const cw = (W - 1.9 - gap * (n - 1)) / n; const y = 3.0;
    slide.addShape("rect", { x: 1.15, y: y + 0.18, w: W - 2.3, h: 0.03, fill: { color: t.muted } });
    steps.forEach((st, i) => {
      const x = 0.95 + i * (cw + gap);
      slide.addShape("ellipse", { x: x + 0.2, y, w: 0.4, h: 0.4, fill: { color: t.accent } });
      slide.addText(st.label, { x, y: y + 0.6, w: cw, h: 0.5, fontSize: 16, bold: true, color: t.text });
      slide.addText(st.detail, { x, y: y + 1.1, w: cw, h: 1.2, fontSize: 13, color: t.muted });
    });
  } else { // closing
    slide.addText(s.title ?? "谢谢", { x: 1, y: 2.6, w: W - 2, h: 1.4, align: "center", fontSize: 46, bold: true, color: t.text });
    if (s.subtitle) slide.addText(s.subtitle, { x: 1, y: 4.15, w: W - 2, h: 0.9, align: "center", fontSize: 20, color: t.accent });
    if (s.note) slide.addText(s.note, { x: 1, y: H - 0.9, w: W - 2, h: 0.4, align: "center", fontSize: 13, color: t.muted });
  }
}
