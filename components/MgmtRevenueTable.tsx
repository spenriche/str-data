"use client";

import { fmtUSD, shortMonthLabel } from "@/app/lib/format";
import type { ForecastPoint } from "@/app/lib/analytics";

const CLEANING_RATE = 0.15;
const MGMT_RATE = 0.175;
const MAIN_FEE = 1575; // flat monthly 822 Main fee earned by the entity

// Fixed monthly operating expenses for the management entity.
const FIXED_EXPENSES: { label: string; monthly: number }[] = [
  { label: "HAs", monthly: 3870 },
  { label: "Dues, Memberships", monthly: 2239 },
  { label: "Insurance", monthly: 255 },
  { label: "General Admin", monthly: 550 },
  { label: "Accounting", monthly: 250 },
];
const FIXED_TOTAL = FIXED_EXPENSES.reduce((s, e) => s + e.monthly, 0);

type Row = {
  label: string;
  values: number[];
  total: number;
  cls: string;
  sign?: string;
  rule?: "thin" | "thick";
  isNet?: boolean;
};

export default function MgmtRevenueTable({ points }: { points: ForecastPoint[] }) {
  const cols = points
    .filter((p) => p.actual === null && p.forecast !== null)
    .map((p) => {
      const gross = p.forecast ?? 0;
      const cleaning = gross * CLEANING_RATE;
      const net = gross - cleaning;
      const mgmtFee = net * MGMT_RATE;
      return { key: p.key, gross, cleaning, net, mgmtFee, profit: mgmtFee + MAIN_FEE - FIXED_TOTAL };
    });

  const n = cols.length;
  const sum = (pick: (c: (typeof cols)[number]) => number) =>
    cols.reduce((s, c) => s + pick(c), 0);

  const rows: Row[] = [
    { label: "Forecast revenue", values: cols.map((c) => c.gross), total: sum((c) => c.gross), cls: "text-slate-700" },
    { label: "Cleaning (15%)", values: cols.map((c) => c.cleaning), total: sum((c) => c.cleaning), cls: "text-rose-700", sign: "−" },
    { label: "Net after cleaning", values: cols.map((c) => c.net), total: sum((c) => c.net), cls: "text-slate-500" },
    { label: "822 Main Fee", values: cols.map(() => MAIN_FEE), total: MAIN_FEE * n, cls: "text-emerald-700" },
    { label: "Management revenue (17.5%)", values: cols.map((c) => c.mgmtFee + MAIN_FEE), total: sum((c) => c.mgmtFee) + MAIN_FEE * n, cls: "font-semibold text-emerald-700" },
    ...FIXED_EXPENSES.map((e, i) => ({
      label: e.label,
      values: cols.map(() => e.monthly),
      total: e.monthly * n,
      cls: "text-rose-700",
      sign: "−",
      rule: i === 0 ? ("thin" as const) : undefined,
    })),
    { label: "Total fixed expenses", values: cols.map(() => FIXED_TOTAL), total: FIXED_TOTAL * n, cls: "font-medium text-rose-700", sign: "−", rule: "thin" },
    { label: "Est. net profit", values: cols.map((c) => c.profit), total: sum((c) => c.mgmtFee) + MAIN_FEE * n - FIXED_TOTAL * n, cls: "font-semibold", rule: "thick", isNet: true },
  ];

  const ruleCls = (rule?: "thin" | "thick") =>
    rule === "thick" ? "border-t-2 border-ink-600" : rule === "thin" ? "border-t border-ink-700" : "border-t border-ink-800";

  const cellColor = (row: Row, value: number) =>
    row.isNet ? (value >= 0 ? "text-emerald-700" : "text-rose-700") : row.cls;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Sure Home Stays US Inc — projected management revenue
        </h2>
        <p className="mt-0.5 text-xs text-ink-600">
          Forecast revenue less {Math.round(CLEANING_RATE * 100)}% cleaning, then a{" "}
          {(MGMT_RATE * 100).toFixed(1)}% management fee plus the 822 Main fee, less fixed operating
          expenses = estimated net profit. Next 12 months.
        </p>
      </div>

      {cols.length === 0 ? (
        <p className="px-4 py-4 text-xs text-ink-600">No forecast available for current filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-600">
              <tr>
                <th className="sticky left-0 z-10 bg-ink-900 px-4 py-2 text-left font-medium">
                  Metric
                </th>
                {cols.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    {shortMonthLabel(c.key)}
                  </th>
                ))}
                <th className="sticky right-0 z-10 bg-ink-900 px-4 py-2 text-right font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="group hover:bg-ink-800/40">
                  <td
                    className={`sticky left-0 z-10 bg-ink-900 px-4 py-2 text-slate-700 group-hover:bg-ink-800 ${ruleCls(row.rule)} ${row.isNet ? "font-semibold text-slate-900" : ""}`}
                  >
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={cols[i].key}
                      className={`tnum whitespace-nowrap px-3 py-2 text-right ${ruleCls(row.rule)} ${cellColor(row, v)}`}
                    >
                      {row.sign}
                      {fmtUSD(v)}
                    </td>
                  ))}
                  <td
                    className={`tnum sticky right-0 z-10 whitespace-nowrap bg-ink-900 px-4 py-2 text-right group-hover:bg-ink-800 ${ruleCls(row.rule)} ${cellColor(row, row.total)}`}
                  >
                    {row.sign}
                    {fmtUSD(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
