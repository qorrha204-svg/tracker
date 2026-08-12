"use client";

import { useMemo } from "react";
import Link from "next/link";
import DecisionCards from "@/components/DecisionCards";

export default function ReportView({ tasks }) {
  const generatedAt = useMemo(
    () => new Date().toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" }),
    []
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      on_track: tasks.filter((t) => t.status === "on_track").length,
      done: tasks.filter((t) => t.status === "done").length,
      hold: tasks.filter((t) => t.status === "hold").length,
      delayed: tasks.filter((t) => t.status === "delayed").length,
    }),
    [tasks]
  );

  const decisionTasks = useMemo(
    () => tasks.filter((t) => t.decision_risk_flag && t.status !== "done"),
    [tasks]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={backLinkStyle}>
          ← 개요로 돌아가기
        </Link>
        <button onClick={() => window.print()} style={printButtonStyle}>
          🖨️ 인쇄 / PDF로 저장
        </button>
      </div>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>영업조직 핵심과제 대표이사 보고</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>생성일시: {generatedAt}</p>
      </div>

      <div style={statRowStyle}>
        <StatTile label="전체 과제" value={stats.total} />
        <StatTile label="진행중" value={stats.on_track} />
        <StatTile label="완료" value={stats.done} />
        <StatTile label="보류" value={stats.hold} />
        <StatTile label="지연" value={stats.delayed} />
        <StatTile label="대표이사 의사결정" value={decisionTasks.length} highlight />
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>대표이사 의사결정 ({decisionTasks.length})</h2>
        <DecisionCards tasks={decisionTasks} />
      </div>
    </div>
  );
}

function StatTile({ label, value, highlight }) {
  return (
    <div className="card" style={{ padding: 12, borderColor: highlight && value > 0 ? "var(--status-hold)" : "var(--border)" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: highlight && value > 0 ? "var(--status-hold)" : "var(--foreground)" }}>
        {value}
      </div>
    </div>
  );
}

const statRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
};

const backLinkStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--muted)",
  textDecoration: "none",
};

const printButtonStyle = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "var(--brand)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};
