"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { removeUser } from "@/lib/admin-actions";
import { ROLE_LABEL, ROLE_OPTIONS } from "@/lib/constants";

export default function UserAdmin({ initialProfiles, currentUserId }) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);

  async function handleRoleChange(id, role) {
    setSavingId(id);
    setError(null);
    const { error: err } = await supabase.from("profiles").update({ role }).eq("id", id);
    setSavingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
  }

  async function handleRemove(p) {
    const confirmed = window.confirm(`${p.name || p.email} 계정을 추방하시겠습니까? 로그인이 즉시 차단되며 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setRemovingId(p.id);
    setError(null);
    const result = await removeUser(p.id);
    setRemovingId(null);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setProfiles((prev) => prev.filter((row) => row.id !== p.id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>사용자 권한 관리</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          가입한 사내 계정의 권한을 조정합니다. 신규 가입자는 기본 권한으로 시작하며, 과제 생성·본인 과제 수정이 가능합니다.
          관리자/CEO는 계정을 추방(삭제)할 수 있습니다.
        </p>
      </div>

      {error && <p style={{ color: "var(--status-delayed)", fontSize: 13 }}>{error}</p>}

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
              <th style={thStyle}>이름</th>
              <th style={thStyle}>이메일</th>
              <th style={thStyle}>가입일</th>
              <th style={thStyle}>권한</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdStyle}>{p.name || "-"}</td>
                <td style={tdStyle}>{p.email}</td>
                <td style={tdStyle}>{new Date(p.created_at).toLocaleDateString("ko-KR")}</td>
                <td style={tdStyle}>
                  <select
                    value={p.role}
                    disabled={savingId === p.id || p.id === currentUserId}
                    onChange={(e) => handleRoleChange(p.id, e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r] || "기본"}
                      </option>
                    ))}
                  </select>
                  {p.id === currentUserId && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}>(본인)</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {p.id !== currentUserId && (
                    <button onClick={() => handleRemove(p)} disabled={removingId === p.id} style={removeButtonStyle}>
                      {removingId === p.id ? "추방 중..." : "추방"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: "10px 12px", fontWeight: 600, fontSize: 12 };
const tdStyle = { padding: "10px 12px" };

const removeButtonStyle = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid var(--status-delayed)",
  background: "none",
  color: "var(--status-delayed)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
