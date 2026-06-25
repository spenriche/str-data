"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtUSD, fmtDateISO } from "@/app/lib/format";
import { PROPERTIES, entityColorClass, type PropertyMeta } from "@/app/lib/entities";
import { Delta } from "./ui";

const LS_KEY = "r2-holdings-sold-v1";

interface SoldEntry {
  price?: number;
  date?: string;
}
type SoldMap = Record<string, SoldEntry>;

function useSoldStore() {
  const [store, setStore] = useState<SoldMap>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setStore(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const update = (key: string, entry: SoldEntry) => {
    setStore((prev) => {
      const next = { ...prev };
      const merged = { ...next[key], ...entry };
      if (merged.price === undefined && !merged.date) delete next[key];
      else next[key] = merged;
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  const clear = (key: string) => {
    setStore((prev) => {
      const next = { ...prev };
      delete next[key];
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return { store, update, clear };
}

export default function HoldingsTable({
  revenueByListingId,
  entityFilter,
}: {
  revenueByListingId: Map<string, number>;
  entityFilter: string[];
}) {
  const { store, update, clear } = useSoldStore();

  const rows = useMemo(() => {
    const sel = new Set(entityFilter);
    return PROPERTIES.filter((p) => sel.size === 0 || sel.has(p.entity)).map((p) => {
      const income = p.listingIds.reduce((s, id) => s + (revenueByListingId.get(id) ?? 0), 0);
      const value = p.avgEstimate ?? 0;
      const unrealized = value - p.purchasePrice;
      const unrealizedPct = p.purchasePrice ? unrealized / p.purchasePrice : null;
      const sold = store[p.address];
      const realized =
        sold?.price !== undefined ? sold.price - p.purchasePrice : null;
      return { p, income, value, unrealized, unrealizedPct, sold, realized };
    });
  }, [store, revenueByListingId, entityFilter]);

  const totals = rows.reduce(
    (a, r) => ({
      cost: a.cost + r.p.purchasePrice,
      value: a.value + r.value,
      income: a.income + r.income,
      unrealized: a.unrealized + r.unrealized,
    }),
    { cost: 0, value: 0, income: 0, unrealized: 0 }
  );

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Holdings · ownership, acquisition &amp; valuation
        </h2>
        <p className="mt-0.5 text-xs text-ink-600">
          Purchase cost vs current Zillow/Redfin estimates and income to date. Record a sale
          (price + date) when one happens — saved in your browser.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-ink-700 md:grid-cols-4">
        {[
          { label: "Total purchase cost", value: fmtUSD(totals.cost) },
          { label: "Est. current value", value: fmtUSD(totals.value) },
          { label: "Unrealized gain", value: fmtUSD(totals.unrealized) },
          { label: "Income to date", value: fmtUSD(totals.income) },
        ].map((k) => (
          <div key={k.label} className="bg-white px-4 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-ink-600">{k.label}</div>
            <div className="tnum mt-0.5 text-lg font-semibold text-slate-900">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Entity</th>
              <th className="px-3 py-2 text-left font-medium">Property</th>
              <th className="px-3 py-2 text-left font-medium">Purchased</th>
              <th className="px-3 py-2 text-right font-medium">Purchase</th>
              <th className="px-3 py-2 text-right font-medium">Est. value</th>
              <th className="px-3 py-2 text-right font-medium">Unrealized</th>
              <th className="px-3 py-2 text-right font-medium">Income</th>
              <th className="px-3 py-2 text-left font-medium">Record sale</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, income, value, unrealized, unrealizedPct, sold, realized }) => (
              <tr key={p.address} className="border-t border-ink-700 align-top hover:bg-ink-800/40">
                <td className={`px-4 py-2 text-xs font-medium ${entityColorClass(p.entity)}`}>
                  {p.entity}
                </td>
                <td className="px-3 py-2">
                  <div className="text-slate-700">{p.address}</div>
                  <div className="mt-0.5 flex gap-2 text-[11px]">
                    {p.zillow && (
                      <a href={p.zillow} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        Zillow {p.zestimate ? `(${fmtUSD(p.zestimate)})` : ""}
                      </a>
                    )}
                    {p.redfin && (
                      <a href={p.redfin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        Redfin {p.redfinEstimate ? `(${fmtUSD(p.redfinEstimate)})` : ""}
                      </a>
                    )}
                  </div>
                  {sold?.price !== undefined && (
                    <span className="mt-1 inline-block rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                      SOLD {fmtUSD(sold.price)} · {fmtDateISO(sold.date)}
                      {realized !== null && (
                        <> · realized <Delta value={realized >= 0 ? Math.abs(realized) / p.purchasePrice : -Math.abs(realized) / p.purchasePrice} /></>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">{fmtDateISO(p.purchaseDate)}</td>
                <td className="tnum px-3 py-2 text-right text-slate-700">{fmtUSD(p.purchasePrice)}</td>
                <td className="tnum px-3 py-2 text-right text-slate-700">{value ? fmtUSD(value) : "—"}</td>
                <td className="tnum px-3 py-2 text-right">
                  <div className="text-slate-700">{fmtUSD(unrealized)}</div>
                  <div className="text-[11px]">
                    <Delta value={unrealizedPct} />
                  </div>
                </td>
                <td className="tnum px-3 py-2 text-right text-slate-500">{fmtUSD(income)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="$ price"
                      defaultValue={sold?.price ?? ""}
                      onChange={(e) =>
                        update(p.address, {
                          price: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-24 rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-xs text-slate-800 outline-none focus:border-accent"
                    />
                    <input
                      type="date"
                      defaultValue={sold?.date ?? ""}
                      onChange={(e) => update(p.address, { date: e.target.value || undefined })}
                      className="rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-xs text-slate-800 outline-none focus:border-accent"
                    />
                    {sold && (
                      <button
                        onClick={() => clear(p.address)}
                        title="Clear sale"
                        className="text-xs text-ink-600 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
