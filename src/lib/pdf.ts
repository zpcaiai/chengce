// CJK-capable report PDF via pdfkit, which embeds and subsets TrueType/OpenType
// fonts reliably (including CJK). Bundles a Noto Sans SC subset; override with
// REPORT_FONT_PATH. Falls back to Helvetica (ASCII only) if the asset is missing.
import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";

const isCJK = (ch: string) => /[　-〿㐀-鿿豈-﫿＀-￯]/.test(ch);

async function loadFont(): Promise<Buffer | null> {
  const candidates = [process.env.REPORT_FONT_PATH, path.join(process.cwd(), "public/fonts/NotoSansSC-report.otf")].filter(Boolean) as string[];
  for (const p of candidates) {
    try { return await readFile(p); } catch { /* try next */ }
  }
  return null;
}

/** Tokenize so CJK wraps per character and Latin wraps per word (trailing space kept). */
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

export async function reportPdf(title: string, lines: string[]): Promise<Uint8Array> {
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
  for (const line of lines) block(line || " ", 11, "#171a26", 0.2);
  doc.moveDown(0.8);
  doc.font(family).fontSize(8).fillColor("#73808c").text("由 承策 Chengce 生成 · 创始人可复制蓝图", { lineBreak: false });
  doc.end();
  return new Uint8Array(await done);
}
