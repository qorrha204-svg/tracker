"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BUSINESS_UNITS, STATUS_OPTIONS, STATUS_LABEL, BOARD_OPTIONS, BOARD_LABEL } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";

const FIELD_STYLE = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 14,
};

const FIELD_VALUE_STYLE = {
  marginTop: 6,
  fontSize: 14,
  padding: "8px 10px",
  background: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: 6,
};

export default function TaskDrawer({ task, canEdit, canEditCeoComment, onClose, onSaved }) {
  const supabase = createClient();
  const isNew = !task.id;
  const [form, setForm] = useState(task);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [note, setNote] = useState("");
  const [postingNote, setPostingNote] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let active = true;
    supabase
      .from("task_updates")
      .select("id, note, created_at, profiles(name, email)")
      .eq("task_id", task.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setUpdates(data || []);
      });
    return () => {
      active = false;
    };
  }, [task.id, isNew, supabase]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title?.trim()) {
      setError("과제명을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);

    const fields = {
      board: form.board,
      priority: Number(form.priority),
      business_unit: form.business_unit,
      category: form.category,
      title: form.title.trim(),
      purpose: form.purpose,
      plan: form.plan,
      status: form.status,
      progress_pct: form.progress_pct === "" || form.progress_pct === null ? null : Number(form.progress_pct),
      due_date: form.due_date || null,
      owner_dept: form.owner_dept,
      collab_depts: form.collab_depts,
      decision_risk_flag: form.decision_risk_flag,
      ceo_comment: form.ceo_comment,
    };

    if (isNew) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error: err } = await supabase
        .from("tasks")
        .insert({ ...fields, created_by: user?.id })
        .select("*")
        .single();
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
      onSaved(data);
      return;
    }

    const { error: err } = await supabase.from("tasks").update(fields).eq("id", form.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved(form);
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    setPostingNote(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error: err } = await supabase
      .from("task_updates")
      .insert({ task_id: task.id, note: note.trim(), author_id: user?.id })
      .select("id, note, created_at, profiles(name, email)")
      .single();
    setPostingNote(false);
    if (!err && data) {
      setUpdates((u) => [data, ...u]);
      setNote("");
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isNew && <div style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)", marginBottom: 6 }}>새 과제 등록</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {canEdit ? (
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="과제명"
                  style={{ ...FIELD_STYLE, fontSize: 17, fontWeight: 700, marginTop: 0, flex: 1 }}
                />
              ) : (
                <h2 style={{ fontSize: 17, fontWeight: 700, flex: 1, minWidth: 0 }}>{form.title}</h2>
              )}
              <StatusBadge status={form.status} />
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>
            ×
          </button>
        </div>

        <div style={bodyStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <Field label="유형 (핵심/부서별)" canEdit={canEdit}>
            {canEdit ? (
              <select value={form.board} onChange={(e) => set("board", e.target.value)} style={FIELD_STYLE}>
                {BOARD_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            ) : (
              <p style={FIELD_VALUE_STYLE}>{BOARD_LABEL[form.board] || form.board}</p>
            )}
          </Field>
          <Field label="사업부" canEdit={canEdit}>
            {canEdit ? (
              <select value={form.business_unit} onChange={(e) => set("business_unit", e.target.value)} style={FIELD_STYLE}>
                {BUSINESS_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            ) : (
              <p style={FIELD_VALUE_STYLE}>{form.business_unit}</p>
            )}
          </Field>
          <Field label="구분" canEdit={canEdit}>
            {canEdit ? <input value={form.category || ""} onChange={(e) => set("category", e.target.value)} style={FIELD_STYLE} /> : <p style={FIELD_VALUE_STYLE}>{form.category || "-"}</p>}
          </Field>
          <Field label="우선순위 (1~3)" canEdit={canEdit}>
            {canEdit ? (
              <input type="number" min={1} max={3} value={form.priority} onChange={(e) => set("priority", e.target.value)} style={FIELD_STYLE} />
            ) : (
              <p style={FIELD_VALUE_STYLE}>{"★".repeat(form.priority)}</p>
            )}
          </Field>
          <Field label="Status" canEdit={canEdit}>
            {canEdit ? (
              <select value={form.status} onChange={(e) => set("status", e.target.value)} style={FIELD_STYLE}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : (
              <p style={FIELD_VALUE_STYLE}>{STATUS_LABEL[form.status] || form.status}</p>
            )}
          </Field>
          <Field label="진척률 (%)" canEdit={canEdit}>
            {canEdit ? (
              <input type="number" min={0} max={100} value={form.progress_pct ?? ""} onChange={(e) => set("progress_pct", e.target.value)} style={FIELD_STYLE} />
            ) : (
              <p style={FIELD_VALUE_STYLE}>{form.progress_pct ?? "-"}%</p>
            )}
          </Field>
          <Field label="완료일정" canEdit={canEdit}>
            {canEdit ? (
              <input type="date" value={form.due_date || ""} onChange={(e) => set("due_date", e.target.value)} style={FIELD_STYLE} />
            ) : (
              <p style={FIELD_VALUE_STYLE}>{form.due_date || "-"}</p>
            )}
          </Field>
          <Field label="Task Owner" canEdit={canEdit}>
            {canEdit ? <input value={form.owner_dept || ""} onChange={(e) => set("owner_dept", e.target.value)} style={FIELD_STYLE} /> : <p style={FIELD_VALUE_STYLE}>{form.owner_dept || "-"}</p>}
          </Field>
          <Field label="협업부서" canEdit={canEdit}>
            {canEdit ? <input value={form.collab_depts || ""} onChange={(e) => set("collab_depts", e.target.value)} style={FIELD_STYLE} /> : <p style={FIELD_VALUE_STYLE}>{form.collab_depts || "-"}</p>}
          </Field>
        </div>

        <TextField label="목적 (Why)" value={form.purpose} canEdit={canEdit} onChange={(v) => set("purpose", v)} />
        <TextField label="목표·실행방안 (What·How)" value={form.plan} canEdit={canEdit} onChange={(v) => set("plan", v)} />
        <TextField label="의사결정·리스크 Flag" value={form.decision_risk_flag} canEdit={canEdit} onChange={(v) => set("decision_risk_flag", v)} />
        {(!isNew || canEditCeoComment) && (
          <TextField label="CEO Comment" value={form.ceo_comment} canEdit={canEditCeoComment} onChange={(v) => set("ceo_comment", v)} />
        )}

        {error && <p style={{ color: "var(--status-delayed)", fontSize: 13, marginTop: 8 }}>{error}</p>}

        {canEdit && (
          <button onClick={handleSave} disabled={saving} style={saveButtonStyle}>
            {saving ? "저장 중..." : isNew ? "등록" : "저장"}
          </button>
        )}

        {!isNew && (
        <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>업무 진행이력</h3>
          {canEdit && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="진행 상황 업데이트 입력..."
                style={{ ...FIELD_STYLE, marginTop: 0, flex: 1 }}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <button onClick={handleAddNote} disabled={postingNote} style={{ ...saveButtonStyle, marginTop: 0, padding: "6px 14px" }}>
                등록
              </button>
            </div>
          )}
          {updates.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>등록된 이력이 없습니다.</p>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {updates.map((u) => (
                <li key={u.id} style={{ fontSize: 13, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {new Date(u.created_at).toLocaleString("ko-KR")} · {u.profiles?.name || u.profiles?.email || "관리자"}
                  </div>
                  <div>{u.note}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{label}</div>
      {children}
    </div>
  );
}

function TextField({ label, value, canEdit, onChange }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{label}</div>
      {canEdit ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          style={{ ...FIELD_STYLE, fontSize: 14, lineHeight: 1.6, resize: "vertical" }}
        />
      ) : (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            marginTop: 6,
            padding: "10px 12px",
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {value || "-"}
        </p>
      )}
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 50,
};

const panelStyle = {
  width: "100%",
  maxWidth: 760,
  maxHeight: "90vh",
  background: "var(--surface)",
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexShrink: 0,
  padding: "28px 28px 16px",
  borderBottom: "1px solid var(--border)",
};

const bodyStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 28px 28px",
};

const saveButtonStyle = {
  marginTop: 16,
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "var(--brand)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};
