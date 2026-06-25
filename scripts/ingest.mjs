// Parses the single data.xlsx pivot export (Guesty "Total Host Payout" by month)
// into a clean, typed JSON dataset consumed by the dashboard at runtime.
// Run automatically via predev/prebuild, or manually: `npm run ingest`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function findWorkbook() {
  const files = fs
    .readdirSync(ROOT)
    .filter((f) => /\.xlsx?$/i.test(f) && !f.startsWith("~$"));
  if (files.length === 0) {
    throw new Error("No .xls/.xlsx file found in project root.");
  }
  // Prefer data.xlsx if present, else the first spreadsheet found.
  const preferred = files.find((f) => /^data\.xlsx?$/i.test(f)) ?? files[0];
  return path.join(ROOT, preferred);
}

function cleanNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (s === "" || s.toLowerCase() === "nan") return null;
  const neg = /^\(.*\)$/.test(s);
  const cleaned = s.replace(/[(),$\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

function parseListingCell(raw) {
  if (raw === null || raw === undefined) return { id: null, url: null, text: null };
  const s = String(raw);
  const urlMatch = s.match(/href="([^"]+)"/i);
  const url = urlMatch ? urlMatch[1] : null;
  const idMatch = url ? url.match(/properties\/([a-f0-9]{6,})/i) : null;
  const id = idMatch ? idMatch[1] : null;
  const text = s
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { id, url, text: text || null };
}

function monthKeyFromLabel(label) {
  // label like "06/2020"
  const m = String(label).trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const mm = m[1].padStart(2, "0");
  return `${m[2]}-${mm}`;
}

function main() {
  const wbPath = findWorkbook();
  const wb = XLSX.readFile(wbPath);
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "pivot") ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  // Row 0 = field headers (Listing, Listing Nickname, State, City, Property Type, ...)
  // Row 1 = month labels living under the value columns, ending with "Grand Total".
  const monthRow = rows[1] ?? [];
  const META_END = 5; // cols 0..4 are metadata; values begin at col 5

  const monthCols = []; // { col, key }
  let totalCol = null;
  for (let c = META_END; c < monthRow.length; c++) {
    const label = monthRow[c];
    if (label == null) continue;
    if (String(label).trim().toLowerCase() === "grand total") {
      totalCol = c;
      continue;
    }
    const key = monthKeyFromLabel(label);
    if (key) monthCols.push({ col: c, key });
  }
  monthCols.sort((a, b) => (a.key < b.key ? -1 : 1));
  const months = monthCols.map((m) => m.key);

  const listings = [];
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const { id, url, text } = parseListingCell(row[0]);
    const nickname = row[1] != null ? String(row[1]).trim() : null;
    // Skip the trailing "Grand Total" summary row and empty rows.
    if (!nickname && !text) continue;
    if ((text ?? "").toLowerCase() === "grand total") continue;
    if ((nickname ?? "").toLowerCase() === "grand total") continue;

    const monthly = {};
    let computedTotal = 0;
    let hasAny = false;
    for (const { col, key } of monthCols) {
      const v = cleanNumber(row[col]);
      monthly[key] = v;
      if (v !== null) {
        computedTotal += v;
        hasAny = true;
      }
    }
    const reportedTotal = cleanNumber(row[totalCol]);

    listings.push({
      id: id ?? `row-${r}`,
      url,
      name: nickname || text || `Listing ${r}`,
      state: row[2] != null ? String(row[2]).trim() : "UNKNOWN",
      city: row[3] != null ? String(row[3]).trim() : "UNKNOWN",
      propertyType: row[4] != null ? String(row[4]).trim() : "Unknown",
      monthly,
      total: reportedTotal != null ? reportedTotal : hasAny ? computedTotal : 0,
    });
  }

  const dataset = {
    generatedAt: new Date().toISOString(),
    source: path.basename(wbPath),
    sheet: sheetName,
    months,
    monthRange: months.length ? { start: months[0], end: months[months.length - 1] } : null,
    listings,
  };

  const outDir = path.join(ROOT, "app", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "dataset.json");
  fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));

  console.log(
    `[ingest] ${path.basename(wbPath)} → app/data/dataset.json | ${listings.length} listings, ${months.length} months (${dataset.monthRange?.start}…${dataset.monthRange?.end})`
  );
}

main();
