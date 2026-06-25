"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Slide, Theme } from "@/lib/deck/types";
import { getTheme } from "@/lib/deck/themes";
import { SlideView } from "@/components/deck/SlideView";

export function DeckEditor({ deck, themes }: { deck: { id: string; title: string; themeId: string; scenario: string; slides: Slide[] }; themes: Theme[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(deck.title);
  const [themeId, setThemeId] = useState(deck.themeId);
  const [slides, setSlides] = useState<Slide[]>(deck.slides);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const theme = getTheme(themeId);

  const update = (i: number, patch: Partial<Slide>) => setSlides((s) => s.map((sl, idx) => idx === i ? { ...sl, ...patch } : sl));
  const removeSlide = (i: number) => setSlides((s) => s.filter((_, idx) => idx !== i));
  const addSlide = () => setSlides((s) => [...s, { layout: "bullets", title: "新页", bullets: ["要点一", "要点二"] }]);
  const move = (i: number, dir: -1 | 1) => setSlides((s) => { const n = [...s]; const j = i + dir; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; });

  async function save() {
    setBusy("save"); setNotice("");
    try {
      const res = await fetch(`/api/decks/${deck.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, themeId, slides }) });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "保存失败"); }
      setNotice("已保存。"); router.refresh();
    } catch (e) { setNotice(e instanceof Error ? e.message : "保存失败"); } finally { setBusy(""); }
  }
  async function del() {
    if (!confirm("删除这份演示？")) return;
    const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/decks"); router.refresh(); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-2">
      <input className="max-w-sm flex-1" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="演示标题" />
      <select className="max-w-40" value={themeId} onChange={(e) => setThemeId(e.target.value)} aria-label="主题">{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <button className="button-primary" disabled={busy === "save"} onClick={save}>{busy === "save" ? "保存中…" : "保存"}</button>
      <a className="button-secondary" href={`/api/decks/${deck.id}/pptx`}>导出 PPT</a>
      <button className="button-secondary" onClick={addSlide}>+ 加一页</button>
      <button className="text-sm text-rose-300 hover:underline" onClick={del}>删除</button>
      {notice && <span className="text-xs text-emerald-300">{notice}</span>}
    </div>
    <div className="space-y-4">{slides.map((sl, i) => <div key={i} className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
      <div className="overflow-hidden rounded-xl border border-slate-800"><SlideView slide={sl} theme={theme} /></div>
      <div className="card text-sm">
        <div className="flex items-center justify-between"><span className="text-xs text-slate-500">第 {i + 1} 页 · {sl.layout}</span><div className="flex gap-1"><button className="button-secondary !px-2 !py-0.5 text-xs" onClick={() => move(i, -1)}>↑</button><button className="button-secondary !px-2 !py-0.5 text-xs" onClick={() => move(i, 1)}>↓</button><button className="button-secondary !px-2 !py-0.5 text-xs" onClick={() => removeSlide(i)}>删</button></div></div>
        <button className="mt-2 text-xs text-emerald-300 hover:underline" onClick={() => setEditing(editing === i ? null : i)}>{editing === i ? "收起" : "编辑文字"}</button>
        {editing === i && <div className="mt-2 space-y-2">
          <input value={sl.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} placeholder="标题" />
          <input value={sl.subtitle ?? ""} onChange={(e) => update(i, { subtitle: e.target.value })} placeholder="副标题" />
          {sl.layout === "bullets" && <textarea rows={4} value={(sl.bullets ?? []).join("\n")} onChange={(e) => update(i, { bullets: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} placeholder="要点，每行一条" />}
          {sl.layout === "quote" && <textarea rows={2} value={sl.quote ?? ""} onChange={(e) => update(i, { quote: e.target.value })} placeholder="引言" />}
          {sl.layout === "quote" && <input value={sl.author ?? ""} onChange={(e) => update(i, { author: e.target.value })} placeholder="署名" />}
        </div>}
      </div>
    </div>)}</div>
  </div>;
}
