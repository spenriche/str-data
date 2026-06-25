# Portfolio Revenue Intelligence

Institutional-quality revenue dashboard built from a single Guesty pivot export
(`data.xlsx`, metric = **Total Host Payout**). Next.js + Tailwind + Recharts,
deployable to Vercel with zero config.

## Run locally

```bash
npm install
npm run dev      # auto-runs the ingest step, then serves http://localhost:3000
```

## How data flows

1. `data.xlsx` (one sheet, `pivot`) sits in the project root.
2. `scripts/ingest.mjs` parses the pivot — 5 metadata columns
   (`Listing`, `Listing Nickname`, `State`, `City`, `Property Type`) plus the
   monthly value columns whose `MM/YYYY` labels live in the second header row,
   ending in a `Grand Total` column. It strips the HTML `<a>` in the `Listing`
   column to recover the Guesty property id + URL, coerces money strings to
   numbers (blanks → `null`, `(x)` → negative), drops the trailing
   `Grand Total` row, and writes `app/data/dataset.json`.
3. The app imports that JSON and computes everything client-side.

`npm run ingest` regenerates the JSON; it also runs automatically on
`predev`/`prebuild`, so updating `data.xlsx` and redeploying is enough.

## Detected column mapping

| Field         | Source column          |
| ------------- | ---------------------- |
| Unit name     | `Listing Nickname`     |
| Property id   | parsed from `Listing` `<a href>` |
| City / State  | `City` / `State`       |
| Type          | `Property Type`        |
| Revenue       | monthly `Total Host Payout` columns (06/2020 → 03/2026) |

## Features

- Global filters: date range (+ YTD / T12M / T24M / All presets), city, unit
  (searchable), property type.
- KPI cards: range revenue, latest-month MoM, YoY, trailing-12-month + YoY,
  active units / cities, avg revenue per active unit.
- Charts: monthly revenue trend with 3-month moving average and a linear
  forecast (3/6/12-month, clearly labeled an estimate); year-over-year
  seasonality (one line per year); revenue by city.
- Unit-by-unit table grouped by city with annual columns, per-city subtotals,
  grand total, expandable per-unit monthly history, and CSV export.

## Similar-name handling (listing hygiene)

`app/lib/dedup.ts` classifies listings and **never auto-merges**:

- **Likely recreated** — near-identical names for the _same_ unit
  (`New`, `r5/r6/r7`, `(HR)`, spacing/abbrev variants). Flagged as merge
  candidates; hide stale ones to preview a merged view.
- **Possible** — fuzzy (Jaro-Winkler ≥ 0.9, or strong token overlap) matches
  that didn't share a clean property key (e.g. `McPherson` ↔ `1326 Mcpherson Ave`).
- **Multi-unit — kept** — same building, _distinct_ units (duplex/triplex such as
  `356 Flint - Main`/`- Rear`, `3501 Moss Ln 1`/`2`, `1-261`/`2-261 Fletcher`).
  Detected via unit slots and **intentionally NOT merged**.
- **Bundles** — whole-house combined listings (`… 2 Homes`), shown for context.

Tune thresholds in `dedup.ts` (`isCandidate`) once you see your real name noise.
