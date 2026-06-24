import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "承策 · 创始人可复制系统", template: "%s · 承策" }, description: "把创始人的判断，变成组织可执行的系统。" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body>{children}</body></html>; }
