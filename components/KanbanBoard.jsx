"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STATUS_OPTIONS, STATUS_COLOR, BOARD_LABEL } from "@/lib/constants";
import { canEditTask } from "@/lib/permissions";
import ProgressBar from "@/components/ProgressBar";

export default function KanbanBoard({ tasks, profile, onOpenTask, onTaskChanged }) {
  const supabase = createClient();
  const [dragTaskId, setDragTaskId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const columns = STATUS_OPTIONS.map((s) => ({
    ...s,
    items: tasks.filter((t) => t.status === s.value),
  }));

  async function handleDrop(status) {
    setOverColumn(null);
    if (!dragTaskId) return;
    const task = tasks.find((t) => t.id === dragTaskId);
    setDragTaskId(null);
    if (!task || !canEditTask(profile, task) || task.status === status) return;

    onTaskChanged({ ...task, status }); // optimistic update
    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (error) {
      onTaskChanged(task); // revert on failure
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 12, alignItems: "start" }}>
      {columns.map((col) => (
        <div
          key={col.value}
          onDragOver={(e) => {
            e.preventDefault();
            setOverColumn(col.value);
          }}
          onDragLeave={() => setOverColumn((c) => (c === col.value ? null : c))}
          onDrop={() => handleDrop(col.value)}
          className="card"
          style={{
            padding: 10,
            background: overColumn === col.value ? "var(--brand-soft)" : "var(--surface)",
            minHeight: 200,
            transition: "background 120ms",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: STATUS_COLOR[col.value] }} />
            {col.label}
            <span style={{ color: "var(--muted)", fontWeight: 500 }}>({col.items.length})</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {col.items.map((t) => {
              const editable = canEditTask(profile, t);
              return (
              <div
                key={t.id}
                draggable={editable}
                onDragStart={() => setDragTaskId(t.id)}
                onDragEnd={() => setDragTaskId(null)}
                onClick={() => onOpenTask(t)}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 10,
                  background: "var(--surface)",
                  cursor: editable ? "grab" : "pointer",
                  opacity: dragTaskId === t.id ? 0.4 : 1,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>
                  {"★".repeat(t.priority)} · {t.business_unit} · {BOARD_LABEL[t.board] || t.board}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  {t.title}
                  {t.decision_risk_flag && (
                    <span style={{ marginLeft: 6, color: "var(--status-hold)", fontSize: 11 }}>●</span>
                  )}
                </div>
                <ProgressBar value={t.progress_pct} />
                {t.owner_dept && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{t.owner_dept}</div>
                )}
              </div>
              );
            })}
            {col.items.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>비어 있음</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
