"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/app/lib/types";
import {
  applyFilters,
  buildCityGroups,
  buildForecastLayers,
  buildSeasonality,
  buildTrend,
  forecastRevenueSeasonal,
  cityTotals,
  computeKpis,
  forecastTrend,
  monthlyTotals,
  monthsInRange,
  type FilterState,
} from "@/app/lib/analytics";
import { detectDuplicates } from "@/app/lib/dedup";
import { applyMerges, MERGES } from "@/app/lib/merges";
import { soldIdSet, soldOnById, soldDateById } from "@/app/lib/sold";
import { withEntities } from "@/app/lib/entities";
import { fmtUSD, monthLabel, yearOf } from "@/app/lib/format";
import AskBar from "./AskBar";
import SoldTable from "./SoldTable";
import HoldingsTable from "./HoldingsTable";
import Filters from "./Filters";
import KpiCards from "./KpiCards";
import RevenueTrendChart from "./RevenueTrendChart";
import ForecastChart from "./ForecastChart";
import ForecastSeasonChart from "./ForecastSeasonChart";
import MgmtRevenueTable from "./MgmtRevenueTable";
import SeasonalityChart from "./SeasonalityChart";
import CityBreakdownChart from "./CityBreakdownChart";
import UnitTable from "./UnitTable";
import MonthlyMatrixTable from "./MonthlyMatrixTable";
import DuplicatePanel from "./DuplicatePanel";
import { SectionTitle } from "./ui";

export default function Dashboard({ dataset }: { dataset: Dataset }) {
  const allMonths = dataset.months;

  // Roll merged duplicates into single units, then tag each with its legal
  // owner (entity) and acquisition metadata.
  const merged = useMemo(
    () => withEntities(applyMerges(dataset.listings, MERGES)),
    [dataset]
  );

  const entities = useMemo(
    () => [...new Set(merged.map((l) => l.entity ?? ""))].filter(Boolean).sort(),
    [merged]
  );
  const revenueByListingId = useMemo(
    () => new Map(merged.map((l) => [l.id, l.total])),
    [merged]
  );

  const soldSet = useMemo(() => soldIdSet(), []);
  const soldOn = useMemo(() => soldOnById(), []);
  const soldDate = useMemo(() => soldDateById(), []);
  const soldListings = useMemo(() => merged.filter((l) => soldSet.has(l.id)), [merged, soldSet]);

  const [includeSold, setIncludeSold] = useState(false);

  // The active universe every downstream view uses: optionally drops sold ones.
  const listings = useMemo(
    () => (includeSold ? merged : merged.filter((l) => !soldSet.has(l.id))),
    [merged, soldSet, includeSold]
  );

  const cities = useMemo(
    () => [...new Set(listings.map((l) => l.city))].sort(),
    [listings]
  );
  const types = useMemo(
    () => [...new Set(listings.map((l) => l.propertyType))].sort(),
    [listings]
  );

  const dedup = useMemo(() => detectDuplicates(listings), [listings]);

  const [filter, setFilter] = useState<FilterState>({
    cities: [],
    units: [],
    types: [],
    entities: [],
    start: allMonths[0],
    end: allMonths[allMonths.length - 1],
    excludeIds: [],
  });
  const [horizon, setHorizon] = useState(6);

  const update = (patch: Partial<FilterState>) =>
    setFilter((f) => ({ ...f, ...patch }));

  const toggleExclude = (id: string) =>
    setFilter((f) => ({
      ...f,
      excludeIds: f.excludeIds.includes(id)
        ? f.excludeIds.filter((x) => x !== id)
        : [...f.excludeIds, id],
    }));

  const model = useMemo(() => {
    const months = monthsInRange(allMonths, filter.start, filter.end);
    const filtered = applyFilters(listings, filter);
    const totals = monthlyTotals(filtered, months);
    const kpis = computeKpis(filtered, months, totals);
    const trend = buildTrend(totals, months);
    const forecast = horizon > 0 ? forecastTrend(trend, horizon) : [];
    const revForecast = forecastRevenueSeasonal(months, totals, 12);
    const allTotals = monthlyTotals(filtered, allMonths);
    const fcLayers = buildForecastLayers(revForecast.points, allTotals, 3);
    const season = buildSeasonality(totals, months);
    const cityData = cityTotals(filtered, months);
    const years = [...new Set(months.map(yearOf))].sort();
    const table = buildCityGroups(filtered, months, years, dedup.flaggedIds);
    return { months, filtered, totals, kpis, trend, forecast, revForecast, fcLayers, season, cityData, years, table };
  }, [listings, filter, horizon, allMonths, dedup.flaggedIds]);

  const excludeSet = new Set(filter.excludeIds);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Portfolio Revenue Intelligence
          </h1>
          <p className="mt-0.5 text-xs text-ink-600">
            {listings.length} listings · {cities.length} cities ·{" "}
            {monthLabel(allMonths[0])} – {monthLabel(allMonths[allMonths.length - 1])} · source{" "}
            <span className="font-mono">{dataset.source}</span>
            {!includeSold && soldListings.length > 0 && (
              <span className="ml-2 rounded bg-rose-500/15 px-1.5 py-0.5 font-medium text-rose-700">
                excluding {soldListings.length} sold
              </span>
            )}
          </p>
        </div>
        <div className="text-right text-[11px] text-ink-600">
          Metric: Total Host Payout (revenue)
          <br />
          Generated {new Date(dataset.generatedAt).toLocaleDateString()}
        </div>
      </header>

      <div className="mb-4">
        <AskBar includeSold={includeSold} />
      </div>

      <Filters
        allMonths={allMonths}
        listings={listings}
        cities={cities}
        types={types}
        entities={entities}
        filter={filter}
        onChange={update}
        includeSold={includeSold}
        onToggleIncludeSold={() => setIncludeSold((v) => !v)}
      />

      <div className="mt-4">
        <KpiCards kpis={model.kpis} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <SectionTitle
            title="Revenue trend"
            subtitle="Monthly revenue · 3-mo moving average · linear forecast (estimate)"
            right={
              <div className="flex items-center gap-1.5 text-xs text-ink-600">
                <span>Forecast</span>
                {[0, 3, 6, 12].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`rounded px-2 py-0.5 ${
                      horizon === h
                        ? "bg-emerald-500/20 text-emerald-700"
                        : "bg-ink-800/60 text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {h === 0 ? "off" : `${h}m`}
                  </button>
                ))}
              </div>
            }
          />
          <RevenueTrendChart trend={model.trend} forecast={model.forecast} />
        </div>

        <div className="card p-4">
          <SectionTitle title="Revenue by city" subtitle="Selected range" />
          <CityBreakdownChart data={model.cityData} />
        </div>
      </div>

      <div className="mt-4 card p-4">
        <SectionTitle
          title="Year-over-year seasonality"
          subtitle="Same calendar month compared across years — latest year bold"
        />
        <SeasonalityChart rows={model.season.rows} years={model.season.years} />
      </div>

      <div className="mt-4 card p-4">
        <SectionTitle
          title="Revenue forecast — next 12 months"
          subtitle={`${model.revForecast.method} · seasonal + trend on filtered history. Dashed = projection, shaded = ~80% range.`}
          right={
            <div className="text-right text-xs text-ink-600">
              <span className="font-semibold text-emerald-700">{fmtUSD(model.revForecast.total12)}</span>{" "}
              projected next 12 mo
              {model.revForecast.fitMape != null && (
                <span className="ml-2 text-slate-400">
                  fit ±{model.revForecast.fitMape.toFixed(0)}%
                </span>
              )}
            </div>
          }
        />
        <ForecastChart points={model.revForecast.points} />
      </div>

      <div className="mt-4 card p-4">
        <SectionTitle
          title="Forecast vs prior years — next 12 months"
          subtitle="Next-12-month projection (dashed) layered over each prior year's actuals for the same calendar months."
        />
        <ForecastSeasonChart data={model.fcLayers.data} years={model.fcLayers.years} />
      </div>

      <div className="mt-4">
        <MgmtRevenueTable points={model.revForecast.points} />
      </div>

      <div className="mt-4">
        <UnitTable
          groups={model.table.groups}
          grandAnnual={model.table.grandAnnual}
          grandTotal={model.table.grandTotal}
          years={model.years}
          months={model.months}
        />
      </div>

      <div className="mt-4">
        <MonthlyMatrixTable listings={model.filtered} months={model.months} />
      </div>

      <div className="mt-4">
        <HoldingsTable
          revenueByListingId={revenueByListingId}
          entityFilter={filter.entities}
        />
      </div>

      <div className="mt-4">
        <SoldTable
          soldListings={soldListings}
          soldOn={soldOn}
          soldDate={soldDate}
          included={includeSold}
          onToggleIncluded={() => setIncludeSold((v) => !v)}
        />
      </div>

      <div className="mt-4">
        <DuplicatePanel dedup={dedup} excludeIds={excludeSet} onToggleId={toggleExclude} />
      </div>

      <footer className="mt-6 pb-6 text-center text-[11px] text-ink-600">
        Forecasts are simple linear projections for directional guidance only — not financial advice.
      </footer>
    </div>
  );
}
