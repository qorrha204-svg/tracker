"use client";

import { useMemo, useState } from "react";
import StatCards from "@/components/StatCards";
import StatusBadge from "@/components/StatusBadge";
import TaskDrawer from "@/components/TaskDrawer";
import { StatusDonut, BusinessUnitProgress } from "@/components/OverviewCharts";
import { BOARD_LABEL } from "@/lib/constants";
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
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>대표 의사결정 필요 항목 ({decisionTasks.length})</h2>
        {decisionTasks.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>현재 의사결정 대기 중인 과제가 없습니다.</p>
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {decisionTasks.map((t) => (
              <li key={t.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => setSelectedTask(t)} style={taskLinkStyle}>
                    {t.title}
                  </button>
                  <StatusBadge status={t.status} />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {t.business_unit} · {BOARD_LABEL[t.board]} · {t.owner_dept}
                  </span>
                </div>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  <strong style={{ color: "var(--status-hold)" }}>Flag: </strong>
                  {t.decision_risk_flag}
                </p>
                {t.ceo_comment && (
                  <p style={{ fontSize: 13, marginTop: 2, color: "var(--muted)" }}>
                    <strong>CEO Comment: </strong>
                    {t.ceo_comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
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

const taskLinkStyle = {
  fontWeight: 600,
  fontSize: 14,
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  color: "var(--foreground)",
  textDecoration: "underline",
  textDecorationColor: "var(--border)",
};
