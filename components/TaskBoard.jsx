"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BUSINESS_UNITS, STATUS_OPTIONS, STATUS_LABEL, BOARD_OPTIONS, BOARD_LABEL } from "@/lib/constants";
import { canCreateTask, canEditTask, isAdminLevel } from "@/lib/permissions";
import StatusBadge from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";
import TaskDrawer from "@/components/TaskDrawer";
import KanbanBoard from "@/components/KanbanBoard";
import FilterableTh from "@/components/FilterableTh";

const STATUS_ORDER = Object.fromEntries(STATUS_OPTIONS.map((s, i) => [s.value, i]));

const TABLE_ACCESSORS = {
  board: (t) => BOARD_LABEL[t.board] || t.board,
  priority: (t) => t.priority,
  business_unit: (t) => t.business_unit,
  title: (t) => t.title || "",
  status: (t) => STATUS_ORDER[t.status] ?? 99,
  progress_pct: (t) => t.progress_pct ?? -1,
  due_date: (t) => t.due_date || "",
  owner_dept: (t) => t.owner_dept || "",
};

function buildOptions(rows, getKey, getLabel) {
  const counts = new Map();
  for (const row of rows) {
    const key = getKey(row);
    const entry = counts.get(key) || { value: key, label: getLabel(row, key), count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return Array.from(counts.values()).sort((a, b) => String(a.label).localeCompare(String(b.label), "ko"));
}

function blankTask(board) {
  return {
    board: board || BOARD_OPTIONS[0].value,
    priority: 2,
    business_unit: BUSINESS_UNITS[0],
    category: "",
    title: "",
    purpose: "",
    plan: "",
    status: "on_track",
    progress_pct: null,
    due_date: null,
    owner_dept: "",
    collab_depts: "",
    decision_risk_flag: "",
    ceo_comment: "",
  };
}

export default function TaskBoard({ initialTasks, profile }) {
  const canCreate = canCreateTask(profile?.role);
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState(initialTasks);
  const [boardFilter, setBoardFilter] = useState("all");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [decisionOnly, setDecisionOnly] = useState(() => searchParams.get("decision") === "1");
  const [view, setView] = useState(() => (searchParams.get("view") === "table" ? "table" : "board"));
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [colFilters, setColFilters] = useState({ board: null, priority: null, business_unit: null, status: null, owner_dept: null });

  const [selectedTask, setSelectedTask] = useState(() => {
    const openId = searchParams.get("open");
    return openId ? initialTasks.find((t) => t.id === openId) || null : null;
  });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (boardFilter !== "all" && t.board !== boardFilter) return false;
      if (businessUnitFilter !== "all" && t.business_unit !== businessUnitFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (decisionOnly && !(t.decision_risk_flag && t.status !== "done")) return false;
      return true;
    });
  }, [tasks, boardFilter, businessUnitFilter, statusFilter, decisionOnly]);

  const columnOptions = useMemo(
    () => ({
      board: buildOptions(filtered, (t) => t.board, (t) => BOARD_LABEL[t.board] || t.board),
      priority: buildOptions(filtered, (t) => t.priority, (t) => "★".repeat(t.priority)),
      business_unit: buildOptions(filtered, (t) => t.business_unit, (t) => t.business_unit),
      status: buildOptions(filtered, (t) => t.status, (t) => STATUS_LABEL[t.status] || t.status),
      owner_dept: buildOptions(filtered, (t) => t.owner_dept || "", (t) => t.owner_dept || "(미지정)"),
    }),
    [filtered]
  );

  const tableRows = useMemo(() => {
    let rows = filtered.filter((t) => {
      if (colFilters.board && !colFilters.board.has(t.board)) return false;
      if (colFilters.priority && !colFilters.priority.has(t.priority)) return false;
      if (colFilters.business_unit && !colFilters.business_unit.has(t.business_unit)) return false;
      if (colFilters.status && !colFilters.status.has(t.status)) return false;
      if (colFilters.owner_dept && !colFilters.owner_dept.has(t.owner_dept || "")) return false;
      return true;
    });
    if (sort.key) {
      const accessor = TABLE_ACCESSORS[sort.key];
      const dir = sort.dir === "desc" ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const av = accessor(a);
        const bv = accessor(b);
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }
    return rows;
  }, [filtered, colFilters, sort]);

  function handleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  }

  function sortDirFor(key) {
    return sort.key === key ? sort.dir : null;
  }

  function setColFilter(key, value) {
    setColFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleSaved(saved) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? { ...t, ...saved } : t)) : [saved, ...prev];
    });
    setSelectedTask(null);
  }

  function handleTaskChanged(updated) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>전체 과제</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{filtered.length}건 표시 중 (전체 {tasks.length}건)</p>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setDecisionOnly((d) => !d)} style={decisionChipStyle(decisionOnly)}>
          {decisionOnly ? "의사결정 필요만 ✕" : "의사결정 필요만"}
        </button>
        <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)} style={selectStyle}>
          <option value="all">전체 유형</option>
          {BOARD_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <select value={businessUnitFilter} onChange={(e) => setBusinessUnitFilter(e.target.value)} style={selectStyle}>
          <option value="all">전체 사업부</option>
          {BUSINESS_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">전체 Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <button onClick={() => setView("board")} style={toggleButtonStyle(view === "board")}>
            보드
          </button>
          <button onClick={() => setView("table")} style={toggleButtonStyle(view === "table")}>
            테이블
          </button>
        </div>

        {canCreate && (
          <button onClick={() => setSelectedTask(blankTask(boardFilter !== "all" ? boardFilter : undefined))} style={newButtonStyle}>
            + 새 과제
          </button>
        )}
      </div>

      {view === "board" ? (
        <KanbanBoard tasks={filtered} profile={profile} onOpenTask={setSelectedTask} onTaskChanged={handleTaskChanged} />
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                <FilterableTh
                  label="유형"
                  sortDir={sortDirFor("board")}
                  onSort={() => handleSort("board")}
                  options={columnOptions.board}
                  selected={colFilters.board}
                  onChange={(v) => setColFilter("board", v)}
                />
                <FilterableTh
                  label="우선"
                  sortDir={sortDirFor("priority")}
                  onSort={() => handleSort("priority")}
                  options={columnOptions.priority}
                  selected={colFilters.priority}
                  onChange={(v) => setColFilter("priority", v)}
                />
                <FilterableTh
                  label="사업부"
                  minWidth={92}
                  sortDir={sortDirFor("business_unit")}
                  onSort={() => handleSort("business_unit")}
                  options={columnOptions.business_unit}
                  selected={colFilters.business_unit}
                  onChange={(v) => setColFilter("business_unit", v)}
                />
                <FilterableTh label="핵심과제" sortDir={sortDirFor("title")} onSort={() => handleSort("title")} />
                <FilterableTh
                  label="Status"
                  sortDir={sortDirFor("status")}
                  onSort={() => handleSort("status")}
                  options={columnOptions.status}
                  selected={colFilters.status}
                  onChange={(v) => setColFilter("status", v)}
                />
                <FilterableTh label="진척률" sortDir={sortDirFor("progress_pct")} onSort={() => handleSort("progress_pct")} />
                <FilterableTh label="완료일정" sortDir={sortDirFor("due_date")} onSort={() => handleSort("due_date")} />
                <FilterableTh
                  label="Task Owner"
                  sortDir={sortDirFor("owner_dept")}
                  onSort={() => handleSort("owner_dept")}
                  options={columnOptions.owner_dept}
                  selected={colFilters.owner_dept}
                  onChange={(v) => setColFilter("owner_dept", v)}
                />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                >
                  <Td>
                    <span style={boardTagStyle}>{BOARD_LABEL[t.board] || t.board}</span>
                  </Td>
                  <Td style={{ whiteSpace: "nowrap" }}>{"★".repeat(t.priority)}</Td>
                  <Td style={{ whiteSpace: "nowrap" }}>{t.business_unit}</Td>
                  <Td style={{ fontWeight: 600 }}>
                    {t.title}
                    {t.decision_risk_flag && (
                      <span style={{ marginLeft: 6, color: "var(--status-hold)", fontSize: 11, fontWeight: 700 }}>● 의사결정</span>
                    )}
                    {!canEditTask(profile, t) && (
                      <span style={{ marginLeft: 6, color: "var(--muted)", fontSize: 11, fontWeight: 500 }}>🔒</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td style={{ minWidth: 120 }}>
                    <ProgressBar value={t.progress_pct} />
                  </Td>
                  <Td style={{ whiteSpace: "nowrap" }}>{t.due_date || "-"}</Td>
                  <Td style={{ whiteSpace: "nowrap" }}>{t.owner_dept || "-"}</Td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <Td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                    조건에 맞는 과제가 없습니다.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTask && (
        <TaskDrawer
          key={selectedTask.id || "new"}
          task={selectedTask}
          canEdit={!selectedTask.id || canEditTask(profile, selectedTask)}
          canEditCeoComment={isAdminLevel(profile?.role)}
          onClose={() => setSelectedTask(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function Td({ children, style, colSpan }) {
  return (
    <td colSpan={colSpan} style={{ padding: "10px 12px", ...style }}>
      {children}
    </td>
  );
}

const selectStyle = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  fontSize: 13,
};

function decisionChipStyle(active) {
  return {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${active ? "var(--status-hold)" : "var(--border)"}`,
    background: active ? "#fef3c7" : "var(--surface)",
    color: active ? "var(--status-hold)" : "var(--muted)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };
}

const boardTagStyle = {
  fontSize: 11,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 999,
  background: "var(--brand-soft)",
  color: "var(--brand)",
  whiteSpace: "nowrap",
};

function toggleButtonStyle(active) {
  return {
    padding: "6px 12px",
    border: "none",
    background: active ? "var(--brand)" : "var(--surface)",
    color: active ? "white" : "var(--foreground)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}

const newButtonStyle = {
  marginLeft: "auto",
  padding: "6px 14px",
  borderRadius: 8,
  border: "none",
  background: "var(--brand)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};
