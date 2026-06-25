import type { Theme } from "./types";

export const THEMES: Theme[] = [
  { id: "midnight", name: "午夜商务", bg: "0B1220", surface: "111827", text: "E2E8F0", muted: "94A3B8", accent: "34D399", accent2: "38BDF8" },
  { id: "aurora", name: "极光渐变", bg: "0F172A", surface: "1E293B", text: "F1F5F9", muted: "94A3B8", accent: "A78BFA", accent2: "22D3EE" },
  { id: "ink", name: "极简墨白", bg: "FFFFFF", surface: "F1F5F9", text: "0F172A", muted: "64748B", accent: "2563EB", accent2: "0EA5E9" },
  { id: "sand", name: "暖砂质感", bg: "FFFBF5", surface: "FBEFE0", text: "1C1917", muted: "78716C", accent: "EA580C", accent2: "D97706" },
  { id: "forest", name: "沉静森绿", bg: "0B1410", surface: "14271E", text: "ECFDF5", muted: "86A790", accent: "10B981", accent2: "84CC16" },
  { id: "mono", name: "高级灰", bg: "0A0A0A", surface: "171717", text: "FAFAFA", muted: "A3A3A3", accent: "FFFFFF", accent2: "D4D4D4" },
];

export const getTheme = (id: string): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];

export const isLightTheme = (t: Theme): boolean => t.id === "ink" || t.id === "sand";
