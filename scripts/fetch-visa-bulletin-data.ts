#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "node-html-parser";

const BASE_URL = "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin";
const USER_AGENT = "uscis-tracker/1.0 (+https://travel.state.gov/)";
const DATA_DIR = "data";

const AREA_ORDER = ["all_chargeability", "china", "india", "mexico", "philippines"] as const;
type AreaKey = (typeof AREA_ORDER)[number];
type VisaGroup = "family" | "employment" | "unknown";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

interface MonthYear {
  month: number;
  year: number;
}

interface CliArgs {
  start: MonthYear;
  end: MonthYear;
  concurrency: number;
  logFormat: LogFormat;
}

interface ParsedTableRow {
  group: VisaGroup;
  category: string;
  areas: Record<AreaKey, string>;
}

interface MonthlyCache {
  schemaVersion: 1;
  bulletinMonth: string;
  bulletinYear: number;
  bulletinLabel: string;
  bulletinKey: string;
  url: string;
  rows: ParsedTableRow[];
}

interface CacheManifestMonth {
  key: string;
  label: string;
  path: string;
  url: string;
}

interface CacheManifest {
  schemaVersion: 1;
  generatedAt: string;
  start: string;
  end: string;
  months: CacheManifestMonth[];
}

type LogLevel = "info" | "warn" | "error";
type LogFormat = "pretty" | "json";
type LogFields = Record<string, string | number | boolean | null>;

let logFormat: LogFormat = "pretty";

function formatPrettyLog(level: LogLevel, event: string, fields: LogFields): string {
  const icon = level === "error" ? "✖" : level === "warn" ? "⚠" : "•";
  const details = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  return details.length > 0 ? `${icon} ${event} ${details}` : `${icon} ${event}`;
}

function log(level: LogLevel, event: string, fields: LogFields = {}): void {
  const line =
    logFormat === "json"
      ? JSON.stringify({
          timestamp: new Date().toISOString(),
          level,
          event,
          ...fields,
        })
      : formatPrettyLog(level, event, fields);
  if (level === "info") console.log(line);
  else console.error(line);
}

function label(monthYear: MonthYear): string {
  return `${MONTH_NAMES[monthYear.month]} ${monthYear.year}`;
}

function bulletinKey(monthYear: MonthYear): string {
  return `${monthYear.year}-${String(monthYear.month).padStart(2, "0")}`;
}

function slug(monthYear: MonthYear): string {
  return MONTH_NAMES[monthYear.month].toLowerCase();
}

function key(monthYear: MonthYear): number {
  return monthYear.year * 100 + monthYear.month;
}

function parseMonthYear(value: string, name: string): MonthYear {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (match === null) {
    throw new Error(`${name} must use YYYY-MM format`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || month < 1 || month > 12) {
    throw new Error(`invalid ${name}: ${value}`);
  }
  return { month, year };
}

function defaultRange(): { start: MonthYear; end: MonthYear } {
  const now = new Date();
  return {
    start: { month: 1, year: 2005 },
    end: { month: now.getMonth() + 1, year: now.getFullYear() },
  };
}

function parseArgs(argv: string[]): CliArgs {
  const range = {
    ...defaultRange(),
    concurrency: 4,
    logFormat: "pretty" as LogFormat,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") {
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    const next = argv[i + 1];
    if (arg === "--start") {
      if (next === undefined) throw new Error("missing value for --start");
      range.start = parseMonthYear(next, "--start");
      i += 1;
    } else if (arg === "--end") {
      if (next === undefined) throw new Error("missing value for --end");
      range.end = parseMonthYear(next, "--end");
      i += 1;
    } else if (arg === "--concurrency") {
      if (next === undefined) throw new Error("missing value for --concurrency");
      const concurrency = Number(next);
      if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 12) {
        throw new Error("--concurrency must be an integer from 1 to 12");
      }
      range.concurrency = concurrency;
      i += 1;
    } else if (arg === "--log-format") {
      if (next !== "pretty" && next !== "json") {
        throw new Error("--log-format must be pretty or json");
      }
      range.logFormat = next;
      i += 1;
    } else if (arg === "--json") {
      range.logFormat = "json";
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (key(range.start) > key(range.end)) {
    throw new Error("--start must not be after --end");
  }
  return range;
}

function monthRange(start: MonthYear, end: MonthYear): MonthYear[] {
  if (key(start) > key(end)) {
    throw new Error("start month/year must not be after end month/year");
  }
  const result: MonthYear[] = [];
  let year = start.year;
  let month = start.month;
  while (year * 100 + month <= key(end)) {
    result.push({ month, year });
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

function fiscalYear(monthYear: MonthYear): number {
  return monthYear.month >= 10 ? monthYear.year + 1 : monthYear.year;
}

function bulletinUrl(monthYear: MonthYear): string {
  return bulletinUrls(monthYear)[0];
}

function bulletinUrls(monthYear: MonthYear): string[] {
  const fy = fiscalYear(monthYear);
  const monthSlug = slug(monthYear);
  return [
    `${BASE_URL}/${fy}/visa-bulletin-for-${monthSlug}-${monthYear.year}.html`,
    `${BASE_URL}/${fy}/visa-bulletin-${monthSlug}-${monthYear.year}.html`,
  ];
}

function dataPath(monthYear: MonthYear): string {
  return `${DATA_DIR}/${bulletinKey(monthYear)}.json`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class NonRetryFetchError extends Error {}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchHtml(url: string): Promise<string> {
  const maxAttempts = 4;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) return await response.text();

      const message = `HTTP Error ${response.status}: ${response.statusText}`;
      if (!shouldRetryStatus(response.status)) {
        throw new NonRetryFetchError(message);
      }
      if (attempt === maxAttempts) throw new Error(message);
      lastError = new Error(message);
    } catch (error) {
      if (error instanceof NonRetryFetchError) throw error;
      lastError = error;
      if (attempt === maxAttempts) break;
    }

    const delay = 500 * 2 ** (attempt - 1);
    log("warn", "fetch_retry", {
      url,
      attempt,
      maxAttempts,
      delayMs: delay,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });
    await sleep(delay);
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function normalizeSpace(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTables(pageHtml: string): string[][][] {
  const root = parse(pageHtml, {
    blockTextElements: { script: false, style: false },
  });
  return root
    .querySelectorAll("table")
    .map((table) =>
      table
        .querySelectorAll("tr")
        .map((row) => row.querySelectorAll("th, td").map((cell) => normalizeSpace(cell.text)))
        .filter((row) => row.some((cell) => cell.length > 0))
    )
    .filter((table) => table.length > 0);
}

function normalizeHeader(header: string): AreaKey | null {
  const h = header
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
  if (h.includes("all chargeability")) return "all_chargeability";
  if (h.includes("china")) return "china";
  if (h.includes("india")) return "india";
  if (h.includes("mexico")) return "mexico";
  if (h.includes("philippines")) return "philippines";
  return null;
}

function detectTableGroup(table: string[][]): VisaGroup {
  const text = table.flat().join(" ").toLowerCase();
  if (text.includes("family-sponsored") || /\bf2a\b|\bf2b\b/.test(text)) {
    return "family";
  }
  if (text.includes("employment-based") || text.includes("employment based")) {
    return "employment";
  }
  return "unknown";
}

function normalizeCategory(value: string): string {
  const category = normalizeSpace(value).replace(/\*+/g, "").trim();
  const upper = category.toUpperCase();
  if (/^1ST\b/.test(upper)) return "EB-1";
  if (/^2ND\b/.test(upper)) return "EB-2";
  if (/^3RD\b/.test(upper)) return "EB-3";
  if (upper === "OTHER WORKERS") return "EB-3 Other Workers";
  if (/^4TH\b/.test(upper)) return "EB-4";
  if (upper === "CERTAIN RELIGIOUS WORKERS") {
    return "EB-4 Certain Religious Workers";
  }
  if (/^5TH UNRESERVED\b/.test(upper)) return "EB-5 Unreserved";
  if (/^5TH SET ASIDE.*RURAL/.test(upper)) return "EB-5 Set Aside Rural";
  if (/^5TH SET ASIDE.*HIGH UNEMPLOYMENT/.test(upper)) {
    return "EB-5 Set Aside High Unemployment";
  }
  if (/^5TH SET ASIDE.*INFRASTRUCTURE/.test(upper)) {
    return "EB-5 Set Aside Infrastructure";
  }
  return category;
}

function isVisaCategory(value: string): boolean {
  const category = normalizeCategory(value).toUpperCase();
  return /^(F\d[A-Z]?|EB-\d.*)$/i.test(category);
}

function groupForCategory(category: string, tableGroup: VisaGroup): VisaGroup {
  if (/^F\d[A-Z]?$/i.test(category)) return "family";
  if (/^EB-\d/i.test(category)) return "employment";
  return tableGroup;
}

function categorySortKey(category: string): string {
  const normalized = category.toUpperCase();
  const order: Record<string, string> = {
    F1: "A01",
    F2A: "A02",
    F2B: "A03",
    F3: "A04",
    F4: "A05",
    "EB-1": "B01",
    "EB-2": "B02",
    "EB-3": "B03",
    "EB-3 OTHER WORKERS": "B04",
    "EB-4": "B05",
    "EB-4 CERTAIN RELIGIOUS WORKERS": "B06",
    "EB-5 UNRESERVED": "B07",
    "EB-5 SET ASIDE RURAL": "B08",
    "EB-5 SET ASIDE HIGH UNEMPLOYMENT": "B09",
    "EB-5 SET ASIDE INFRASTRUCTURE": "B10",
  };
  return order[normalized] ?? `Z${normalized}`;
}

function parseVisaTables(pageHtml: string): ParsedTableRow[] {
  const parsedRows: ParsedTableRow[] = [];
  const seen = new Set<string>();

  for (const table of extractTables(pageHtml)) {
    const headerIndex = table.findIndex((row) => {
      const normalized = row.map((cell) => normalizeHeader(cell));
      return normalized.includes("all_chargeability") && normalized.filter(Boolean).length >= 3;
    });
    if (headerIndex < 0) continue;

    const header = table[headerIndex];
    const tableGroup = detectTableGroup(table);

    for (const row of table.slice(headerIndex + 1)) {
      if (row.length < 2 || !isVisaCategory(row[0])) continue;
      const category = normalizeCategory(row[0]);
      const group = groupForCategory(category, tableGroup);
      const values = row.slice(1);
      const headers = header.slice(-values.length);
      const areas: Partial<Record<AreaKey, string>> = {};
      for (let i = 0; i < values.length; i += 1) {
        const area = normalizeHeader(headers[i]);
        if (area !== null) {
          areas[area] = normalizeSpace(values[i]).toUpperCase();
        }
      }

      if (AREA_ORDER.some((area) => areas[area] === undefined)) continue;

      const uniqueKey = `${group}:${category.toUpperCase()}`;
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);
      parsedRows.push({
        group,
        category,
        areas: areas as Record<AreaKey, string>,
      });
    }
  }

  if (parsedRows.length === 0) {
    throw new Error("could not find Visa Bulletin category rows");
  }
  return parsedRows.sort((a, b) =>
    categorySortKey(a.category).localeCompare(categorySortKey(b.category))
  );
}

function buildMonthlyCache(
  monthYear: MonthYear,
  url: string,
  rows: ParsedTableRow[]
): MonthlyCache {
  return {
    schemaVersion: 1,
    bulletinMonth: MONTH_NAMES[monthYear.month],
    bulletinYear: monthYear.year,
    bulletinLabel: label(monthYear),
    bulletinKey: bulletinKey(monthYear),
    url,
    rows,
  };
}

function readMonthlyCache(value: string): MonthlyCache {
  const parsed = JSON.parse(value) as MonthlyCache;
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.rows)) {
    throw new Error("unsupported cache format");
  }
  return parsed;
}

async function ensureCachedMonth(monthYear: MonthYear): Promise<MonthlyCache> {
  const path = dataPath(monthYear);
  try {
    const cached = readMonthlyCache(await readFile(path, "utf8"));
    log("info", "cache_hit", {
      bulletinKey: bulletinKey(monthYear),
      label: label(monthYear),
      path,
    });
    return cached;
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  const urls = bulletinUrls(monthYear);
  let lastError: unknown;
  for (const url of urls) {
    log("info", "cache_miss", {
      bulletinKey: bulletinKey(monthYear),
      label: label(monthYear),
      url,
    });
    try {
      const cache = buildMonthlyCache(monthYear, url, parseVisaTables(await fetchHtml(url)));
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(path, `${JSON.stringify(cache, null, 2)}\n`);
      return cache;
    } catch (error) {
      lastError = error;
      log("warn", "fetch_candidate_failed", {
        bulletinKey: bulletinKey(monthYear),
        label: label(monthYear),
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function writeManifest(months: MonthYear[], start: MonthYear, end: MonthYear): Promise<void> {
  const manifest: CacheManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    start: bulletinKey(start),
    end: bulletinKey(end),
    months: months.map((monthYear) => ({
      key: bulletinKey(monthYear),
      label: label(monthYear),
      path: `${bulletinKey(monthYear)}.json`,
      url: bulletinUrl(monthYear),
    })),
  };
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(`${DATA_DIR}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
}

function printHelp(): void {
  console.log(`Fetch Visa Bulletin data cache.

Default range:
  2005-01 through the current month.

Command:
  pnpm data

Options:
  --start YYYY-MM             Defaults to 2005-01.
  --end YYYY-MM               Defaults to current month.
  --concurrency N             Concurrent months to process, 1-12. Defaults to 4.
  --log-format pretty|json    Defaults to pretty.
  --json                      Shortcut for --log-format json.
`);
}

async function processMonths(months: MonthYear[], concurrency: number): Promise<MonthYear[]> {
  const cachedMonths: MonthYear[] = [];
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < months.length) {
      const monthYear = months[nextIndex];
      nextIndex += 1;
      try {
        await ensureCachedMonth(monthYear);
        cachedMonths.push(monthYear);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("warn", "month_skipped", {
          bulletinKey: bulletinKey(monthYear),
          label: label(monthYear),
          error: message,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, months.length) }, () => worker()));

  return cachedMonths.sort((a, b) => key(a) - key(b));
}

async function main(): Promise<void> {
  const {
    start,
    end,
    concurrency,
    logFormat: selectedLogFormat,
  } = parseArgs(process.argv.slice(2));
  logFormat = selectedLogFormat;
  const months = monthRange(start, end);
  log("info", "data_fetch_started", {
    start: bulletinKey(start),
    end: bulletinKey(end),
    months: months.length,
    concurrency,
  });
  const cachedMonths = await processMonths(months, concurrency);
  if (cachedMonths.length === 0) {
    throw new Error("no bulletin data could be cached");
  }
  await writeManifest(cachedMonths, cachedMonths[0], cachedMonths.at(-1)!);
  log("info", "manifest_written", {
    path: `${DATA_DIR}/manifest.json`,
    cachedMonths: cachedMonths.length,
    requestedMonths: months.length,
    start: bulletinKey(cachedMonths[0]),
    end: bulletinKey(cachedMonths.at(-1)!),
  });
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  log("error", "data_fetch_failed", { error: message });
  process.exit(1);
}
