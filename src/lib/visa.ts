export const AREA_ORDER = ["all_chargeability", "china", "india", "mexico", "philippines"] as const;

export type AreaKey = (typeof AREA_ORDER)[number];
export type { Language } from "../locales/index";
export {
  AREA_LABELS,
  AREA_SHORT_LABELS,
  DATE_LOCALES,
  isLanguage,
  LANGUAGES,
  MONTH_LABELS,
  MONTH_SHORT_LABELS,
  translate,
} from "../locales/index";
import { type Language, DATE_LOCALES, MONTH_LABELS, MONTH_SHORT_LABELS, translate } from "../locales/index";
export type CutoffKind = "current" | "unavailable" | "unknown" | "date";

export interface ManifestMonth {
  key: string;
  label: string;
  path: string;
  url: string;
}

export interface Manifest {
  schemaVersion: number;
  generatedAt: string;
  start: string;
  end: string;
  months: ManifestMonth[];
}

export interface MonthCacheRow {
  group: string;
  category: string;
  areas: Record<AreaKey, string>;
}

export interface MonthCache {
  schemaVersion: number;
  bulletinMonth: string;
  bulletinYear: number;
  bulletinLabel: string;
  bulletinKey: string;
  url: string;
  rows: MonthCacheRow[];
}

export interface Cutoff {
  raw: string;
  kind: CutoffKind;
  iso: string | null;
  ordinal: number | null;
}

export interface VisaRow {
  bulletinMonth: string;
  bulletinYear: number;
  bulletinLabel: string;
  bulletinKey: string;
  url: string;
  group: string;
  category: string;
  country: AreaKey;
  countryLabel: AreaKey;
  cutoff: Cutoff;
}

export interface VisaData {
  manifest: Manifest;
  bulletins: ManifestMonth[];
  rows: VisaRow[];
}

export interface MonthYear {
  month: number;
  year: number;
}

const BASE_URL = "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin";

const MONTH_ABBR: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

export function bulletinKey(monthYear: MonthYear) {
  return `${monthYear.year}-${String(monthYear.month).padStart(2, "0")}`;
}

export function parseBulletinKey(key: string): MonthYear {
  const [year, month] = key.split("-").map(Number);
  return { month, year };
}

export function monthRange(startKey: string, endKey: string): MonthYear[] {
  const start = parseBulletinKey(startKey <= endKey ? startKey : endKey);
  const end = parseBulletinKey(startKey <= endKey ? endKey : startKey);
  const result: MonthYear[] = [];
  let year = start.year;
  let month = start.month;
  while (year * 100 + month <= end.year * 100 + end.month) {
    result.push({ month, year });
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

export function localizedBulletinLabel(language: Language, bulletin: Pick<ManifestMonth, "key">) {
  const { month, year } = parseBulletinKey(bulletin.key);
  return `${MONTH_LABELS[language][month] ?? MONTH_LABELS.en[month]} ${year}`;
}

export function localizedBulletinShortLabel(
  language: Language,
  bulletin: Pick<ManifestMonth, "key">
) {
  const { month, year } = parseBulletinKey(bulletin.key);
  const shortMonth = MONTH_SHORT_LABELS[language][month] ?? MONTH_SHORT_LABELS.en[month];
  return `${shortMonth} ${year}`;
}

function fiscalYear(monthYear: MonthYear): number {
  return monthYear.month >= 10 ? monthYear.year + 1 : monthYear.year;
}

function bulletinUrl(monthYear: MonthYear): string {
  const monthName = MONTH_LABELS.en[monthYear.month].toLowerCase();
  return `${BASE_URL}/${fiscalYear(
    monthYear
  )}/visa-bulletin-for-${monthName}-${monthYear.year}.html`;
}

export function manifestMonthFromKey(key: string): ManifestMonth {
  const monthYear = parseBulletinKey(key);
  return {
    key,
    label: `${MONTH_LABELS.en[monthYear.month]} ${monthYear.year}`,
    path: `${key}.json`,
    url: bulletinUrl(monthYear),
  };
}

export function categorySortKey(category: string) {
  return (
    (
      {
        F1: "A01",
        F2A: "A02",
        F2B: "A03",
        F3: "A04",
        F4: "A05",
        "EB-1": "B01",
        "EB-2": "B02",
        "EB-3": "B03",
        "EB-3 Other Workers": "B04",
        "EB-4": "B05",
        "EB-4 Certain Religious Workers": "B06",
        "EB-5 Unreserved": "B07",
      } as Record<string, string>
    )[category] ?? `Z${category}`
  );
}

/** Returns a cleaner display name by removing "Set Aside" (which doesn't add value in the UI). */
export function getCategoryDisplayName(category: string): string {
  return category.replace(" Set Aside", "");
}

// English fallbacks for category tooltips (used only if no i18n entry exists yet).
// These are intentionally kept in sync with src/locales/en.ts as a last-resort fallback.
export const DEFAULT_CATEGORY_TOOLTIPS: Record<string, string> = {
  F1: "Family 1st Preference: Unmarried sons/daughters of U.S. citizens",
  F2A: "Family 2nd Pref (F2A): Spouses & children of permanent residents",
  F2B: "Family 2nd Pref (F2B): Unmarried sons/daughters (21+) of permanent residents",
  F3: "Family 3rd Preference: Married sons/daughters of U.S. citizens",
  F4: "Family 4th Preference: Siblings of U.S. citizens (and their families)",
  "EB-1": "EB-1: Priority workers (extraordinary ability, outstanding professors, multinational executives)",
  "EB-2": "EB-2: Advanced degree professionals or exceptional ability",
  "EB-3": "EB-3: Skilled workers, professionals & other workers",
  "EB-3 Other Workers": "EB-3 Other Workers: Jobs requiring <2 years training/experience",
  "EB-4": "EB-4: Special immigrants (religious, broadcasters, etc.)",
  "EB-4 Certain Religious Workers": "EB-4 Certain Religious Workers: Non-profit religious organization workers",
  "EB-5 Unreserved": "EB-5 Unreserved: Immigrant investors (general category)",
  "EB-5 Set Aside Rural": "EB-5 Rural: Set-aside visas for rural area investments",
  "EB-5 Set Aside High Unemployment": "EB-5 High Unemployment: Set-aside for targeted high-unemployment areas",
  "EB-5 Set Aside Infrastructure": "EB-5 Infrastructure: Set-aside for infrastructure projects",
};

export function ordinalToIso(value: number | null | undefined) {
  const epochOrdinal = 719163;
  if (value === null || value === undefined || value < epochOrdinal) return "";
  return new Date((value - epochOrdinal) * 86400000).toISOString().slice(0, 10);
}

/**
 * Returns a human-friendly, locale-aware display string for a cutoff value.
 * Prefers the parsed ISO date for actual dates; uses translated labels for
 * Current / Unavailable / Unknown. Used to unify presentation in tables.
 */
export function formatCutoffForDisplay(language: Language, cutoff: Cutoff): string {
  switch (cutoff.kind) {
    case "current":
      return translate(language, "cutoffCurrent");
    case "unavailable":
      return translate(language, "cutoffUnavailable");
    case "date":
      return cutoff.iso ?? cutoff.raw;
    case "unknown":
    default:
      return translate(language, "cutoffUnknown");
  }
}

/**
 * Formats the manifest generatedAt timestamp into a polished, short,
 * locale-aware string (e.g. "May 23, 2026, 2:30 PM").
 * Uses DATE_LOCALES for proper Intl formatting per language.
 */
export function formatGeneratedAt(language: Language, generatedAt: string): string {
  try {
    const date = new Date(generatedAt);
    if (Number.isNaN(date.getTime())) {
      return generatedAt;
    }
    const locale = DATE_LOCALES[language];
    const dateStr = date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return generatedAt;
  }
}

function parseCutoff(value: string): Cutoff {
  const clean = String(value || "")
    .trim()
    .toUpperCase();
  if (clean === "C" || clean === "CURRENT") {
    return { raw: value, kind: "current", iso: null, ordinal: null };
  }
  if (clean === "U" || clean === "UNAVAILABLE") {
    return { raw: value, kind: "unavailable", iso: null, ordinal: null };
  }
  const match = clean.replace(/[^A-Z0-9]/g, "").match(/^(\d{1,2})([A-Z]{3})(\d{2})$/);
  if (!match || MONTH_ABBR[match[2]] === undefined) {
    return { raw: value, kind: "unknown", iso: null, ordinal: null };
  }
  const day = Number(match[1]);
  const month = MONTH_ABBR[match[2]];
  const yy = Number(match[3]);
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return { raw: value, kind: "unknown", iso: null, ordinal: null };
  const iso = date.toISOString().slice(0, 10);
  return {
    raw: value,
    kind: "date",
    iso,
    ordinal: Math.floor(date.getTime() / 86400000) + 719163,
  };
}

async function fetchFirst<T>(paths: string[]): Promise<T> {
  const failures: string[] = [];
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) return (await response.json()) as T;
      failures.push(`${path} -> ${response.status}`);
    } catch (error) {
      failures.push(`${path} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(failures.join("; "));
}

export function rowsFromMonth(cache: MonthCache): VisaRow[] {
  return cache.rows.flatMap((row) =>
    AREA_ORDER.map((country) => ({
      bulletinMonth: cache.bulletinMonth,
      bulletinYear: cache.bulletinYear,
      bulletinLabel: cache.bulletinLabel,
      bulletinKey: cache.bulletinKey,
      url: cache.url,
      group: row.group,
      category: row.category,
      country,
      countryLabel: country,
      cutoff: parseCutoff(row.areas[country]),
    }))
  );
}

export async function loadVisaData(): Promise<VisaData> {
  const manifest = await fetchFirst<Manifest>(["data/manifest.json", "/data/manifest.json"]);
  const monthCaches = await Promise.all(
    manifest.months.map((month) =>
      fetchFirst<MonthCache>([`data/${month.path}`, `/data/${month.path}`])
    )
  );
  return {
    manifest,
    bulletins: manifest.months,
    rows: monthCaches.flatMap(rowsFromMonth),
  };
}
