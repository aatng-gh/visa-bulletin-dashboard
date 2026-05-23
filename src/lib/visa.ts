export const AREA_ORDER = [
  "all_chargeability",
  "china",
  "india",
  "mexico",
  "philippines",
] as const;

export type AreaKey = (typeof AREA_ORDER)[number];
export type Language = "en" | "vi";
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

export const TRANSLATIONS = {
  en: {
    title: "Visa Bulletin Dashboard",
    loading: "Loading cached bulletin data…",
    note:
      "C = Current, U = Unavailable. Chart lines are created for each selected visa category and country.",
    filteredData: "Filtered data",
    tableBulletin: "Bulletin",
    tableGroup: "Group",
    tableCategory: "Category",
    tableCountry: "Country",
    tableCutoff: "Cutoff",
    language: "Language",
    languageLabel: "Language",
    monthRange: "Month range",
    start: "Start",
    end: "End",
    visaCategories: "Visa categories",
    countries: "Countries / chargeability",
    all: "All",
    none: "None",
    chartTitle: "Visa Bulletin Final Action Date Movement",
    yAxis: "Priority date cutoff",
    xAxis: "Visa Bulletin month",
    rowsSelected: "{rows} rows, {lines} chart lines selected.",
    cachedRange: "Cached range: {start} through {end}. Generated {generated}.",
    loadErrorTitle: "Unable to load data",
    loadErrorHelp:
      "Run the data fetch task and serve this dashboard over HTTP.",
    family: "family",
    employment: "employment",
    unknown: "unknown",
  },
  vi: {
    title: "Bảng theo dõi Lịch chiếu khán",
    loading: "Đang tải dữ liệu đã lưu…",
    note:
      "C = Đang hiệu lực, U = Không khả dụng. Mỗi đường biểu đồ tương ứng với diện visa và quốc gia đã chọn.",
    filteredData: "Dữ liệu đã lọc",
    tableBulletin: "Lịch chiếu khán",
    tableGroup: "Nhóm",
    tableCategory: "Diện visa",
    tableCountry: "Quốc gia",
    tableCutoff: "Ngày ưu tiên",
    language: "Ngôn ngữ",
    languageLabel: "Ngôn ngữ",
    monthRange: "Khoảng tháng",
    start: "Bắt đầu",
    end: "Kết thúc",
    visaCategories: "Diện visa",
    countries: "Quốc gia / khu vực tính visa",
    all: "Tất cả",
    none: "Bỏ chọn",
    chartTitle: "Diễn biến ngày ưu tiên trong Lịch chiếu khán",
    yAxis: "Ngày ưu tiên",
    xAxis: "Tháng của Lịch chiếu khán",
    rowsSelected: "Đã chọn {rows} dòng, {lines} đường biểu đồ.",
    cachedRange: "Dữ liệu đã lưu: từ {start} đến {end}. Cập nhật {generated}.",
    loadErrorTitle: "Không thể tải dữ liệu",
    loadErrorHelp: "Hãy chạy tác vụ tải dữ liệu và mở dashboard qua HTTP.",
    family: "gia đình",
    employment: "việc làm",
    unknown: "không rõ",
  },
} as const;

export const AREA_LABELS: Record<Language, Record<AreaKey, string>> = {
  en: {
    all_chargeability: "All Chargeability Areas Except Those Listed",
    china: "China-mainland born",
    india: "India",
    mexico: "Mexico",
    philippines: "Philippines",
  },
  vi: {
    all_chargeability: "Tất cả khu vực tính visa trừ các khu vực được liệt kê",
    china: "Trung Quốc đại lục",
    india: "Ấn Độ",
    mexico: "Mexico",
    philippines: "Philippines",
  },
};

export const AREA_SHORT_LABELS: Record<Language, Record<AreaKey, string>> = {
  en: {
    all_chargeability: "All",
    china: "China",
    india: "India",
    mexico: "Mexico",
    philippines: "Philippines",
  },
  vi: {
    all_chargeability: "Tất cả",
    china: "Trung Quốc",
    india: "Ấn Độ",
    mexico: "Mexico",
    philippines: "Philippines",
  },
};

export const MONTH_LABELS: Record<Language, string[]> = {
  en: [
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
  ],
  vi: [
    "",
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
};

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

export function translate(
  language: Language,
  key: string,
  params: Record<string, string> = {},
) {
  let value: string =
    TRANSLATIONS[language][key as keyof typeof TRANSLATIONS.en] ??
      TRANSLATIONS.en[key as keyof typeof TRANSLATIONS.en] ?? key;
  for (const [param, replacement] of Object.entries(params)) {
    value = value.replaceAll(`{${param}}`, replacement);
  }
  return value;
}

export function localizedBulletinLabel(
  language: Language,
  bulletin: Pick<ManifestMonth, "key">,
) {
  const [year, month] = bulletin.key.split("-").map(Number);
  return `${MONTH_LABELS[language][month] ?? MONTH_LABELS.en[month]} ${year}`;
}

export function categorySortKey(category: string) {
  return ({
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
    "EB-5 Set Aside Rural": "B08",
    "EB-5 Set Aside High Unemployment": "B09",
    "EB-5 Set Aside Infrastructure": "B10",
  } as Record<string, string>)[category] ?? `Z${category}`;
}

export function ordinalToIso(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  const epochOrdinal = 719163;
  return new Date((value - epochOrdinal) * 86400000).toISOString().slice(0, 10);
}

function parseCutoff(value: string): Cutoff {
  const clean = String(value || "").trim().toUpperCase();
  if (clean === "C" || clean === "CURRENT") {
    return { raw: value, kind: "current", iso: null, ordinal: null };
  }
  if (clean === "U" || clean === "UNAVAILABLE") {
    return { raw: value, kind: "unavailable", iso: null, ordinal: null };
  }
  const match = clean.replace(/[^A-Z0-9]/g, "").match(
    /^(\d{1,2})([A-Z]{3})(\d{2})$/,
  );
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
  ) return { raw: value, kind: "unknown", iso: null, ordinal: null };
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
      if (response.ok) return await response.json() as T;
      failures.push(`${path} -> ${response.status}`);
    } catch (error) {
      failures.push(
        `${path} -> ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  throw new Error(failures.join("; "));
}

function rowsFromMonth(cache: MonthCache): VisaRow[] {
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
  const manifest = await fetchFirst<Manifest>([
    "data/manifest.json",
    "/data/manifest.json",
  ]);
  const monthCaches = await Promise.all(
    manifest.months.map((month) =>
      fetchFirst<MonthCache>([`data/${month.path}`, `/data/${month.path}`])
    ),
  );
  return {
    manifest,
    bulletins: manifest.months,
    rows: monthCaches.flatMap(rowsFromMonth),
  };
}
