"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function InviteAccept({ token, workspaceName, loggedIn }: { token: string; workspaceName: string; loggedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "joining" | "done" | "error">(loggedIn ? "joining" : "idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loggedIn) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) { router.push(`/login?invite=${token}`); return; }
          throw new Error(data.error || "加入失败");
        }
        if (!active) return;
        setState("done");
        setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 900);
      } catch (e) {
        if (active) { setState("error"); setError(e instanceof Error ? e.message : "加入失败"); }
      }
    })();
    return () => { active = false; };
  }, [loggedIn, token, router]);

  if (!loggedIn) return <a className="button-primary inline-block" href={`/login?invite=${token}`}>登录并加入「{workspaceName}」</a>;
  if (state === "done") return <p className="text-sm text-emerald-300">已加入，正在进入工作台…</p>;
  if (state === "error") return <div><p className="text-sm text-rose-300">{error}</p><a className="button-secondary mt-3 inline-block" href="/dashboard">前往工作台</a></div>;
  return <p className="text-sm text-slate-400">正在加入「{workspaceName}」…</p>;
}
