"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Slide, Theme } from "@/lib/deck/types";
import { getTheme } from "@/lib/deck/themes";
import { SlideView } from "@/components/deck/SlideView";

type Tpl = { id: string; name: string; scenario: string; description: string; themeId: string; cover: Slide };
type MyDeck = { id: string; title: string; scenario: string; themeId: string; updatedAt: string };

export function DeckStudio({ templates, themes, decks }: { templates: Tpl[]; themes: Theme[]; decks: MyDeck[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [scenario, setScenario] = useState("");
  const [audience, setAudience] = useState("");
  const [points, setPoints] = useState("");
  const [themeId, setThemeId] = useState("midnight");

  async function create(payload: Record<string, unknown>, key: string) {
    setBusy(key); setError("");
    try {
      const res = await fetch("/api/decks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "创建失败");
      router.push(`/decks/${json.deck.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setBusy("");
    }
  }

  return <div className="space-y-8">
    <div><p className="text-sm text-emerald-300">PPT 工坊</p><h1 className="mt-1 text-3xl font-semibold">几秒钟生成一份漂亮的演示</h1><p className="mt-2 text-slate-400">从模板开始，或用 AI 按主题生成，再换主题、改文字、一键导出 PPT。</p></div>
    {error && <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>}

    <section className="card">
      <h2 className="text-lg font-semibold">AI 生成</h2>
      <p className="mt-1 text-sm text-slate-400">给个主题，AI 自动组织成结构清晰的多页演示（未配置 AI key 时用内置示例结构）。</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="演示主题，例如：用 AI 重塑客户支持" />
        <input value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="场景，例如：产品发布 / 融资 / 销售提案" />
        <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="受众（可选）" />
        <select value={themeId} onChange={(e) => setThemeId(e.target.value)}>{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <textarea className="sm:col-span-2" rows={2} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="关键要点（每行一条，可选）" />
      </div>
      <button className="button-primary mt-3" disabled={busy === "ai" || topic.trim().length < 2} onClick={() => create({ mode: "ai", topic, scenario, audience, points: points.split("\n").map((s) => s.trim()).filter(Boolean), themeId }, "ai")}>{busy === "ai" ? "生成中…" : "AI 生成演示"}</button>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-semibold">业务场景模板</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => <div key={t.id} className="card overflow-hidden">
          <div className="overflow-hidden rounded-lg border border-slate-800"><SlideView slide={t.cover} theme={getTheme(t.themeId)} /></div>
          <div className="mt-3 flex items-start justify-between gap-2"><div><h3 className="font-semibold">{t.name}</h3><p className="mt-0.5 text-xs text-slate-500">{t.scenario}</p></div><span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{getTheme(t.themeId).name}</span></div>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>
          <button className="button-secondary mt-3 w-full" disabled={busy === `t-${t.id}`} onClick={() => create({ mode: "template", templateId: t.id }, `t-${t.id}`)}>{busy === `t-${t.id}` ? "创建中…" : "用此模板"}</button>
        </div>)}
      </div>
    </section>

    {decks.length > 0 && <section>
      <h2 className="mb-3 text-lg font-semibold">我的演示</h2>
      <div className="space-y-2">{decks.map((d) => <Link key={d.id} href={`/decks/${d.id}`} className="card flex items-center justify-between hover:border-emerald-700"><div><p className="font-medium">{d.title}</p><p className="text-xs text-slate-500">{d.scenario || "—"} · {getTheme(d.themeId).name} · {new Date(d.updatedAt).toLocaleDateString("zh-CN")}</p></div><span className="text-sm text-emerald-300">编辑 →</span></Link>)}</div>
    </section>}
  </div>;
}
