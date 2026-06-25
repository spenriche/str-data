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
import type { ForecastPoint } from "@/app/lib/analytics";

export default function ForecastChart({ points }: { points: ForecastPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
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
            formatter={(v: number, name) => {
              if (name === "band" || name === "loBase") return [undefined, undefined] as never;
              return [fmtUSD(v), name === "forecast" ? "Forecast (est.)" : "Actual"];
            }}
          />
          {/* Confidence band: transparent base + stacked emerald span */}
          <Area
            type="monotone"
            dataKey="loBase"
            stackId="ci"
            stroke="none"
            fill="transparent"
            connectNulls={false}
            isAnimationActive={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="band"
            stackId="ci"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.12}
            connectNulls={false}
            isAnimationActive={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#actualFill)"
            connectNulls={false}
            dot={false}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10b981"
            strokeWidth={2.5}
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
