"use client";

import { useEffect, useRef, useState } from "react";

// Column header with click-to-sort (asc → desc → none) and an optional
// multi-select filter dropdown, similar to a spreadsheet/database column.
export default function FilterableTh({ label, sortDir, onSort, options, selected = null, onChange, align, minWidth }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isFiltered = Boolean(options) && selected !== null && selected.size > 0;

  function isChecked(value) {
    return selected === null || selected.has(value);
  }

  function toggleValue(value) {
    const base = selected === null ? new Set(options.map((o) => o.value)) : new Set(selected);
    if (base.has(value)) base.delete(value);
    else base.add(value);
    onChange(base);
  }

  return (
    <th style={{ padding: "10px 12px", fontWeight: 600, fontSize: 12, minWidth, whiteSpace: "nowrap", textAlign: align || "left" }}>
      <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 4, position: "relative" }}>
        <button onClick={onSort} style={sortButtonStyle}>
          {label}
        </button>

        {options && (
          <button
            onClick={() => setOpen((o) => !o)}
            style={{ ...filterButtonStyle, color: isFiltered ? "var(--brand)" : "var(--muted)" }}
            title="필터"
          >
            {open ? "▲" : "▼"}
          </button>
        )}

        <button onClick={onSort} style={{ ...filterButtonStyle, color: sortDir ? "var(--brand)" : "var(--muted)" }} title="정렬">
          {sortDir === "desc" ? "↓" : "↑"}
        </button>

        {options && (
          <>
            {open && (
              <div style={popoverStyle} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onChange(null)} style={resetLinkStyle}>
                  전체 선택
                </button>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {options.map((o) => (
                    <label key={o.value} style={optionRowStyle}>
                      <input type="checkbox" checked={isChecked(o.value)} onChange={() => toggleValue(o.value)} />
                      <span style={{ flex: 1, fontWeight: 400 }}>{o.label}</span>
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}>{o.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </th>
  );
}

const sortButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  border: "none",
  background: "none",
  padding: 0,
  fontSize: 12,
  fontWeight: 600,
  color: "inherit",
  cursor: "pointer",
};

const filterButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  border: "1px solid var(--border)",
  borderRadius: 4,
  background: "var(--surface)",
  padding: 0,
  fontSize: 10,
  lineHeight: 1,
  cursor: "pointer",
};

const popoverStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 4,
  minWidth: 160,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  padding: 8,
  zIndex: 20,
  fontSize: 13,
  fontWeight: 400,
};

const resetLinkStyle = {
  display: "block",
  border: "none",
  background: "none",
  color: "var(--brand)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  padding: "4px 4px 8px",
};

const optionRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 4px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
