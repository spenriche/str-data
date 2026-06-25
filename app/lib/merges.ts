import type { Listing, MonthKey } from "./types";

// ---------------------------------------------------------------------------
// Manual merge rules. Each rule rolls several listing ids (the same physical
// unit that was re-created in Guesty) into ONE unit by summing monthly revenue
// across the full timeline. This is applied before any analytics/dedup, so the
// merged unit shows up everywhere (KPIs, charts, table) as a single listing.
//
// To merge more groups: copy the duplicate-panel ids into a new rule below.
// `primaryId` (optional) picks whose URL/metadata to keep — defaults to the
// member with the highest revenue (usually the current live listing).
// ---------------------------------------------------------------------------

export interface MergeRule {
  name: string;
  memberIds: string[];
  primaryId?: string;
}

export const MERGES: MergeRule[] = [
  {
    name: "2624 5th Way",
    memberIds: [
      "65dce71523d57d004260082c", // 2624 5th Way
      "65e2919f4415f30013fd9713", // 2624 5th Way r1
      "66317b43053dd50047791744", // 2624 5th Way NW r2
    ],
    primaryId: "66317b43053dd50047791744",
  },
  {
    name: "7312 2nd Ave N",
    memberIds: [
      "631b4b2df0d0ef0035272304", // 7312 2nd Ave N r5
      "666ca406689c45000f74d545", // 7312 2nd Ave N r6
    ],
    primaryId: "666ca406689c45000f74d545",
  },
  {
    name: "1701 Rerick St",
    memberIds: [
      "61e5e7099974fe0032f7ef51", // 1701 Rerick St
      "66a8ebc80c16dc002a8c6da1", // 1701 Rerick St (HR)
    ],
    primaryId: "61e5e7099974fe0032f7ef51",
  },
  {
    name: "1326 McPherson",
    memberIds: [
      "5eed5d8f9caa3c002d19b032", // McPherson
      "664fd4af40801300128e4289", // 1326 Mcpherson Ave
      "66ae31d9db3b60001294d52b", // 1326 Mcpherson
    ],
    primaryId: "5eed5d8f9caa3c002d19b032",
  },
];

export function applyMerges(listings: Listing[], rules: MergeRule[]): Listing[] {
  if (!rules.length) return listings;
  const byId = new Map(listings.map((l) => [l.id, l]));
  const consumed = new Set<string>();
  const mergedOut: Listing[] = [];

  for (const rule of rules) {
    const members = rule.memberIds
      .map((id) => byId.get(id))
      .filter((l): l is Listing => Boolean(l));
    if (members.length === 0) continue;
    members.forEach((m) => consumed.add(m.id));

    const primary =
      (rule.primaryId && byId.get(rule.primaryId)) ||
      [...members].sort((a, b) => b.total - a.total)[0];

    const monthKeys = new Set<MonthKey>();
    for (const m of members) for (const k of Object.keys(m.monthly)) monthKeys.add(k);

    const monthly: Record<MonthKey, number | null> = {};
    let total = 0;
    for (const k of monthKeys) {
      let sum: number | null = null;
      for (const m of members) {
        const v = m.monthly[k];
        if (v !== null && v !== undefined) sum = (sum ?? 0) + v;
      }
      monthly[k] = sum;
      if (sum !== null) total += sum;
    }

    mergedOut.push({
      id: primary.id,
      url: primary.url,
      name: rule.name,
      state: primary.state,
      city: primary.city,
      propertyType: primary.propertyType,
      monthly,
      total,
      mergedFrom: members.map((m) => m.id),
    });
  }

  const rest = listings.filter((l) => !consumed.has(l.id));
  return [...rest, ...mergedOut];
}
