// CJK-capable report PDF via pdfkit, which embeds and subsets TrueType/OpenType
// fonts reliably (including CJK). Bundles a Noto Sans SC subset; override with
// REPORT_FONT_PATH. Falls back to Helvetica (ASCII only) if the asset is missing.
import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";

const isCJK = (ch: string) => /[　-〿㐀-鿿豈-﫿＀-￯]/.test(ch);

export type ReportChart = { caption: string; series: { label: string; color: string; values: number[] }[] };
export type ReportRadarAxis = { label: string; value: number };

async function loadFont(): Promise<Buffer | null> {
  const candidates = [process.env.REPORT_FONT_PATH, path.join(process.cwd(), "public/fonts/NotoSansSC-report.otf")].filter(Boolean) as string[];
  for (const p of candidates) {
    try { return await readFile(p); } catch { /* try next */ }
  }
  return null;
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let buf = "";
  for (const ch of text) {
    if (isCJK(ch)) { if (buf) { tokens.push(buf); buf = ""; } tokens.push(ch); }
    else if (ch === " ") { tokens.push(buf + ch); buf = ""; }
    else buf += ch;
  }
  if (buf) tokens.push(buf);
  return tokens;
}

function wrap(text: string, measure: (s: string) => number, maxWidth: number): string[] {
  const out: string[] = [];
  let line = "";
  const fits = (s: string) => measure(s.trimEnd()) <= maxWidth;
  for (const tok of tokenize(text)) {
    if (!fits(tok.trim())) {
      if (line.trimEnd()) { out.push(line.trimEnd()); line = ""; }
      let chunk = "";
      for (const ch of tok) { if (chunk && !fits(chunk + ch)) { out.push(chunk); chunk = ch; } else chunk += ch; }
      line = chunk;
      continue;
    }
    if (line && !fits(line + tok)) { out.push(line.trimEnd()); line = tok.trimStart(); }
    else line += tok;
  }
  if (line.trimEnd()) out.push(line.trimEnd());
  return out.length ? out : [""];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawChart(doc: any, chart: ReportChart, family: string) {
  const left = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const h = 110;
  const top = doc.y + 4;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  doc.save();
  doc.lineWidth(0.5).strokeColor("#e2e8f0");
  [0, 0.5, 1].forEach((g) => { const y = top + (1 - g) * h; doc.moveTo(left, y).lineTo(left + w, y).stroke(); });
  for (const s of chart.series) {
    const n = s.values.length; if (n < 2) continue;
    doc.lineWidth(1.5).strokeColor(s.color);
    s.values.forEach((v, i) => { const x = left + (i / (n - 1)) * w; const y = top + (1 - clamp(v)) * h; if (i === 0) doc.moveTo(x, y); else doc.lineTo(x, y); });
    doc.stroke();
  }
  doc.restore();
  // legend + caption
  let lx = left; const ly = top + h + 8;
  doc.font(family).fontSize(9);
  for (const s of chart.series) { doc.rect(lx, ly, 8, 8).fill(s.color); doc.fillColor("#475569").text(s.label, lx + 12, ly - 1, { lineBreak: false }); lx += 12 + doc.widthOfString(s.label) + 16; }
  doc.fillColor("#94a3b8").fontSize(8).text(chart.caption, left, ly + 14, { lineBreak: false });
  doc.x = left; doc.y = ly + 30;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawRadar(doc: any, axes: ReportRadarAxis[], family: string) {
  const n = axes.length; if (n < 3) return;
  const cx = doc.page.width / 2; const R = 66; const top = doc.y + 6; const cy = top + R;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const ang = (i: number) => -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const pt = (i: number, r: number): [number, number] => [cx + Math.cos(ang(i)) * R * r, cy + Math.sin(ang(i)) * R * r];
  doc.save();
  doc.lineWidth(0.5).strokeColor("#e2e8f0");
  for (const rr of [0.5, 1]) { axes.forEach((_, i) => { const [x, y] = pt(i, rr); if (i === 0) doc.moveTo(x, y); else doc.lineTo(x, y); }); doc.closePath().stroke(); }
  axes.forEach((_, i) => { const [x, y] = pt(i, 1); doc.moveTo(cx, cy).lineTo(x, y).stroke(); });
  doc.lineWidth(1.5).fillOpacity(0.18);
  axes.forEach((a, i) => { const [x, y] = pt(i, clamp(a.value)); if (i === 0) doc.moveTo(x, y); else doc.lineTo(x, y); });
  doc.closePath().fillAndStroke("#10b981", "#10b981");
  doc.fillOpacity(1); doc.restore();
  doc.font(family).fontSize(8).fillColor("#475569");
  axes.forEach((a, i) => { const [x, y] = pt(i, 1.2); const label = `${a.label} ${Math.round(clamp(a.value) * 100)}%`; const w = doc.widthOfString(label); doc.text(label, x - w / 2, y - 4, { lineBreak: false, width: w + 4 }); });
  doc.x = doc.page.margins.left; doc.y = cy + R + 26;
}

export async function reportPdf(title: string, lines: string[], chart?: ReportChart, radar?: ReportRadarAxis[]): Promise<Uint8Array> {
  const fontBytes = await loadFont();
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: title } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  if (fontBytes) doc.registerFont("cjk", fontBytes);
  const family = fontBytes ? "cjk" : "Helvetica";
  const maxWidth = doc.page.width - 96;

  const block = (text: string, size: number, color: string, gap: number) => {
    doc.font(family).fontSize(size).fillColor(color);
    for (const ln of wrap(text, (s: string) => doc.widthOfString(s), maxWidth)) doc.text(ln, { width: maxWidth, lineBreak: false });
    doc.moveDown(gap);
  };

  block(title, 18, "#171a26", 0.6);
  if (chart && chart.series.some((s) => s.values.length >= 2)) drawChart(doc, chart, family);
  if (radar && radar.length >= 3) drawRadar(doc, radar, family);
  for (const line of lines) block(line || " ", 11, "#171a26", 0.2);
  doc.moveDown(0.8);
  doc.font(family).fontSize(8).fillColor("#73808c").text("由 承策 Chengce 生成 · 创始人可复制蓝图", { lineBreak: false });
  doc.end();
  return new Uint8Array(await done);
}
