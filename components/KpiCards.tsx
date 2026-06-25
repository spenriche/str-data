"use client";

import { fmtUSD, fmtCompact, monthLabel } from "@/app/lib/format";
import type { Kpis } from "@/app/lib/analytics";
import { Delta } from "./ui";

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-600">{label}</div>
      <div className="tnum mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  const ref = kpis.refMonth ? monthLabel(kpis.refMonth) : "—";
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Card
        label="Revenue (range)"
        value={fmtCompact(kpis.totalRevenue)}
        sub={fmtUSD(kpis.totalRevenue)}
      />
      <Card
        label={`Latest month · ${ref}`}
        value={fmtCompact(kpis.refRevenue)}
        sub={<span>MoM <Delta value={kpis.momPct} /></span>}
      />
      <Card
        label="YoY (latest month)"
        value={<Delta value={kpis.yoyPct} className="text-2xl" />}
        sub={`vs same month prior year`}
      />
      <Card
        label="Trailing 12 mo"
        value={fmtCompact(kpis.t12m)}
        sub={<span>YoY <Delta value={kpis.t12mYoyPct} /></span>}
      />
      <Card
        label="Active units"
        value={kpis.activeUnits}
        sub={`${kpis.activeCities} cities`}
      />
      <Card
        label="Avg / unit (latest)"
        value={fmtCompact(kpis.avgRevPerUnit)}
        sub={`per active listing`}
      />
    </div>
  );
}
