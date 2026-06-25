"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { fmtUSD, shortMonthLabel } from "@/app/lib/format";
import type { CityGroup, UnitRow } from "@/app/lib/analytics";
import type { MonthKey } from "@/app/lib/types";

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

function UnitDetail({ row, months }: { row: UnitRow; months: MonthKey[] }) {
  const data = months
    .map((m) => ({ key: m, value: row.monthly[m] ?? 0 }))
    .filter((d) => d.value !== 0);
  return (
    <div className="bg-ink-950/60 px-4 py-3">
      <div className="mb-2 flex items-center gap-3 text-xs text-ink-600">
        <span>Monthly revenue</span>
        {row.url && (
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open in Guesty ↗
          </a>
        )}
      </div>
      <div className="h-28 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="key"
              tickFormatter={shortMonthLabel}
              tick={{ fill: "#64748b", fontSize: 10 }}
              minTickGap={24}
              stroke="#cbd5e1"
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 12,
                color: "#0f172a",
              }}
              labelFormatter={(l) => shortMonthLabel(String(l))}
              formatter={(v: number) => [fmtUSD(v), "Revenue"]}
              cursor={{ fill: "#0f172a08" }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function UnitTable({
  groups,
  grandAnnual,
  grandTotal,
  years,
  months,
}: {
  groups: CityGroup[];
  grandAnnual: Record<number, number>;
  grandTotal: number;
  years: number[];
  months: MonthKey[];
}) {
  const [openCities, setOpenCities] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.city))
  );
  const [openUnit, setOpenUnit] = useState<string | null>(null);

  const exportRows = useMemo(() => {
    const header = ["City", "Unit", "Type", ...years.map(String), "Total"];
    const body: string[][] = [];
    for (const g of groups) {
      for (const u of g.units) {
        body.push([
          g.city,
          u.name,
          u.propertyType,
          ...years.map((y) => (u.annual[y] || 0).toFixed(2)),
          u.total.toFixed(2),
        ]);
      }
      body.push([
        g.city + " — SUBTOTAL",
        "",
        "",
        ...years.map((y) => (g.annual[y] || 0).toFixed(2)),
        g.total.toFixed(2),
      ]);
    }
    body.push([
      "GRAND TOTAL",
      "",
      "",
      ...years.map((y) => (grandAnnual[y] || 0).toFixed(2)),
      grandTotal.toFixed(2),
    ]);
    return [header, ...body];
  }, [groups, years, grandAnnual, grandTotal]);

  function toggleCity(city: string) {
    setOpenCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Unit-by-unit revenue · grouped by city</h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Annual totals within selected range. Click a unit for its monthly history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv("revenue-by-unit.csv", exportRows)}
            className="rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-1.5 text-xs text-slate-800 hover:border-ink-600"
          >
            Export CSV
          </button>
          <button
            onClick={() =>
              setOpenCities((prev) =>
                prev.size === groups.length ? new Set() : new Set(groups.map((g) => g.city))
              )
            }
            className="rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-1.5 text-xs text-slate-800 hover:border-ink-600"
          >
            {openCities.size === groups.length ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 bg-ink-900 text-[11px] uppercase tracking-wider text-ink-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Unit</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              {years.map((y) => (
                <th key={y} className="px-3 py-2 text-right font-medium">
                  {y}
                </th>
              ))}
              <th className="px-4 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const open = openCities.has(g.city);
              return (
                <CityBlock
                  key={g.city}
                  g={g}
                  open={open}
                  years={years}
                  months={months}
                  openUnit={openUnit}
                  onToggleCity={() => toggleCity(g.city)}
                  onToggleUnit={(id) => setOpenUnit((cur) => (cur === id ? null : id))}
                />
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink-600 bg-ink-800/60 font-semibold text-slate-900">
              <td className="px-4 py-2.5">Grand total</td>
              <td />
              {years.map((y) => (
                <td key={y} className="tnum px-3 py-2.5 text-right">
                  {fmtUSD(grandAnnual[y] || 0)}
                </td>
              ))}
              <td className="tnum px-4 py-2.5 text-right">{fmtUSD(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function CityBlock({
  g,
  open,
  years,
  months,
  openUnit,
  onToggleCity,
  onToggleUnit,
}: {
  g: CityGroup;
  open: boolean;
  years: number[];
  months: MonthKey[];
  openUnit: string | null;
  onToggleCity: () => void;
  onToggleUnit: (id: string) => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-t border-ink-700 bg-ink-800/40 hover:bg-ink-800/70"
        onClick={onToggleCity}
      >
        <td className="px-4 py-2 font-semibold text-slate-800" colSpan={2}>
          <span className="mr-2 inline-block w-3 text-ink-600">{open ? "▾" : "▸"}</span>
          {g.city}
          <span className="ml-2 text-xs font-normal text-ink-600">
            {g.units.length} unit{g.units.length === 1 ? "" : "s"}
          </span>
        </td>
        {years.map((y) => (
          <td key={y} className="tnum px-3 py-2 text-right text-slate-500">
            {g.annual[y] ? fmtUSD(g.annual[y]) : "—"}
          </td>
        ))}
        <td className="tnum px-4 py-2 text-right font-semibold text-slate-800">
          {fmtUSD(g.total)}
        </td>
      </tr>
      {open &&
        g.units.map((u) => (
          <UnitRows
            key={u.id}
            u={u}
            years={years}
            months={months}
            open={openUnit === u.id}
            onToggle={() => onToggleUnit(u.id)}
          />
        ))}
    </>
  );
}

function UnitRows({
  u,
  years,
  months,
  open,
  onToggle,
}: {
  u: UnitRow;
  years: number[];
  months: MonthKey[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-t border-ink-800 hover:bg-ink-800/40"
        onClick={onToggle}
      >
        <td className="px-4 py-2 pl-9 text-slate-700">
          <span className="mr-1 text-ink-600">{open ? "−" : "+"}</span>
          {u.name}
          {u.flagged && (
            <span
              title="Involved in a possible duplicate / merge review"
              className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
            >
              review
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-xs text-ink-600">{u.propertyType}</td>
        {years.map((y) => (
          <td key={y} className="tnum px-3 py-2 text-right text-slate-500">
            {u.annual[y] ? fmtUSD(u.annual[y]) : "—"}
          </td>
        ))}
        <td className="tnum px-4 py-2 text-right text-slate-800">{fmtUSD(u.total)}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={years.length + 3} className="p-0">
            <UnitDetail row={u} months={months} />
          </td>
        </tr>
      )}
    </>
  );
}
