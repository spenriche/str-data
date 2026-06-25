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
import type { ForecastLayerRow } from "@/app/lib/analytics";

// Older years lighter → newer years darker; forecast is emerald.
const YEAR_COLORS = ["#cbd5e1", "#94a3b8", "#475569"];

export default function ForecastSeasonChart({
  data,
  years,
}: {
  data: ForecastLayerRow[];
  years: number[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: 11 }}
            minTickGap={12}
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
            formatter={(v: number, name) => [
              fmtUSD(v),
              name === "forecast" ? "Forecast (est.)" : String(name).replace(/^y/, ""),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(v) => (v === "forecast" ? "Forecast" : String(v).replace(/^y/, ""))}
          />
          {years.map((yr, i) => (
            <Line
              key={yr}
              type="monotone"
              dataKey={`y${yr}`}
              stroke={YEAR_COLORS[i] ?? "#94a3b8"}
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          ))}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10b981"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={{ r: 2, fill: "#10b981" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
