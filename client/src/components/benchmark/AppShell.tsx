"use client";

import { ReactNode } from "react";

export default function AppShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", background: "#111" }}>
      {/* ── TOP HEADER ── */}
      <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid #242424", background: "#0d0d0d" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e2e2" }}>{title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {children}
      </main>
    </div>
  );
}