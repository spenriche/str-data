import type { Listing, MonthKey } from "./types";

// ---------------------------------------------------------------------------
// Sold / off-boarded properties.
//
// "Sold" is business knowledge — it is NOT reliably derivable from the data
// (a dormant listing might be a re-created duplicate, a seasonal gap, or an
// actual sale). So this is a MANUAL list you control. The dashboard shows
// these in a dedicated table (their revenue won't recur) and lets users
// toggle them in/out of every chart, KPI and the AI.
//
// To mark a property sold: add its id (from the duplicate panel / unit table)
// here. `soldOn` is optional and only used for display.
//   - Tip: merge duplicate listings first (app/lib/merges.ts) so a re-created
//     listing isn't mistaken for a sale.
// ---------------------------------------------------------------------------

export interface SoldRule {
  id: string;
  name?: string; // for readability only
  soldOn?: MonthKey; // optional "YYYY-MM"
  soldDate?: string; // optional exact closing date "YYYY-MM-DD"
  note?: string;
}

export const SOLD: SoldRule[] = [
  // --- Confirmed completed sales (closing dates) ---
  {
    id: "653662be9cb4e70033a64de9",
    name: "509 Monterey Dr",
    soldDate: "2026-05-14",
    note: "Sold to R2CP US INC.",
  },
  {
    id: "652ee1e42711f200313b5527",
    name: "731 10th Ave S",
    soldDate: "2026-05-29",
    note: "Sold to R2 SFH US INC.",
  },
  {
    id: "5eed5d8f9caa3c002d19b032",
    name: "1326 McPherson",
    soldDate: "2026-05-27",
    note: "Sold to R2 Capital Partners US Inc.",
  },
  {
    id: "62bf3b94ad2dd0003400bfd5",
    name: "2715 Forest Brk",
    soldDate: "2026-05-25",
    note: "Sold to R2 Capital Partners US Inc.",
  },
  {
    id: "63eafd662baf92002cc1dbac",
    name: "808 Charles St",
    soldDate: "2026-05-29",
    note: "Sold to R2 SFH US INC.",
  },
  // --- 261 Fletcher St (both units + recreations + bundle) — sold ---
  { id: "5efe847ec6cabb002a1f6d5a", name: "1-261 Fletcher St", note: "261 Fletcher sold." },
  { id: "63f67c0a98d8e00042b2afad", name: "1-261 Fletcher St r7", note: "261 Fletcher sold." },
  { id: "60ccf0fad23580002e480d4d", name: "New 1-261 FletcherSt", note: "261 Fletcher sold." },
  { id: "66b3e6da05f53c0013773384", name: "1- 261 Fletcher (HR)", note: "261 Fletcher sold." },
  { id: "5f3cc2b31437a20028c9a6bc", name: "2-261 Fletcher St", note: "261 Fletcher sold." },
  { id: "60ccf0fca30e26002dc25a93", name: "2-261 Fletcher St r7", note: "261 Fletcher sold." },
  { id: "6545585b403d05004ff506f9", name: "2-261 Fletcher St r9", note: "261 Fletcher sold." },
  { id: "64c1265bcf9d6d00366a3fbc", name: "2 Homes - Fletcher", note: "261 Fletcher sold." },
  // --- 1701 Rerick St — sold ---
  { id: "61e5e7099974fe0032f7ef51", name: "1701 Rerick St", note: "Sold — confirm closing date." },
  // --- Inferred from inactivity (unconfirmed — verify) ---
  {
    id: "613a94d86df8700030f910a9",
    name: "20050 Brookwood Dr",
    note: "Stopped earning Jul 2025 — confirm sale date.",
  },
  {
    id: "61d5d981c99c33003264fe45",
    name: "39 The Downs",
    note: "Off-boarded early 2022.",
  },
];

export function soldIdSet(): Set<string> {
  return new Set(SOLD.map((s) => s.id));
}

export function soldOnById(): Map<string, MonthKey | undefined> {
  return new Map(SOLD.map((s) => [s.id, s.soldOn]));
}

export function soldDateById(): Map<string, string | undefined> {
  return new Map(SOLD.map((s) => [s.id, s.soldDate]));
}

export function lastActiveMonth(l: Listing): MonthKey | null {
  let last: MonthKey | null = null;
  for (const k of Object.keys(l.monthly).sort()) {
    const v = l.monthly[k];
    if (v !== null && v !== undefined && v !== 0) last = k;
  }
  return last;
}
