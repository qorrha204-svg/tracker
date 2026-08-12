"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StatCards from "@/components/StatCards";
import TaskDrawer from "@/components/TaskDrawer";
import DecisionCards from "@/components/DecisionCards";
import { StatusDonut, BusinessUnitProgress } from "@/components/OverviewCharts";
import { canEditTask, isAdminLevel } from "@/lib/permissions";

export default function OverviewDashboard({ initialTasks, profile }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState(null);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      on_track: tasks.filter((t) => t.status === "on_track").length,
      done: tasks.filter((t) => t.status === "done").length,
      hold: tasks.filter((t) => t.status === "hold").length,
      decisionNeeded: tasks.filter((t) => t.decision_risk_flag && t.status !== "done").length,
    }),
    [tasks]
  );

  const decisionTasks = useMemo(
    () => tasks.filter((t) => t.decision_risk_flag && t.status !== "done"),
    [tasks]
  );

  function handleSaved(updated) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    setSelectedTask(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>전사 개요</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>영업조직 핵심과제 · 부서별 과제 전체 현황</p>
      </div>

      <StatCards stats={stats} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Status 분포</h2>
          <StatusDonut tasks={tasks} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>사업부별 평균 진척률</h2>
          <BusinessUnitProgress tasks={tasks} />
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700 }}>대표이사 의사결정 ({decisionTasks.length})</h2>
          <Link href="/report" style={reportLinkStyle}>
            📄 대표이사 보고용 리포트 PDF 출력
          </Link>
        </div>
        <DecisionCards tasks={decisionTasks} onOpenTask={setSelectedTask} />
      </div>

      {selectedTask && (
        <TaskDrawer
          key={selectedTask.id}
          task={selectedTask}
          canEdit={canEditTask(profile, selectedTask)}
          canEditCeoComment={isAdminLevel(profile?.role)}
          onClose={() => setSelectedTask(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

const reportLinkStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--brand)",
  textDecoration: "none",
  whiteSpace: "nowrap",
};
