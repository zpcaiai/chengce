"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="text-sm text-slate-400 hover:text-emerald-300"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/login");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "退出中…" : "退出"}
    </button>
  );
}
