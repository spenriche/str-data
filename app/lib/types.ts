export type MonthKey = string; // "YYYY-MM"

export interface Listing {
  id: string;
  url: string | null;
  name: string;
  state: string;
  city: string;
  propertyType: string;
  monthly: Record<MonthKey, number | null>;
  total: number;
  mergedFrom?: string[]; // ids of source listings rolled into this one
  entity?: string; // legal owner (attached at runtime)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any; // PropertyMeta (acquisition data), attached at runtime
}

export interface Dataset {
  generatedAt: string;
  source: string;
  sheet: string;
  months: MonthKey[];
  monthRange: { start: MonthKey; end: MonthKey } | null;
  listings: Listing[];
}

export type DupGroupKind =
  | "recreated" // same physical unit re-listed; safe to merge after review
  | "possible" // fuzzy name match; needs human review
  | "multi-unit" // same building, distinct units (duplex/triplex) — keep separate
  | "bundle"; // whole-house combined listing of multiple units

export interface DupMember {
  id: string;
  name: string;
  city: string;
  total: number;
  firstActive: MonthKey | null;
  lastActive: MonthKey | null;
  slot: string | null;
}

export interface DupGroup {
  key: string;
  kind: DupGroupKind;
  city: string;
  label: string;
  reason: string;
  members: DupMember[];
  combinedTotal: number;
}
