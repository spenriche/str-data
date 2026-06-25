import type { DupGroup, DupMember, Listing, MonthKey } from "./types";

// ---------------------------------------------------------------------------
// Similar-name detection.
//
// Goal (per business rules):
//  - FLAG listings that are the SAME physical unit recreated under a near-
//    identical name (e.g. "1-261 Fletcher St" / "New 1-261 FletcherSt" /
//    "1-261 Fletcher St r7" / "1- 261 Fletcher (HR)") as MERGE CANDIDATES.
//  - Do NOT flag legitimately distinct units that live in the same building,
//    such as a duplex/triplex with multiple listings
//    (e.g. "356 Flint - Main" / "356 Flint - Rear", "3501 Moss Ln 1" / "2",
//    "1-261 Fletcher" vs "2-261 Fletcher"). These are kept separate.
//  - Surface "whole-house bundle" listings ("... 2 Homes") for context.
//
// Nothing is auto-merged. We only classify + explain so a human decides.
// ---------------------------------------------------------------------------

const STREET_SUFFIX: Record<string, string> = {
  st: "street",
  str: "street",
  ave: "avenue",
  av: "avenue",
  dr: "drive",
  ln: "lane",
  rd: "road",
  blvd: "boulevard",
  ct: "court",
  pl: "place",
  way: "way",
  cir: "circle",
  ter: "terrace",
  brk: "brook",
};

// Recreation markers — tokens that signal "this is a re-listing", not a
// different unit. Stripped when computing the base property identity.
const RECREATION_TOKENS = /\b(new|hr|hosthub|copy|old|test)\b/g;
const RECREATION_SUFFIX = /\br\d+\b/g; // r5, r6, r7, r9 ...

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ");
}

// Detect a "unit slot" that marks a DISTINCT unit in the same building.
function detectSlot(rawName: string): string | null {
  const n = ` ${rawName.toLowerCase()} `;
  // Drop a leading recreation prefix ("New ...") so it doesn't mask the slot.
  const lead = rawName.replace(/^\s*new\s+/i, "").trim().match(/^(\d+)\s*-\s*\d/);
  if (lead) return `u${lead[1]}`;
  // Named halves of a building.
  const named = n.match(/\b(main|rear|front|back|upstairs|downstairs|upper|lower|left|right|a|b|c)\b/);
  if (named) {
    // Avoid treating ordinary words; only single-letter or directional halves.
    const t = named[1];
    if (["main", "rear", "front", "back", "upstairs", "downstairs", "upper", "lower", "left", "right"].includes(t)) {
      return `s_${t}`;
    }
    if (/^[abc]$/.test(t) && /\bunit\s+[abc]\b/.test(n)) return `s_${t}`;
  }
  // Explicit unit/apt markers.
  const unit = n.match(/\b(?:unit|apt|apartment)\s*#?\s*([a-z0-9]+)\b/);
  if (unit) return `s_${unit[1]}`;
  const hash = n.match(/#\s*([a-z0-9]+)/);
  if (hash) return `s_${hash[1]}`;
  // Trailing standalone small number (e.g. "3501 Moss Ln 1") that is NOT a
  // recreation marker (those look like "r1"). Only 1..4 to be conservative.
  const cleaned = rawName.toLowerCase().replace(RECREATION_SUFFIX, " ");
  const trail = cleaned.trim().match(/(?:^|\s)([1-4])\s*$/);
  if (trail) return `t${trail[1]}`;
  return null;
}

function isBundle(rawName: string): boolean {
  const n = rawName.toLowerCase();
  return /\b\d+\s*homes?\b/.test(n) || /\bboth\s+homes?\b/.test(n) || /\bduplex\b/.test(n) || /\btriplex\b/.test(n);
}

// Reduce a name to its core property identity (house number + street word),
// ignoring recreation markers, slots, punctuation and suffix variants.
function propertyKey(rawName: string): { key: string; houseNum: string | null; street: string | null } {
  // Split glued words like "FletcherSt" -> "Fletcher St" BEFORE lowercasing.
  let s = stripTags(rawName).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  s = s.replace(/\(.*?\)/g, " "); // drop (HR) etc.
  s = s.replace(RECREATION_TOKENS, " ");
  s = s.replace(RECREATION_SUFFIX, " ");
  s = s.replace(/[^a-z0-9\s-]/g, " ");
  // Remove leading unit slot "1-" / "2-".
  s = s.replace(/^\s*\d+\s*-\s*/, (m) => m.replace(/^\s*\d+\s*-\s*/, ""));
  const tokens = s.split(/[\s-]+/).filter(Boolean);
  // House number = first long-ish numeric token (>=3 digits) or first numeric.
  let houseNum: string | null = null;
  const words: string[] = [];
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      if (houseNum === null && t.length >= 3) houseNum = t;
      else if (houseNum === null) {
        // keep small numbers out of the street words (likely slot)
      }
      continue;
    }
    if (["homes", "home", "both", "the"].includes(t)) continue;
    words.push(STREET_SUFFIX[t] ?? t);
  }
  // Street = first meaningful word. The key intentionally uses ONLY the house
  // number + first street word so that unit-distinguishing words (main/rear/
  // suffix variants) do not split the same building into separate groups.
  const street = words[0] ?? null;
  const key = `${houseNum ?? "?"}|${street ?? ""}`;
  return { key, houseNum, street };
}

// --- Jaro-Winkler for the fuzzy "possible duplicate" pass ------------------
function jaro(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (la === 0 || lb === 0) return 0;
  const range = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
  const aMatch = new Array(la).fill(false);
  const bMatch = new Array(lb).fill(false);
  let matches = 0;
  for (let i = 0; i < la; i++) {
    const start = Math.max(0, i - range);
    const end = Math.min(i + range + 1, lb);
    for (let j = start; j < end; j++) {
      if (bMatch[j] || a[i] !== b[j]) continue;
      aMatch[i] = true;
      bMatch[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < la; i++) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  t /= 2;
  return (matches / la + matches / lb + (matches - t) / matches) / 3;
}

function jaroWinkler(a: string, b: string): number {
  const j = jaro(a, b);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return j + prefix * 0.1 * (1 - j);
}

function normalizeForFuzzy(name: string): string {
  let s = stripTags(name).toLowerCase();
  s = s.replace(/\(.*?\)/g, " ");
  s = s.replace(RECREATION_TOKENS, " ");
  s = s.replace(RECREATION_SUFFIX, " ");
  s = s.replace(/[^a-z0-9]+/g, " ").trim();
  return s;
}

function activeRange(monthly: Record<MonthKey, number | null>): { first: MonthKey | null; last: MonthKey | null } {
  const keys = Object.keys(monthly).sort();
  let first: MonthKey | null = null;
  let last: MonthKey | null = null;
  for (const k of keys) {
    const v = monthly[k];
    if (v !== null && v !== 0) {
      if (first === null) first = k;
      last = k;
    }
  }
  return { first, last };
}

function toMember(l: Listing): DupMember {
  const { first, last } = activeRange(l.monthly);
  return {
    id: l.id,
    name: l.name,
    city: l.city,
    total: l.total,
    firstActive: first,
    lastActive: last,
    slot: detectSlot(l.name),
  };
}

export interface DedupResult {
  recreated: DupGroup[]; // high-confidence merge candidates
  possible: DupGroup[]; // fuzzy, needs review
  multiUnit: DupGroup[]; // legitimately separate (duplex/triplex) — kept
  bundles: DupGroup[]; // whole-house combined listings
  flaggedIds: Set<string>; // any listing involved in a merge candidate
}

export function detectDuplicates(listings: Listing[]): DedupResult {
  // Group by city + property identity.
  const groups = new Map<string, Listing[]>();
  for (const l of listings) {
    const { key } = propertyKey(l.name);
    const gk = `${l.city}::${key}`;
    if (!groups.has(gk)) groups.set(gk, []);
    groups.get(gk)!.push(l);
  }

  const recreated: DupGroup[] = [];
  const multiUnit: DupGroup[] = [];
  const bundles: DupGroup[] = [];
  const flaggedIds = new Set<string>();
  const handled = new Set<string>();

  for (const [gk, items] of groups) {
    const city = items[0].city;
    if (items.length < 2) continue;

    const bundleItems = items.filter((i) => isBundle(i.name));
    const nonBundle = items.filter((i) => !isBundle(i.name));

    if (bundleItems.length) {
      bundles.push({
        key: `bundle::${gk}`,
        kind: "bundle",
        city,
        label: bundleItems[0].name,
        reason:
          "Whole-house / combined listing covering multiple units. Kept separate from the per-unit listings; do not merge.",
        members: bundleItems.map(toMember),
        combinedTotal: bundleItems.reduce((s, i) => s + i.total, 0),
      });
      bundleItems.forEach((i) => handled.add(i.id));
    }

    // Within the property, split by unit slot.
    const bySlot = new Map<string, Listing[]>();
    for (const i of nonBundle) {
      const slot = detectSlot(i.name) ?? "_";
      if (!bySlot.has(slot)) bySlot.set(slot, []);
      bySlot.get(slot)!.push(i);
    }

    const distinctSlots = [...bySlot.keys()].filter((s) => s !== "_");

    // Same slot with >1 listing => recreated (merge candidates).
    for (const [slot, slotItems] of bySlot) {
      if (slotItems.length >= 2) {
        slotItems.forEach((i) => {
          flaggedIds.add(i.id);
          handled.add(i.id);
        });
        recreated.push({
          key: `recreated::${gk}::${slot}`,
          kind: "recreated",
          city,
          label: slotItems[0].name,
          reason:
            "Near-identical names for the same unit (re-created listing — e.g. 'New', 'r#', '(HR)'). Likely safe to merge after review.",
          members: slotItems.map(toMember),
          combinedTotal: slotItems.reduce((s, i) => s + i.total, 0),
        });
      }
    }

    // Multiple DISTINCT slots in the same building => legitimate multi-unit.
    if (distinctSlots.length >= 2) {
      const repItems = distinctSlots.map((s) => bySlot.get(s)![0]);
      repItems.forEach((i) => handled.add(i.id));
      multiUnit.push({
        key: `multi::${gk}`,
        kind: "multi-unit",
        city,
        label: repItems[0].name.replace(/^\s*\d+\s*-\s*/, "").trim(),
        reason:
          "Same building, distinct units (duplex/triplex). Intentionally separate listings — DO NOT merge.",
        members: repItems.map(toMember),
        combinedTotal: repItems.reduce((s, i) => s + i.total, 0),
      });
    }
  }

  // Catch-all: surface any remaining whole-house bundle listing on its own
  // (e.g. "2 Homes - Fletcher" whose name carries no street number to group on).
  for (const l of listings) {
    if (!isBundle(l.name) || handled.has(l.id)) continue;
    handled.add(l.id);
    bundles.push({
      key: `bundle::solo::${l.id}`,
      kind: "bundle",
      city: l.city,
      label: l.name,
      reason:
        "Whole-house / combined listing covering multiple units. Kept separate from the per-unit listings; do not merge.",
      members: [toMember(l)],
      combinedTotal: l.total,
    });
  }

  // Fuzzy pass: catch near-identical names that did not share a property key
  // (e.g. "McPherson" vs "1326 Mcpherson Ave"). Skip pairs already grouped and
  // pairs with conflicting unit slots.
  const possible: DupGroup[] = [];
  const seenPair = new Set<string>();
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const a = listings[i];
      const b = listings[j];
      if (a.city !== b.city) continue;
      const slotA = detectSlot(a.name);
      const slotB = detectSlot(b.name);
      if (slotA && slotB && slotA !== slotB) continue; // distinct units
      if (isBundle(a.name) || isBundle(b.name)) continue;
      const na = normalizeForFuzzy(a.name);
      const nb = normalizeForFuzzy(b.name);
      if (!na || !nb) continue;
      const sim = jaroWinkler(na, nb);
      const tokenOverlap = (() => {
        const sa = new Set(na.split(" "));
        const sb = new Set(nb.split(" "));
        const inter = [...sa].filter((t) => sb.has(t)).length;
        return inter / Math.max(1, Math.min(sa.size, sb.size));
      })();
      const isCandidate = sim >= 0.9 || (tokenOverlap >= 0.6 && sim >= 0.78);
      if (!isCandidate) continue;
      // Skip if both already in the same recreated group.
      if (flaggedIds.has(a.id) && flaggedIds.has(b.id)) continue;
      const pk = `${a.id}|${b.id}`;
      if (seenPair.has(pk)) continue;
      seenPair.add(pk);
      possible.push({
        key: `possible::${a.id}::${b.id}`,
        kind: "possible",
        city: a.city,
        label: `${a.name}  ↔  ${b.name}`,
        reason: `Fuzzy name match (similarity ${(sim * 100).toFixed(0)}%). Review whether these are the same property recreated.`,
        members: [toMember(a), toMember(b)],
        combinedTotal: a.total + b.total,
      });
      flaggedIds.add(a.id);
      flaggedIds.add(b.id);
    }
  }

  const byTotal = (a: DupGroup, b: DupGroup) => b.combinedTotal - a.combinedTotal;
  recreated.sort(byTotal);
  possible.sort(byTotal);
  multiUnit.sort(byTotal);
  bundles.sort(byTotal);

  return { recreated, possible, multiUnit, bundles, flaggedIds };
}
