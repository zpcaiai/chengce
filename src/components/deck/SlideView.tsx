import type { Slide, Theme } from "@/lib/deck/types";

const c = (h: string) => `#${h}`;

/** Renders one slide as a 16:9 themed card. Font sizes use container-query width
 *  units (cqw) so the same component looks right at any size (thumbnail → full). */
export function SlideView({ slide, theme }: { slide: Slide; theme: Theme }) {
  const text = c(theme.text), muted = c(theme.muted), accent = c(theme.accent), accent2 = c(theme.accent2), surface = c(theme.surface);
  const bg = slide.layout === "section" ? surface : c(theme.bg);

  return <div style={{ containerType: "size", background: bg, color: text, aspectRatio: "16 / 9", position: "relative", overflow: "hidden", borderRadius: 10, padding: "6% 6.5%", boxSizing: "border-box", fontFamily: 'ui-sans-serif, system-ui, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
    {slide.layout === "cover" && <>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "1.6%", background: accent }} />
      {slide.note && <div style={{ color: accent2, fontSize: "2.2cqw", letterSpacing: "0.15em", marginBottom: "2%" }}>{slide.note}</div>}
      <div style={{ fontSize: "7cqw", fontWeight: 800, lineHeight: 1.1, maxWidth: "88%" }}>{slide.title}</div>
      <div style={{ width: "12%", height: "0.7cqw", background: accent, margin: "3% 0" }} />
      {slide.subtitle && <div style={{ color: muted, fontSize: "3cqw", maxWidth: "82%" }}>{slide.subtitle}</div>}
    </>}

    {slide.layout === "section" && <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ color: accent, fontSize: "12cqw", fontWeight: 800, lineHeight: 1 }}>{slide.title}</div>
      {slide.subtitle && <div style={{ fontSize: "3.6cqw", marginTop: "2%" }}>{slide.subtitle}</div>}
    </div>}

    {(slide.layout === "bullets") && <>
      <Title text={slide.title} accent={accent} />
      <div style={{ marginTop: "4%", display: "flex", flexDirection: "column", gap: "2.4%" }}>
        {(slide.bullets ?? []).map((b, i) => <div key={i} style={{ display: "flex", gap: "1.6%", alignItems: "flex-start", fontSize: "3cqw" }}><span style={{ width: "1.4cqw", height: "1.4cqw", borderRadius: "50%", background: accent, marginTop: "1cqw", flex: "none" }} />{b}</div>)}
      </div>
    </>}

    {slide.layout === "twoColumn" && <>
      <Title text={slide.title} accent={accent} />
      <div style={{ marginTop: "4%", display: "grid", gridTemplateColumns: `repeat(${Math.min((slide.columns ?? []).length || 1, 2)}, 1fr)`, gap: "3%" }}>
        {(slide.columns ?? []).slice(0, 2).map((col, i) => <div key={i} style={{ background: surface, borderRadius: 10, padding: "5%" }}>
          <div style={{ color: accent, fontWeight: 700, fontSize: "2.8cqw", marginBottom: "4%" }}>{col.heading}</div>
          {(col.bullets ?? []).map((b, j) => <div key={j} style={{ display: "flex", gap: "1.4%", fontSize: "2.5cqw", marginBottom: "2.5%" }}><span style={{ color: accent }}>·</span>{b}</div>)}
        </div>)}
      </div>
    </>}

    {slide.layout === "metrics" && <>
      <Title text={slide.title} accent={accent} />
      <div style={{ marginTop: "5%", display: "grid", gridTemplateColumns: `repeat(${(slide.metrics ?? []).length || 1}, 1fr)`, gap: "3%" }}>
        {(slide.metrics ?? []).map((m, i) => <div key={i} style={{ background: surface, borderRadius: 12, padding: "7% 4%", textAlign: "center" }}>
          <div style={{ color: accent, fontWeight: 800, fontSize: "6.5cqw", lineHeight: 1 }}>{m.value}</div>
          <div style={{ color: muted, fontSize: "2.4cqw", marginTop: "8%" }}>{m.label}</div>
        </div>)}
      </div>
    </>}

    {slide.layout === "quote" && <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ color: accent, fontSize: "16cqw", fontWeight: 800, lineHeight: 0.6, height: "8cqw" }}>“</div>
      <div style={{ fontSize: "5cqw", fontWeight: 700, fontStyle: "italic", maxWidth: "88%", marginTop: "2%" }}>{slide.quote}</div>
      {slide.author && <div style={{ color: muted, fontSize: "2.6cqw", marginTop: "3%" }}>— {slide.author}</div>}
    </div>}

    {slide.layout === "timeline" && <>
      <Title text={slide.title} accent={accent} />
      <div style={{ marginTop: "7%", display: "grid", gridTemplateColumns: `repeat(${(slide.steps ?? []).length || 1}, 1fr)`, gap: "2%" }}>
        {(slide.steps ?? []).map((st, i) => <div key={i}>
          <div style={{ width: "3cqw", height: "3cqw", borderRadius: "50%", background: accent, marginBottom: "4%" }} />
          <div style={{ fontWeight: 700, fontSize: "2.7cqw" }}>{st.label}</div>
          <div style={{ color: muted, fontSize: "2.2cqw", marginTop: "2%" }}>{st.detail}</div>
        </div>)}
      </div>
    </>}

    {slide.layout === "closing" && <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: "7cqw", fontWeight: 800 }}>{slide.title}</div>
      {slide.subtitle && <div style={{ color: accent, fontSize: "3.2cqw", marginTop: "2%" }}>{slide.subtitle}</div>}
      {slide.note && <div style={{ color: muted, fontSize: "2.4cqw", marginTop: "3%" }}>{slide.note}</div>}
    </div>}
  </div>;
}

function Title({ text, accent }: { text?: string; accent: string }) {
  return <div><div style={{ fontSize: "4.6cqw", fontWeight: 800 }}>{text}</div><div style={{ width: "8%", height: "0.6cqw", background: accent, marginTop: "1.6%" }} /></div>;
}
