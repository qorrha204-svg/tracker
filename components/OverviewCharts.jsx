"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/constants";

export function StatusDonut({ tasks }) {
  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([status, value]) => ({
    status,
    name: STATUS_LABEL[status] || status,
    value,
  }));

  if (data.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={STATUS_COLOR[d.status] || "#9ca3af"} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BusinessUnitProgress({ tasks }) {
  const byUnit = {};
  for (const t of tasks) {
    const key = t.business_unit || "미지정";
    if (!byUnit[key]) byUnit[key] = { sum: 0, count: 0 };
    byUnit[key].sum += t.progress_pct ?? 0;
    byUnit[key].count += 1;
  }
  const data = Object.entries(byUnit).map(([unit, { sum, count }]) => ({
    unit,
    avgProgress: count ? Math.round(sum / count) : 0,
  }));

  if (data.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="unit" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="avgProgress" fill="var(--brand)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
      표시할 데이터가 없습니다.
    </div>
  );
}
