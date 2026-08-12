import StatusBadge from "@/components/StatusBadge";
import { BOARD_LABEL } from "@/lib/constants";

// Board-style card grid for decision-pending tasks — used on the overview
// dashboard (clickable, opens the task modal) and in the printable CEO
// report (static, no onOpenTask).
export default function DecisionCards({ tasks, onOpenTask }) {
  if (tasks.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--muted)" }}>현재 의사결정 대기 중인 과제가 없습니다.</p>;
  }

  return (
    <div style={gridStyle}>
      {tasks.map((t) => {
        const clickable = Boolean(onOpenTask);
        return (
          <div
            key={t.id}
            onClick={clickable ? () => onOpenTask(t) : undefined}
            className="card"
            style={{ ...cardStyle, cursor: clickable ? "pointer" : "default" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge status={t.status} />
              <span style={boardTagStyle}>{BOARD_LABEL[t.board] || t.board}</span>
            </div>

            <div style={titleStyle}>{t.title}</div>

            <div style={metaStyle}>
              {t.business_unit} · {t.owner_dept || "-"}
            </div>

            <p style={flagStyle}>
              <strong style={{ color: "var(--status-hold)" }}>Flag </strong>
              {t.decision_risk_flag}
            </p>

            {t.ceo_comment && (
              <p style={commentStyle}>
                <strong>CEO Comment </strong>
                {t.ceo_comment}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 12,
  alignItems: "start",
};

const cardStyle = {
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const boardTagStyle = {
  fontSize: 11,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 999,
  background: "var(--brand-soft)",
  color: "var(--brand)",
  whiteSpace: "nowrap",
};

const titleStyle = {
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.4,
};

const metaStyle = {
  fontSize: 12,
  color: "var(--muted)",
};

const flagStyle = {
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 2,
};

const commentStyle = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--muted)",
  borderTop: "1px solid var(--border)",
  paddingTop: 6,
  marginTop: 2,
};
