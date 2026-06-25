import { NextResponse } from "next/server";
import dataset from "@/app/data/dataset.json";
import { applyMerges, MERGES } from "@/app/lib/merges";
import { soldIdSet } from "@/app/lib/sold";
import { withEntities, PROPERTIES, allEntities } from "@/app/lib/entities";
import { yearOf } from "@/app/lib/format";
import type { Dataset, Listing } from "@/app/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getListings(includeSold: boolean): Listing[] {
  const merged = withEntities(applyMerges((dataset as Dataset).listings, MERGES));
  if (includeSold) return merged;
  const sold = soldIdSet();
  return merged.filter((l) => !sold.has(l.id));
}

// Lightweight catalog so the model knows valid filter values & ranges.
function buildCatalog(includeSold: boolean) {
  const ds = dataset as Dataset;
  const listings = getListings(includeSold);
  const years = [...new Set(ds.months.map(yearOf))].sort();
  return {
    metric: "Total Host Payout (revenue), USD",
    monthRange: { start: ds.months[0], end: ds.months[ds.months.length - 1] },
    years,
    cities: [...new Set(listings.map((l) => l.city))].sort(),
    propertyTypes: [...new Set(listings.map((l) => l.propertyType))].sort(),
    entities: allEntities(),
    units: listings
      .map((l) => ({ name: l.name, city: l.city, type: l.propertyType, entity: l.entity }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    // Acquisition & valuation per physical property (one record may map to
    // several listings). Use these for purchase price / estimate / gain Qs.
    properties: PROPERTIES.map((p) => ({
      entity: p.entity,
      address: p.address,
      purchaseDate: p.purchaseDate,
      purchasePrice: p.purchasePrice,
      estimatedValue: p.avgEstimate,
    })),
  };
}

interface QueryArgs {
  cities?: string[];
  units?: string[];
  types?: string[];
  entities?: string[];
  startMonth?: string;
  endMonth?: string;
  groupBy?: "none" | "year" | "month" | "city" | "unit" | "type" | "entity";
}

// Deterministic, exact aggregation. The model relies on THIS for all numbers.
function queryRevenue(args: QueryArgs, includeSold: boolean) {
  const ds = dataset as Dataset;
  const listings = getListings(includeSold);
  const lc = (s: string) => s.trim().toLowerCase();
  const citySet = args.cities?.length ? new Set(args.cities.map(lc)) : null;
  const unitSet = args.units?.length ? new Set(args.units.map(lc)) : null;
  const typeSet = args.types?.length ? new Set(args.types.map(lc)) : null;
  const entitySet = args.entities?.length ? new Set(args.entities.map(lc)) : null;
  const start = args.startMonth || ds.months[0];
  const end = args.endMonth || ds.months[ds.months.length - 1];
  const groupBy = args.groupBy || "none";

  const matched = listings.filter((l) => {
    if (citySet && !citySet.has(lc(l.city))) return false;
    if (unitSet && !unitSet.has(lc(l.name))) return false;
    if (typeSet && !typeSet.has(lc(l.propertyType))) return false;
    if (entitySet && !entitySet.has(lc(l.entity ?? ""))) return false;
    return true;
  });
  const months = ds.months.filter((m) => m >= start && m <= end);

  const round = (n: number) => Math.round(n * 100) / 100;
  const add = (obj: Record<string, number>, key: string, v: number) => {
    obj[key] = (obj[key] ?? 0) + v;
  };

  let total = 0;
  const grouped: Record<string, number> = {};
  for (const l of matched) {
    for (const m of months) {
      const v = l.monthly[m];
      if (v === null || v === undefined) continue;
      total += v;
      if (groupBy === "year") add(grouped, String(yearOf(m)), v);
      else if (groupBy === "month") add(grouped, m, v);
      else if (groupBy === "city") add(grouped, l.city, v);
      else if (groupBy === "unit") add(grouped, l.name, v);
      else if (groupBy === "type") add(grouped, l.propertyType, v);
      else if (groupBy === "entity") add(grouped, l.entity ?? "Unassigned", v);
    }
  }
  for (const k in grouped) grouped[k] = round(grouped[k]);

  return {
    filters: {
      cities: args.cities ?? "all",
      units: args.units ?? "all",
      types: args.types ?? "all",
      range: { start, end },
    },
    matchedUnits: matched.length,
    total: round(total),
    groupBy,
    ...(groupBy !== "none" ? { breakdown: grouped } : {}),
  };
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_revenue",
      description:
        "Compute EXACT revenue (Total Host Payout, USD) from the portfolio data with optional filters and grouping. Always use this for any number; never sum values yourself. Months are 'YYYY-MM' inclusive.",
      parameters: {
        type: "object",
        properties: {
          cities: { type: "array", items: { type: "string" }, description: "Filter to these cities (exact names from catalog)." },
          units: { type: "array", items: { type: "string" }, description: "Filter to these unit names (exact)." },
          types: { type: "array", items: { type: "string" }, description: "Filter to property types e.g. House, Apartment." },
          entities: { type: "array", items: { type: "string" }, description: "Filter to these legal owner entities (exact names from catalog)." },
          startMonth: { type: "string", description: "Inclusive start 'YYYY-MM'." },
          endMonth: { type: "string", description: "Inclusive end 'YYYY-MM'." },
          groupBy: {
            type: "string",
            enum: ["none", "year", "month", "city", "unit", "type", "entity"],
            description: "How to break down the total.",
          },
        },
      },
    },
  },
];

async function callOpenAI(apiKey: string, model: string, messages: unknown[]) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0, messages, tools: TOOLS }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`OpenAI error (${resp.status}). ${detail.slice(0, 300)}`);
  }
  return resp.json();
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let question = "";
  let includeSold = true;
  try {
    const body = await req.json();
    question = String(body?.question ?? "").trim();
    includeSold = body?.includeSold !== false;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!question) return NextResponse.json({ error: "Please enter a question." }, { status: 400 });

  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const system = [
    "You are a precise financial analyst for a short-term rental portfolio.",
    "Revenue = 'Total Host Payout' in USD. For ANY number (totals, comparisons, averages, rankings) you MUST call the query_revenue tool — never sum or estimate figures yourself.",
    "For year-over-year, call query_revenue grouped by year (or two calls) and compute the % and absolute delta from the exact returned values. Small arithmetic on tool outputs (subtraction, division for a single average, sorting a returned breakdown) is fine.",
    "Use exact city/unit/type/entity names from the catalog. 'entity' is the legal owner. For purchase price, purchase date, estimated value or gain questions, read catalog.properties (acquisition data); revenue questions use query_revenue. If a question is outside the data, say so.",
    includeSold
      ? "Sold/off-boarded properties ARE included in the data."
      : "Sold/off-boarded properties are currently EXCLUDED from the data (the user toggled them off to view go-forward run-rate).",
    "Answer concisely in short markdown (bold key numbers, bullets). Format money with $ and thousands separators.",
  ].join(" ");

  const messages: any[] = [
    { role: "system", content: system },
    { role: "system", content: `CATALOG:\n${JSON.stringify(buildCatalog(includeSold))}` },
    { role: "user", content: question },
  ];

  try {
    for (let i = 0; i < 5; i++) {
      const data = await callOpenAI(apiKey, model, messages);
      const msg = data?.choices?.[0]?.message;
      if (!msg) return NextResponse.json({ error: "No response from model." }, { status: 502 });

      const toolCalls = msg.tool_calls;
      if (toolCalls && toolCalls.length) {
        messages.push(msg);
        for (const tc of toolCalls) {
          let result: unknown;
          try {
            const args = JSON.parse(tc.function?.arguments || "{}");
            result =
              tc.function?.name === "query_revenue"
                ? queryRevenue(args, includeSold)
                : { error: "unknown tool" };
          } catch (e) {
            result = { error: e instanceof Error ? e.message : "tool failed" };
          }
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
        }
        continue;
      }

      const answer = msg.content?.trim() || "No answer returned.";
      return NextResponse.json({ answer });
    }
    return NextResponse.json({ error: "Could not complete the analysis (too many steps)." }, { status: 504 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed." },
      { status: 502 }
    );
  }
}
