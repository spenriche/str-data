import { addMonths, monthName, yearOf } from "./format";
import type { Listing, MonthKey } from "./types";

export interface FilterState {
  cities: string[]; // empty = all
  units: string[]; // listing ids, empty = all
  types: string[]; // property types, empty = all
  entities: string[]; // legal owners, empty = all
  start: MonthKey;
  end: MonthKey;
  excludeIds: string[]; // listings the user chose to hide (e.g. merge dups)
}

export function monthsInRange(all: MonthKey[], start: MonthKey, end: MonthKey): MonthKey[] {
  return all.filter((m) => m >= start && m <= end);
}

export function applyFilters(listings: Listing[], f: FilterState): Listing[] {
  const citySet = new Set(f.cities);
  const unitSet = new Set(f.units);
  const typeSet = new Set(f.types);
  const entitySet = new Set(f.entities);
  const exclude = new Set(f.excludeIds);
  return listings.filter((l) => {
    if (exclude.has(l.id)) return false;
    if (citySet.size && !citySet.has(l.city)) return false;
    if (unitSet.size && !unitSet.has(l.id)) return false;
    if (typeSet.size && !typeSet.has(l.propertyType)) return false;
    if (entitySet.size && !entitySet.has(l.entity ?? "")) return false;
    return true;
  });
}

export function monthlyTotals(listings: Listing[], months: MonthKey[]): Map<MonthKey, number> {
  const out = new Map<MonthKey, number>();
  for (const m of months) {
    let sum = 0;
    for (const l of listings) {
      const v = l.monthly[m];
      if (v !== null && v !== undefined) sum += v;
    }
    out.set(m, sum);
  }
  return out;
}

export function activeUnitsInMonth(listings: Listing[], month: MonthKey): number {
  let n = 0;
  for (const l of listings) {
    const v = l.monthly[month];
    if (v !== null && v !== undefined && v !== 0) n++;
  }
  return n;
}

export interface TrendPoint {
  key: MonthKey;
  revenue: number;
  ma3: number | null;
  forecast: number | null;
}

export function buildTrend(totals: Map<MonthKey, number>, months: MonthKey[]): TrendPoint[] {
  const pts: TrendPoint[] = months.map((m) => ({
    key: m,
    revenue: totals.get(m) ?? 0,
    ma3: null,
    forecast: null,
  }));
  for (let i = 0; i < pts.length; i++) {
    if (i >= 2) {
      pts[i].ma3 = (pts[i].revenue + pts[i - 1].revenue + pts[i - 2].revenue) / 3;
    }
  }
  return pts;
}

// Simple linear-regression forecast on the trailing window. Clearly an
// estimate; returns appended points beyond the last observed month.
export function forecastTrend(
  trend: TrendPoint[],
  horizon: number,
  lookback = 12
): TrendPoint[] {
  if (trend.length < 4) return [];
  const window = trend.slice(-lookback);
  const n = window.length;
  const xs = window.map((_, i) => i);
  const ys = window.map((p) => p.revenue);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const out: TrendPoint[] = [];
  const lastKey = trend[trend.length - 1].key;
  for (let h = 1; h <= horizon; h++) {
    const x = n - 1 + h;
    const val = Math.max(0, intercept + slope * x);
    out.push({ key: addMonths(lastKey, h), revenue: NaN, ma3: null, forecast: val });
  }
  return out;
}

// --- 12-month revenue forecast: Holt-Winters w/ auto-tuned params ----------
export interface ForecastPoint {
  key: MonthKey;
  actual: number | null;
  forecast: number | null;
  loBase: number | null; // lower bound (area stack base)
  band: number | null; // hi - lo (stacked area height)
  lo: number | null;
  hi: number | null;
}

export interface RevenueForecast {
  points: ForecastPoint[];
  method: string;
  total12: number;
  fitMape: number | null;
}

const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// Damped multiplicative Holt-Winters. Returns one-step fitted values, the
// h-step forecast, and the fit RMSE. Seasonal period m (=12 months).
function holtWinters(
  y: number[],
  m: number,
  alpha: number,
  beta: number,
  gamma: number,
  phi: number,
  horizon: number
) {
  const n = y.length;
  const eps = 1; // guard against zero division for multiplicative seasonals
  let level = mean(y.slice(0, m)) || eps;
  let trend = (mean(y.slice(m, 2 * m)) - mean(y.slice(0, m))) / m;
  const season: number[] = [];
  for (let i = 0; i < m; i++) season[i] = (y[i] + eps) / (level + eps);
  const sMean = mean(season) || 1;
  for (let i = 0; i < m; i++) season[i] /= sMean; // normalize to ~1

  const fitted: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const s = season[i % m] || 1;
    fitted[i] = (level + phi * trend) * s;
    const sPrev = season[i % m] || 1;
    const newLevel = alpha * ((y[i] + eps) / sPrev) + (1 - alpha) * (level + phi * trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * phi * trend;
    season[i % m] = gamma * ((y[i] + eps) / (newLevel + eps)) + (1 - gamma) * sPrev;
    level = newLevel;
    trend = newTrend;
  }

  const fc: number[] = [];
  let damp = 0;
  for (let h = 1; h <= horizon; h++) {
    damp += Math.pow(phi, h);
    const s = season[(n + h - 1) % m] || 1;
    fc.push(Math.max(0, (level + damp * trend) * s));
  }

  let sse = 0;
  let cnt = 0;
  for (let i = m; i < n; i++) {
    const e = y[i] - fitted[i];
    sse += e * e;
    cnt++;
  }
  const rmse = cnt ? Math.sqrt(sse / cnt) : 0;
  return { fitted, fc, rmse };
}

export function forecastRevenueSeasonal(
  months: MonthKey[],
  totals: Map<MonthKey, number>,
  horizon = 12
): RevenueForecast {
  const y = months.map((mk) => totals.get(mk) ?? 0);
  const n = y.length;
  const m = 12;
  const lastKey = months[n - 1];
  const z = 1.28; // ~80% interval

  let fitted: number[] = [];
  let fc: number[] = [];
  let rmse = 0;
  let method = "Linear trend";

  if (n >= 2 * m) {
    // Grid-search smoothing params to minimize in-sample one-step error.
    const grid = [0.1, 0.3, 0.5, 0.7, 0.9];
    let best: { rmse: number; fitted: number[]; fc: number[] } | null = null;
    for (const a of grid)
      for (const b of grid)
        for (const g of grid) {
          const r = holtWinters(y, m, a, b, g, 0.9, horizon);
          if (!best || r.rmse < best.rmse) best = { rmse: r.rmse, fitted: r.fitted, fc: r.fc };
        }
    if (best) {
      fitted = best.fitted;
      fc = best.fc;
      rmse = best.rmse;
      method = "Holt-Winters (seasonal, damped)";
    }
  }

  if (!fc.length) {
    // Fallback: linear regression on the trailing window.
    const win = Math.min(n, 12);
    const ys = y.slice(-win);
    const xs = ys.map((_, i) => i);
    const mx = mean(xs);
    const my = mean(ys);
    let num = 0;
    let den = 0;
    for (let i = 0; i < win; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) ** 2;
    }
    const slope = den ? num / den : 0;
    const intercept = my - slope * mx;
    fitted = xs.map((x) => intercept + slope * x);
    let sse = 0;
    for (let i = 0; i < win; i++) sse += (ys[i] - fitted[i]) ** 2;
    rmse = Math.sqrt(sse / Math.max(1, win));
    fc = [];
    for (let h = 1; h <= horizon; h++) fc.push(Math.max(0, intercept + slope * (win - 1 + h)));
  }

  const points: ForecastPoint[] = months.map((mk, i) => ({
    key: mk,
    actual: y[i],
    forecast: null,
    loBase: null,
    band: null,
    lo: null,
    hi: null,
  }));
  // Seam: connect actual → forecast at the last observed month.
  const seam = points[points.length - 1];
  if (seam) {
    seam.forecast = seam.actual;
    seam.lo = seam.actual;
    seam.hi = seam.actual;
    seam.loBase = seam.actual;
    seam.band = 0;
  }
  for (let h = 1; h <= horizon; h++) {
    const f = fc[h - 1];
    const spread = z * rmse * Math.sqrt(h);
    const lo = Math.max(0, f - spread);
    const hi = f + spread;
    points.push({
      key: addMonths(lastKey, h),
      actual: null,
      forecast: f,
      lo,
      hi,
      loBase: lo,
      band: hi - lo,
    });
  }

  let mapeSum = 0;
  let mapeCnt = 0;
  for (let i = m; i < n; i++) {
    if (y[i] > 0 && Number.isFinite(fitted[i])) {
      mapeSum += Math.abs((y[i] - fitted[i]) / y[i]);
      mapeCnt++;
    }
  }
  const fitMape = mapeCnt ? (mapeSum / mapeCnt) * 100 : null;
  const total12 = fc.reduce((s, x) => s + x, 0);

  return { points, method, total12, fitMape };
}

export interface Kpis {
  totalRevenue: number;
  refMonth: MonthKey | null;
  refRevenue: number;
  momPct: number | null;
  yoyPct: number | null;
  t12m: number;
  t12mYoyPct: number | null;
  activeUnits: number;
  activeCities: number;
  avgRevPerUnit: number;
}

export function computeKpis(
  listings: Listing[],
  months: MonthKey[],
  totals: Map<MonthKey, number>
): Kpis {
  const totalRevenue = months.reduce((s, m) => s + (totals.get(m) ?? 0), 0);

  // Reference month = last month in range with any revenue.
  let refMonth: MonthKey | null = null;
  for (let i = months.length - 1; i >= 0; i--) {
    if ((totals.get(months[i]) ?? 0) > 0) {
      refMonth = months[i];
      break;
    }
  }

  let momPct: number | null = null;
  let yoyPct: number | null = null;
  let refRevenue = 0;
  if (refMonth) {
    refRevenue = totals.get(refMonth) ?? 0;
    const prevM = addMonths(refMonth, -1);
    const prevY = addMonths(refMonth, -12);
    const prevMv = totals.get(prevM);
    const prevYv = totals.get(prevY);
    if (prevMv && prevMv > 0) momPct = (refRevenue - prevMv) / prevMv;
    if (prevYv && prevYv > 0) yoyPct = (refRevenue - prevYv) / prevYv;
  }

  // Trailing 12 months vs the 12 before it (independent of selected range,
  // anchored on refMonth so the comparison is apples-to-apples).
  let t12m = 0;
  let prior12 = 0;
  let t12mYoyPct: number | null = null;
  if (refMonth) {
    for (let h = 0; h < 12; h++) t12m += totals.get(addMonths(refMonth, -h)) ?? 0;
    for (let h = 12; h < 24; h++) prior12 += totals.get(addMonths(refMonth, -h)) ?? 0;
    if (prior12 > 0) t12mYoyPct = (t12m - prior12) / prior12;
  }

  const activeUnits = refMonth ? activeUnitsInMonth(listings, refMonth) : 0;
  const activeCities = new Set(
    listings
      .filter((l) => months.some((m) => (l.monthly[m] ?? 0) !== 0 && l.monthly[m] !== null))
      .map((l) => l.city)
  ).size;
  const avgRevPerUnit = activeUnits ? (refMonth ? (totals.get(refMonth) ?? 0) / activeUnits : 0) : 0;

  return {
    totalRevenue,
    refMonth,
    refRevenue,
    momPct,
    yoyPct,
    t12m,
    t12mYoyPct,
    activeUnits,
    activeCities,
    avgRevPerUnit,
  };
}

// Seasonality: revenue by calendar month (Jan..Dec), one series per year.
export interface SeasonRow {
  month: string; // "Jan"
  [year: string]: number | string;
}

export function buildSeasonality(
  totals: Map<MonthKey, number>,
  months: MonthKey[]
): { rows: SeasonRow[]; years: number[] } {
  const years = [...new Set(months.map(yearOf))].sort();
  const rowsByMonth = new Map<number, SeasonRow>();
  for (let m = 1; m <= 12; m++) {
    rowsByMonth.set(m, { month: monthName(`2000-${String(m).padStart(2, "0")}`) });
  }
  for (const key of months) {
    const [y, mm] = key.split("-");
    const row = rowsByMonth.get(Number(mm))!;
    const v = totals.get(key);
    if (v !== undefined) row[y] = (Number(row[y] ?? 0) || 0) + v;
  }
  return { rows: [...rowsByMonth.values()], years };
}

// Per-city / per-unit revenue table with annual totals.
export interface UnitRow {
  id: string;
  name: string;
  city: string;
  propertyType: string;
  url: string | null;
  annual: Record<number, number>;
  total: number;
  monthly: Record<MonthKey, number | null>;
  flagged: boolean;
}

export interface CityGroup {
  city: string;
  units: UnitRow[];
  annual: Record<number, number>;
  total: number;
}

export function buildCityGroups(
  listings: Listing[],
  months: MonthKey[],
  years: number[],
  flaggedIds: Set<string>
): { groups: CityGroup[]; grandAnnual: Record<number, number>; grandTotal: number } {
  const monthSet = new Set(months);
  const grandAnnual: Record<number, number> = {};
  years.forEach((y) => (grandAnnual[y] = 0));
  let grandTotal = 0;

  const byCity = new Map<string, UnitRow[]>();
  for (const l of listings) {
    const annual: Record<number, number> = {};
    years.forEach((y) => (annual[y] = 0));
    let total = 0;
    const monthly: Record<MonthKey, number | null> = {};
    for (const m of months) {
      const v = l.monthly[m] ?? null;
      monthly[m] = v;
      if (v !== null && monthSet.has(m)) {
        annual[yearOf(m)] += v;
        total += v;
      }
    }
    const row: UnitRow = {
      id: l.id,
      name: l.name,
      city: l.city,
      propertyType: l.propertyType,
      url: l.url,
      annual,
      total,
      monthly,
      flagged: flaggedIds.has(l.id),
    };
    if (!byCity.has(l.city)) byCity.set(l.city, []);
    byCity.get(l.city)!.push(row);
    years.forEach((y) => (grandAnnual[y] += annual[y]));
    grandTotal += total;
  }

  const groups: CityGroup[] = [...byCity.entries()].map(([city, units]) => {
    const annual: Record<number, number> = {};
    years.forEach((y) => (annual[y] = 0));
    let total = 0;
    for (const u of units) {
      years.forEach((y) => (annual[y] += u.annual[y]));
      total += u.total;
    }
    units.sort((a, b) => b.total - a.total);
    return { city, units, annual, total };
  });
  groups.sort((a, b) => b.total - a.total);

  return { groups, grandAnnual, grandTotal };
}

export interface CityTotal {
  city: string;
  total: number;
}

export function cityTotals(listings: Listing[], months: MonthKey[]): CityTotal[] {
  const map = new Map<string, number>();
  for (const l of listings) {
    let t = 0;
    for (const m of months) {
      const v = l.monthly[m];
      if (v !== null && v !== undefined) t += v;
    }
    map.set(l.city, (map.get(l.city) ?? 0) + t);
  }
  return [...map.entries()].map(([city, total]) => ({ city, total })).sort((a, b) => b.total - a.total);
}
