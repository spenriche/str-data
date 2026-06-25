"use client";

import { useState } from "react";
import { fmtUSD, monthLabel } from "@/app/lib/format";
import type { DedupResult } from "@/app/lib/dedup";
import type { DupGroup } from "@/app/lib/types";

function MemberRow({
  m,
  excluded,
  onToggle,
  allowHide,
}: {
  m: DupGroup["members"][number];
  excluded: boolean;
  onToggle: () => void;
  allowHide: boolean;
}) {
  const range =
    m.firstActive && m.lastActive
      ? `${monthLabel(m.firstActive)} – ${monthLabel(m.lastActive)}`
      : "no revenue";
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs ${
        excluded ? "opacity-40" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-800">
          {m.name}
          {m.slot && (
            <span className="ml-2 rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-slate-600">
              unit {m.slot.replace(/^[a-z]_?/, "")}
            </span>
          )}
        </div>
        <div className="text-ink-600">{range}</div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="tnum text-slate-700">{fmtUSD(m.total)}</span>
        {allowHide && (
          <button
            onClick={onToggle}
            className={`rounded border px-1.5 py-0.5 text-[10px] ${
              excluded
                ? "border-emerald-600 text-emerald-700"
                : "border-ink-600 text-slate-500 hover:border-ink-600"
            }`}
          >
            {excluded ? "hidden" : "hide"}
          </button>
        )}
      </div>
    </div>
  );
}

function GroupCard({
  g,
  excludeIds,
  onToggleId,
  allowHide,
  accent,
}: {
  g: DupGroup;
  excludeIds: Set<string>;
  onToggleId: (id: string) => void;
  allowHide: boolean;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-800">
          {g.city}
          <span className="ml-2 font-normal text-ink-600">
            {g.members.length} listings · {fmtUSD(g.combinedTotal)} combined
          </span>
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${accent}`}>
          {g.kind}
        </span>
      </div>
      <p className="mb-2 text-[11px] leading-snug text-ink-600">{g.reason}</p>
      <div className="divide-y divide-ink-800">
        {g.members.map((m) => (
          <MemberRow
            key={m.id}
            m={m}
            excluded={excludeIds.has(m.id)}
            onToggle={() => onToggleId(m.id)}
            allowHide={allowHide}
          />
        ))}
      </div>
    </div>
  );
}

export default function DuplicatePanel({
  dedup,
  excludeIds,
  onToggleId,
}: {
  dedup: DedupResult;
  excludeIds: Set<string>;
  onToggleId: (id: string) => void;
}) {
  const tabs = [
    {
      id: "recreated",
      label: `Likely recreated (${dedup.recreated.length})`,
      groups: dedup.recreated,
      allowHide: true,
      accent: "bg-rose-500/15 text-rose-700",
      hint: "Same unit re-listed under a near-identical name. Likely safe to merge — hide the stale duplicates to preview a merged view.",
    },
    {
      id: "possible",
      label: `Possible (${dedup.possible.length})`,
      groups: dedup.possible,
      allowHide: true,
      accent: "bg-amber-500/20 text-amber-700",
      hint: "Fuzzy name matches. Review whether these are the same property recreated.",
    },
    {
      id: "multi",
      label: `Multi-unit — kept (${dedup.multiUnit.length})`,
      groups: dedup.multiUnit,
      allowHide: false,
      accent: "bg-sky-500/15 text-sky-700",
      hint: "Distinct units in one building (duplex/triplex). Intentionally NOT merged.",
    },
    {
      id: "bundle",
      label: `Bundles (${dedup.bundles.length})`,
      groups: dedup.bundles,
      allowHide: false,
      accent: "bg-violet-500/15 text-violet-700",
      hint: "Whole-house combined listings spanning multiple units.",
    },
  ] as const;

  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("recreated");
  const active = tabs.find((t) => t.id === tab)!;

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">
          Listing hygiene · similar-name review
        </h2>
        {excludeIds.size > 0 && (
          <span className="text-[11px] text-emerald-700">
            {excludeIds.size} hidden from all charts
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-ink-600">
        Nothing is auto-merged. Flags are heuristics for your team to confirm.
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              tab === t.id
                ? "bg-accent/20 text-blue-700"
                : "bg-ink-800/60 text-slate-500 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-3 text-[11px] leading-snug text-slate-500">{active.hint}</p>

      <div className="grid max-h-[28rem] grid-cols-1 gap-3 overflow-auto pr-1 lg:grid-cols-2">
        {active.groups.length === 0 ? (
          <p className="text-xs text-ink-600">None detected.</p>
        ) : (
          active.groups.map((g) => (
            <GroupCard
              key={g.key}
              g={g}
              excludeIds={excludeIds}
              onToggleId={onToggleId}
              allowHide={active.allowHide}
              accent={active.accent}
            />
          ))
        )}
      </div>
    </div>
  );
}
