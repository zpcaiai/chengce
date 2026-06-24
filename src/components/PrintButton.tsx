"use client";

export function PrintButton() {
  return <button className="button-secondary print:hidden" onClick={() => window.print()}>打印 / 导出 PDF</button>;
}
