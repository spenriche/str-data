"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCompact, fmtUSD, shortMonthLabel } from "@/app/lib/format";
import type { TrendPoint } from "@/app/lib/analytics";

interface Row {
  key: string;
  revenue: number | null;
  ma3: number | null;
  forecast: number | null;
}

export default function RevenueTrendChart({
  trend,
  forecast,
}: {
  trend: TrendPoint[];
  forecast: TrendPoint[];
}) {
  const rows: Row[] = trend.map((p) => ({
    key: p.key,
    revenue: p.revenue,
    ma3: p.ma3,
    forecast: null,
  }));
  // Connect the forecast line to the last actual point.
  if (rows.length && forecast.length) {
    rows[rows.length - 1].forecast = rows[rows.length - 1].revenue;
  }
  for (const f of forecast) {
    rows.push({ key: f.key, revenue: null, ma3: null, forecast: f.forecast });
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="key"
            tickFormatter={shortMonthLabel}
            tick={{ fill: "#64748b", fontSize: 11 }}
            minTickGap={28}
            stroke="#cbd5e1"
          />
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
            labelFormatter={(l) => shortMonthLabel(String(l))}
            formatter={(v: number, name) => [fmtUSD(v), name === "forecast" ? "Forecast (est.)" : name === "ma3" ? "3-mo avg" : "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#revFill)"
            connectNulls={false}
            dot={false}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="ma3"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            name="3-mo avg"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
            name="forecast"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
