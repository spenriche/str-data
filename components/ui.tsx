"use client";

import { fmtPct } from "@/app/lib/format";
import { useEffect, useRef, useState } from "react";

export function Delta({ value, className = "" }: { value: number | null; className?: string }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className={`text-ink-600 ${className}`}>—</span>;
  }
  const up = value >= 0;
  return (
    <span
      className={`tnum inline-flex items-center gap-0.5 font-medium ${
        up ? "text-emerald-600" : "text-rose-600"
      } ${className}`}
    >
      <span className="text-[0.7em]">{up ? "▲" : "▼"}</span>
      {fmtPct(value)}
    </span>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-slate-800">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-600">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-accent bg-accent/15 text-blue-700"
          : "border-ink-700 bg-ink-800/60 text-slate-500 hover:border-ink-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const sel = new Set(selected);
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  function toggle(v: string) {
    const next = new Set(sel);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange([...next]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-1.5 text-xs text-slate-800 hover:border-ink-600"
      >
        <span className="text-ink-600">{label}:</span>
        <span className="font-medium">
          {selected.length === 0 ? "All" : `${selected.length} selected`}
        </span>
        <span className="text-ink-600">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-64 overflow-auto rounded-lg border border-ink-700 bg-ink-900 p-2 shadow-2xl shadow-slate-400/30">
          <div className="mb-2 flex items-center justify-between px-1">
            <button
              onClick={() => onChange([])}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Clear (all)
            </button>
            <span className="text-[11px] text-ink-600">{options.length} options</span>
          </div>
          {searchable && (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="mb-2 w-full rounded-md border border-ink-700 bg-ink-950 px-2 py-1 text-xs text-slate-800 outline-none focus:border-accent"
            />
          )}
          <ul className="space-y-0.5">
            {filtered.map((o) => (
              <li key={o.value}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-ink-800">
                  <input
                    type="checkbox"
                    checked={sel.has(o.value)}
                    onChange={() => toggle(o.value)}
                    className="accent-blue-500"
                  />
                  <span className="truncate">{o.label}</span>
                </label>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-2 text-xs text-ink-600">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
