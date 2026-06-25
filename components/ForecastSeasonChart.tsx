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
    <>
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

      <details className="group mt-2 border-t border-ink-700 pt-2 text-xs text-ink-600">
        <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-slate-700 hover:text-slate-900">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span>
          How this is calculated
        </summary>
        <div className="mt-2 space-y-2 pl-4 leading-relaxed">
          <p>
            <span className="font-medium text-slate-700">Forecast (dashed line).</span> An additive{" "}
            <span className="font-medium">Holt-Winters</span> model: it decomposes the monthly
            portfolio revenue into <em>level</em> + <em>trend</em> + a 12-month{" "}
            <em>seasonal</em> pattern, then projects each forward.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Fit on the most recent <span className="font-medium">36 months</span> of the currently
              filtered series, so the early portfolio ramp-up (near-zero months years ago) doesn&apos;t
              distort the level or seasonality.
            </li>
            <li>
              Smoothing parameters (α level, β trend, γ seasonal) are{" "}
              <span className="font-medium">auto-tuned</span> by grid search to minimize one-step-ahead
              error on your own history.
            </li>
            <li>
              The trend is <span className="font-medium">damped</span> (φ = 0.85) so a 12-month
              projection can&apos;t run away, and values are floored at $0 and capped at 2.5× the recent
              monthly peak as a safety bound.
            </li>
          </ul>
          <p>
            <span className="font-medium text-slate-700">Prior-year lines (solid).</span> The actual
            recorded revenue for the <em>same calendar month</em> in each of the last 3 years, drawn
            from the same filtered listings — for a direct year-over-year sanity check of the forecast.
          </p>
          <p className="text-ink-600">
            Everything respects the active filters (date range, city, unit, type, entity, and the
            Active-only / sold toggle). Source metric: Total Host Payout.
          </p>
        </div>
      </details>
    </>
  );
}
