"use client";

import { addMonths, fmtUSD, fmtDateISO, monthLabel } from "@/app/lib/format";
import { lastActiveMonth } from "@/app/lib/sold";
import type { Listing, MonthKey } from "@/app/lib/types";

function sumRange(l: Listing, start: MonthKey, end: MonthKey): number {
  let s = 0;
  for (const k in l.monthly) {
    const v = l.monthly[k];
    if (v !== null && v !== undefined && k >= start && k <= end) s += v;
  }
  return s;
}

// Roll multiple listings into a single synthetic listing (summed monthly).
function mergeListings(id: string, name: string, list: Listing[]): Listing {
  const monthly: Record<MonthKey, number | null> = {};
  for (const l of list) {
    for (const k in l.monthly) {
      const v = l.monthly[k];
      if (v === null || v === undefined) continue;
      monthly[k] = (monthly[k] ?? 0) + v;
    }
  }
  return {
    ...list[0],
    id,
    name,
    monthly,
    total: list.reduce((s, l) => s + l.total, 0),
    mergedFrom: list.map((l) => l.id),
  };
}

// Collapse all "Fletcher" listings into one property for this table.
function groupFletcher(listings: Listing[]): Listing[] {
  const isFletcher = (l: Listing) => /fletcher/i.test(l.name);
  const fletcher = listings.filter(isFletcher);
  if (fletcher.length <= 1) return listings;
  const others = listings.filter((l) => !isFletcher(l));
  return [...others, mergeListings("fletcher-group", "261 Fletcher St", fletcher)];
}

export default function SoldTable({
  soldListings,
  soldOn,
  soldDate,
  included,
  onToggleIncluded,
}: {
  soldListings: Listing[];
  soldOn: Map<string, MonthKey | undefined>;
  soldDate: Map<string, string | undefined>;
  included: boolean;
  onToggleIncluded: () => void;
}) {
  const rows = groupFletcher(soldListings)
    .map((l) => {
      const last = lastActiveMonth(l);
      const allTime = l.total;
      const last12 = last ? sumRange(l, addMonths(last, -11), last) : 0;
      return { l, last, allTime, last12, soldOn: soldOn.get(l.id), soldDate: soldDate.get(l.id) };
    })
    .sort((a, b) => b.allTime - a.allTime);

  const totalAllTime = rows.reduce((s, r) => s + r.allTime, 0);
  const totalLast12 = rows.reduce((s, r) => s + r.last12, 0);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Sold / off-boarded properties
          </h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Revenue that won’t recur going forward. Edit the list in{" "}
            <span className="font-mono">app/lib/sold.ts</span>.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
          <span className="text-ink-600">Include sold in all data</span>
          <button
            type="button"
            role="switch"
            aria-checked={included}
            onClick={onToggleIncluded}
            className={`relative h-5 w-9 rounded-full transition ${
              included ? "bg-accent" : "bg-ink-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                included ? "left-[1.125rem]" : "left-0.5"
              }`}
            />
          </button>
          <span className={included ? "text-emerald-700" : "text-rose-700"}>
            {included ? "On" : "Off"}
          </span>
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-4 text-xs text-ink-600">No properties marked as sold.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Property</th>
                <th className="px-3 py-2 text-left font-medium">City</th>
                <th className="px-3 py-2 text-left font-medium">Sold / last active</th>
                <th className="px-3 py-2 text-right font-medium">Last 12 mo</th>
                <th className="px-4 py-2 text-right font-medium">All-time revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.l.id} className="border-t border-ink-700 hover:bg-ink-800/40">
                  <td className="px-4 py-2 text-slate-700">
                    {r.l.name}
                    {r.l.mergedFrom && r.l.mergedFrom.length > 1 && (
                      <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">
                        {r.l.mergedFrom.length} listings
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-600">{r.l.city}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {r.soldDate ? (
                      <span className="text-slate-700">sold {fmtDateISO(r.soldDate)}</span>
                    ) : r.soldOn ? (
                      <>sold {monthLabel(r.soldOn)}</>
                    ) : r.last ? (
                      <>last active {monthLabel(r.last)}</>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="tnum px-3 py-2 text-right text-slate-500">{fmtUSD(r.last12)}</td>
                  <td className="tnum px-4 py-2 text-right text-slate-800">{fmtUSD(r.allTime)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink-600 bg-ink-800/60 font-semibold text-slate-900">
                <td className="px-4 py-2.5" colSpan={3}>
                  {rows.length} sold {rows.length === 1 ? "property" : "properties"}
                </td>
                <td className="tnum px-3 py-2.5 text-right">{fmtUSD(totalLast12)}</td>
                <td className="tnum px-4 py-2.5 text-right">{fmtUSD(totalAllTime)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
