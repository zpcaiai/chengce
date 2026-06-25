"use client";
import { useEffect, useState } from "react";

type N = { id: string; kind: string; title: string; body: string; link: string; readAt: string | null; createdAt: string };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.notifications);
      setUnread(json.unread);
    } catch { /* ignore */ }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  async function markAll() {
    await fetch("/api/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
    load();
  }

  return <div className="relative">
    <button aria-label="通知" className="relative !px-2 text-slate-300 hover:text-emerald-300" onClick={() => { setOpen(!open); if (!open) load(); }}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      {unread > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-xl">
      <div className="flex items-center justify-between px-2 py-1"><span className="text-xs text-slate-500">通知</span>{unread > 0 && <button className="text-xs text-emerald-300 hover:underline" onClick={markAll}>全部已读</button>}</div>
      {items.length ? <div className="max-h-80 space-y-1 overflow-auto">{items.map((n) => <a key={n.id} href={n.link || "#"} className={`block rounded-lg px-2 py-2 hover:bg-slate-900 ${n.readAt ? "opacity-60" : ""}`}><p className="text-sm text-slate-200">{n.title}</p>{n.body && <p className="text-xs text-slate-500">{n.body}</p>}<p className="mt-0.5 text-[10px] text-slate-600">{new Date(n.createdAt).toLocaleString("zh-CN")}</p></a>)}</div>
        : <p className="px-2 py-6 text-center text-sm text-slate-500">暂无通知</p>}
    </div>}
  </div>;
}
