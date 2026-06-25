"use client";

import { monthLabel } from "@/app/lib/format";
import type { FilterState } from "@/app/lib/analytics";
import type { Listing, MonthKey } from "@/app/lib/types";
import { Chip, MultiSelect } from "./ui";

interface Props {
  allMonths: MonthKey[];
  listings: Listing[];
  cities: string[];
  types: string[];
  entities: string[];
  filter: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  includeSold: boolean;
  onToggleIncludeSold: () => void;
}

export default function Filters({
  allMonths,
  listings,
  cities,
  types,
  entities,
  filter,
  onChange,
  includeSold,
  onToggleIncludeSold,
}: Props) {
  const lastMonth = allMonths[allMonths.length - 1];

  function preset(kind: "ytd" | "t12m" | "t24m" | "all") {
    if (kind === "all") {
      onChange({ start: allMonths[0], end: lastMonth });
    } else if (kind === "ytd") {
      const y = lastMonth.split("-")[0];
      onChange({ start: `${y}-01`, end: lastMonth });
    } else if (kind === "t12m") {
      onChange({ start: allMonths[Math.max(0, allMonths.length - 12)], end: lastMonth });
    } else if (kind === "t24m") {
      onChange({ start: allMonths[Math.max(0, allMonths.length - 24)], end: lastMonth });
    }
  }

  const unitOptions = listings
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((l) => ({ value: l.id, label: `${l.name} · ${l.city}` }));

  return (
    <div className="card sticky top-2 z-20 flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-600">Range</span>
        <select
          value={filter.start}
          onChange={(e) => onChange({ start: e.target.value })}
          className="rounded-lg border border-ink-700 bg-ink-800/60 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-accent"
        >
          {allMonths.map((m) => (
            <option key={m} value={m} disabled={m > filter.end}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <span className="text-ink-600">→</span>
        <select
          value={filter.end}
          onChange={(e) => onChange({ end: e.target.value })}
          className="rounded-lg border border-ink-700 bg-ink-800/60 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-accent"
        >
          {allMonths.map((m) => (
            <option key={m} value={m} disabled={m < filter.start}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <Chip active={false} onClick={() => preset("ytd")}>
          YTD
        </Chip>
        <Chip active={false} onClick={() => preset("t12m")}>
          T12M
        </Chip>
        <Chip active={false} onClick={() => preset("t24m")}>
          T24M
        </Chip>
        <Chip
          active={filter.start === allMonths[0] && filter.end === lastMonth}
          onClick={() => preset("all")}
        >
          All-time
        </Chip>
      </div>

      <div className="h-5 w-px bg-ink-700" />

      <MultiSelect
        label="City"
        options={cities.map((c) => ({ value: c, label: c }))}
        selected={filter.cities}
        onChange={(v) => onChange({ cities: v })}
      />
      <MultiSelect
        label="Unit"
        searchable
        options={unitOptions}
        selected={filter.units}
        onChange={(v) => onChange({ units: v })}
      />
      <MultiSelect
        label="Type"
        options={types.map((t) => ({ value: t, label: t }))}
        selected={filter.types}
        onChange={(v) => onChange({ types: v })}
      />
      <MultiSelect
        label="Entity"
        options={entities.map((e) => ({ value: e, label: e }))}
        selected={filter.entities}
        onChange={(v) => onChange({ entities: v })}
      />

      <div className="h-5 w-px bg-ink-700" />

      <Chip active={!includeSold} onClick={onToggleIncludeSold}>
        Active only{!includeSold ? " · sold excluded" : ""}
      </Chip>

      {(filter.cities.length ||
        filter.units.length ||
        filter.types.length ||
        filter.entities.length) > 0 && (
        <button
          onClick={() => onChange({ cities: [], units: [], types: [], entities: [] })}
          className="ml-auto text-xs text-blue-600 hover:underline"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
