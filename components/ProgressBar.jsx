export default function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand)" }} />
      </div>
      <span style={{ fontSize: 12, color: "var(--muted)", width: 32, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}
