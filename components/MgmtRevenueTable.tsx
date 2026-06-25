"use client";

import { fmtUSD, shortMonthLabel } from "@/app/lib/format";
import type { ForecastPoint } from "@/app/lib/analytics";

const CLEANING_RATE = 0.15;
const MGMT_RATE = 0.175;

export default function MgmtRevenueTable({ points }: { points: ForecastPoint[] }) {
  const cols = points
    .filter((p) => p.actual === null && p.forecast !== null)
    .map((p) => {
      const gross = p.forecast ?? 0;
      const cleaning = gross * CLEANING_RATE;
      const net = gross - cleaning;
      const mgmtFee = net * MGMT_RATE;
      return { key: p.key, gross, cleaning, net, mgmtFee };
    });

  const total = cols.reduce(
    (a, c) => ({
      gross: a.gross + c.gross,
      cleaning: a.cleaning + c.cleaning,
      net: a.net + c.net,
      mgmtFee: a.mgmtFee + c.mgmtFee,
    }),
    { gross: 0, cleaning: 0, net: 0, mgmtFee: 0 }
  );

  const metricRows: {
    label: string;
    pick: (c: (typeof cols)[number]) => number;
    total: number;
    cls: string;
    sign?: string;
  }[] = [
    { label: "Forecast revenue", pick: (c) => c.gross, total: total.gross, cls: "text-slate-700" },
    {
      label: "Cleaning (15%)",
      pick: (c) => c.cleaning,
      total: total.cleaning,
      cls: "text-rose-700",
      sign: "−",
    },
    { label: "Net after cleaning", pick: (c) => c.net, total: total.net, cls: "text-slate-500" },
    {
      label: "Mgmt fee (17.5%)",
      pick: (c) => c.mgmtFee,
      total: total.mgmtFee,
      cls: "font-semibold text-emerald-700",
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Sure Home Stays US Inc — projected management revenue
        </h2>
        <p className="mt-0.5 text-xs text-ink-600">
          Forecast revenue less {Math.round(CLEANING_RATE * 100)}% cleaning, then a{" "}
          {(MGMT_RATE * 100).toFixed(1)}% management fee on the remainder. Next 12 months.
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
              {metricRows.map((row) => (
                <tr key={row.label} className="group border-t border-ink-800 hover:bg-ink-800/40">
                  <td className="sticky left-0 z-10 bg-ink-900 px-4 py-2 text-slate-700 group-hover:bg-ink-800">
                    {row.label}
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className={`tnum whitespace-nowrap px-3 py-2 text-right ${row.cls}`}>
                      {row.sign}
                      {fmtUSD(row.pick(c))}
                    </td>
                  ))}
                  <td
                    className={`tnum sticky right-0 z-10 whitespace-nowrap bg-ink-900 px-4 py-2 text-right group-hover:bg-ink-800 ${row.cls}`}
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
