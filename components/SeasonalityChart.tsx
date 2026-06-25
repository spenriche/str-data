"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCompact, fmtUSD } from "@/app/lib/format";
import type { SeasonRow } from "@/app/lib/analytics";

const YEAR_COLORS = [
  "#64748b",
  "#0ea5e9",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#a855f7",
];

export default function SeasonalityChart({
  rows,
  years,
}: {
  rows: SeasonRow[];
  years: number[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} stroke="#cbd5e1" />
          <YAxis
            tickFormatter={(v) => fmtCompact(v)}
            tick={{ fill: "#64748b", fontSize: 11 }}
            width={54}
            stroke="#cbd5e1"
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 12,
              color: "#0f172a",
            }}
            formatter={(v: number, name) => [fmtUSD(v), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {years.map((y, i) => (
            <Line
              key={y}
              type="monotone"
              dataKey={String(y)}
              stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
              strokeWidth={i === years.length - 1 ? 2.5 : 1.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
