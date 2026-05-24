import en from "./en";
import ht from "./ht";
import vi from "./vi";

export const LOCALES = {
  en,
  vi,
  ht,
} as const;

export type Language = keyof typeof LOCALES;

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGES = Object.values(LOCALES).map((locale) => ({
  code: locale.code as Language,
  name: locale.name,
  shortName: locale.shortName,
  flag: locale.flag,
}));

export const DATE_LOCALES = Object.fromEntries(
  Object.entries(LOCALES).map(([code, locale]) => [
    code,
    "dateLocale" in locale ? locale.dateLocale : undefined,
  ])
) as { [K in Language]: string | undefined };

export const TRANSLATIONS = Object.fromEntries(
  Object.entries(LOCALES).map(([code, locale]) => [code, locale.translations])
) as { [K in Language]: typeof en.translations };

export const AREA_LABELS = Object.fromEntries(
  Object.entries(LOCALES).map(([code, locale]) => [code, locale.areaLabels])
) as { [K in Language]: typeof en.areaLabels };

export const AREA_SHORT_LABELS = Object.fromEntries(
  Object.entries(LOCALES).map(([code, locale]) => [code, locale.areaShortLabels])
) as { [K in Language]: typeof en.areaShortLabels };

export const MONTH_LABELS = Object.fromEntries(
  Object.entries(LOCALES).map(([code, locale]) => [code, locale.monthLabels])
) as unknown as { [K in Language]: readonly string[] };

export const MONTH_SHORT_LABELS = Object.fromEntries(
  Object.entries(LOCALES).map(([code, locale]) => [code, locale.monthShortLabels])
) as unknown as { [K in Language]: readonly string[] };

export function isLanguage(value: string | null): value is Language {
  return value !== null && value in LOCALES;
}

export function translate(language: Language, key: string, params: Record<string, string> = {}) {
  let value: string =
    TRANSLATIONS[language][key as keyof typeof en.translations] ??
    TRANSLATIONS[DEFAULT_LANGUAGE][key as keyof typeof en.translations] ??
    key;
  for (const [param, replacement] of Object.entries(params)) {
    value = value.replaceAll(`{${param}}`, replacement);
  }
  return value;
}
