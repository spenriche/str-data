"use client";

import { useMemo, useState } from "react";
import { fmtNum, monthLabel, shortMonthLabel } from "@/app/lib/format";
import type { Listing, MonthKey } from "@/app/lib/types";

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MonthlyMatrixTable({
  listings,
  months,
}: {
  listings: Listing[];
  months: MonthKey[];
}) {
  const [query, setQuery] = useState("");

  const { rows, colTotals, grandTotal } = useMemo(() => {
    const rows = listings
      .map((l) => {
        const cells = months.map((m) => {
          const v = l.monthly[m];
          return v === null || v === undefined ? null : v;
        });
        const total = cells.reduce<number>((s, v) => s + (v ?? 0), 0);
        return { id: l.id, name: l.name, cells, total };
      })
      .filter((r) => r.total !== 0)
      .sort((a, b) => b.total - a.total);

    const colTotals = months.map((_, i) =>
      rows.reduce<number>((s, r) => s + (r.cells[i] ?? 0), 0)
    );
    const grandTotal = rows.reduce<number>((s, r) => s + r.total, 0);
    return { rows, colTotals, grandTotal };
  }, [listings, months]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const exportRows = useMemo(() => {
    const header = ["Unit", ...months.map(monthLabel), "Total"];
    const body = rows.map((r) => [
      r.name,
      ...r.cells.map((v) => (v == null ? "" : v.toFixed(2))),
      r.total.toFixed(2),
    ]);
    const totalRow = ["Total", ...colTotals.map((v) => v.toFixed(2)), grandTotal.toFixed(2)];
    return [header, ...body, totalRow];
  }, [rows, months, colTotals, grandTotal]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Monthly Revenue by Unit</h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Raw month-over-month values (selected period) for data verification. Blank = no data that month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search units…"
            className="rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-1.5 text-xs text-slate-800 placeholder:text-ink-600 focus:border-ink-600 focus:outline-none"
          />
          <button
            onClick={() => downloadCsv("monthly-revenue-by-unit.csv", exportRows)}
            className="rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-1.5 text-xs text-slate-800 hover:border-ink-600"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-600">
            <tr>
              <th className="sticky left-0 z-20 bg-ink-900 px-4 py-2 text-left font-medium">
                Unit
              </th>
              {months.map((m) => (
                <th key={m} className="whitespace-nowrap px-3 py-2 text-right font-medium">
                  {shortMonthLabel(m)}
                </th>
              ))}
              <th className="sticky right-0 z-20 bg-ink-900 px-4 py-2 text-right font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="group border-t border-ink-800 hover:bg-ink-800/40">
                <td className="sticky left-0 z-10 truncate border-t border-ink-800 bg-ink-900 px-4 py-1.5 text-slate-700 group-hover:bg-ink-800">
                  {r.name}
                </td>
                {r.cells.map((v, i) => (
                  <td
                    key={i}
                    className="tnum whitespace-nowrap px-3 py-1.5 text-right text-slate-500"
                  >
                    {v == null ? <span className="text-ink-700">—</span> : fmtNum(v)}
                  </td>
                ))}
                <td className="tnum sticky right-0 z-10 whitespace-nowrap border-t border-ink-800 bg-ink-900 px-4 py-1.5 text-right font-medium text-slate-800 group-hover:bg-ink-800">
                  {fmtNum(r.total)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={months.length + 2} className="px-4 py-4 text-ink-600">
                  No units match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink-600 bg-ink-800/60 font-semibold text-slate-900">
              <td className="sticky left-0 z-10 bg-ink-800 px-4 py-2">Total</td>
              {colTotals.map((v, i) => (
                <td key={i} className="tnum whitespace-nowrap px-3 py-2 text-right">
                  {fmtNum(v)}
                </td>
              ))}
              <td className="tnum sticky right-0 z-10 whitespace-nowrap bg-ink-800 px-4 py-2 text-right">
                {fmtNum(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
