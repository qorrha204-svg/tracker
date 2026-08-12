import Link from "next/link";

const CARD_DEFS = [
  { key: "total", label: "전체 과제", href: "/tasks?view=table" },
  { key: "on_track", label: "진행중", href: "/tasks?view=table&status=on_track" },
  { key: "done", label: "완료", href: "/tasks?view=table&status=done" },
  { key: "hold", label: "보류", href: "/tasks?view=table&status=hold" },
  { key: "decisionNeeded", label: "대표이사 의사결정", href: "/tasks?view=table&decision=1", highlight: true },
];

export default function StatCards({ stats }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
      {CARD_DEFS.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          className="card"
          style={{
            display: "block",
            padding: 16,
            borderColor: c.highlight && stats[c.key] > 0 ? "var(--status-delayed)" : "var(--border)",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{c.label}</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginTop: 4,
              color: c.highlight && stats[c.key] > 0 ? "var(--status-delayed)" : "var(--foreground)",
            }}
          >
            {stats[c.key] ?? 0}
          </div>
        </Link>
      ))}
    </div>
  );
}
