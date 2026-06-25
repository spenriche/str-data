"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCompact, fmtUSD } from "@/app/lib/format";
import type { CityTotal } from "@/app/lib/analytics";

const COLORS = ["#3b82f6", "#0ea5e9", "#6366f1", "#8b5cf6", "#10b981", "#14b8a6", "#f59e0b", "#f43f5e", "#ec4899", "#84cc16"];

export default function CityBreakdownChart({ data }: { data: CityTotal[] }) {
  const height = Math.max(180, data.length * 30 + 24);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => fmtCompact(v)}
            tick={{ fill: "#64748b", fontSize: 11 }}
            stroke="#cbd5e1"
          />
          <YAxis
            type="category"
            dataKey="city"
            tick={{ fill: "#475569", fontSize: 11 }}
            width={92}
            stroke="#cbd5e1"
          />
          <Tooltip
            cursor={{ fill: "#0f172a08" }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 12,
              color: "#0f172a",
            }}
            formatter={(v: number) => [fmtUSD(v), "Revenue"]}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
