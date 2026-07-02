import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "./components/DataTable";
import { FilterPanel } from "./components/FilterPanel";
import { Button } from "./components/ui/button";
import { Select } from "./components/ui/select";
import { VisaChart } from "./components/VisaChart";
import {
  AREA_ORDER,
  categorySortKey,
  formatGeneratedAt,
  isLanguage,
  LANGUAGES,
  Language,
  loadVisaData,
  localizedBulletinLabel,
  translate,
  VisaData,
} from "./lib/visa";
import { isDarkMode, readTheme, ThemeMode } from "./lib/theme";

const FILTER_STATE_KEY = "visaBulletinFilterState";

interface StoredFilterState {
  start?: string;
  end?: string;
  categories?: string[];
  countries?: string[];
}

function readStoredFilterState(): StoredFilterState {
  const raw = localStorage.getItem(FILTER_STATE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredFilterState;
    return {
      start: typeof parsed.start === "string" ? parsed.start : undefined,
      end: typeof parsed.end === "string" ? parsed.end : undefined,
      categories: Array.isArray(parsed.categories)
        ? parsed.categories.filter((category): category is string => typeof category === "string")
        : undefined,
      countries: Array.isArray(parsed.countries)
        ? parsed.countries.filter((country): country is string => typeof country === "string")
        : undefined,
    };
  } catch {
    localStorage.removeItem(FILTER_STATE_KEY);
    return {};
  }
}

function readLanguage(): Language {
  const stored = localStorage.getItem("language");
  return isLanguage(stored) ? stored : "en";
}

export function App() {
  const [data, setData] = useState<VisaData | null>(null);
  const [dataError, setDataError] = useState<Error | null>(null);
  const [language, setLanguage] = useState<Language>(readLanguage);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readTheme);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(AREA_ORDER));

  const fetchData = useCallback(() => {
    let cancelled = false;
    setDataError(null);
    void loadVisaData()
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch((error) => {
        if (!cancelled) {
          setDataError(error instanceof Error ? error : new Error(String(error)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => fetchData(), [fetchData]);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(language, key, params),
    [language]
  );
  const bulletinLabel = useCallback(
    (key: string) => localizedBulletinLabel(language, { key }),
    [language]
  );

  const categories = useMemo(
    () =>
      [...new Set((data?.rows ?? []).map((row) => row.category))].sort((a, b) =>
        categorySortKey(a).localeCompare(categorySortKey(b))
      ),
    [data]
  );

  useEffect(() => {
    if (!data || start || end) return;
    const stored = readStoredFilterState();
    const bulletinKeys = new Set(data.bulletins.map((bulletin) => bulletin.key));
    const categorySet = new Set(categories);
    const countrySet = new Set(AREA_ORDER);

    setStart(
      typeof stored.start === "string" && bulletinKeys.has(stored.start)
        ? stored.start
        : (data.bulletins[0]?.key ?? "")
    );
    setEnd(
      typeof stored.end === "string" && bulletinKeys.has(stored.end)
        ? stored.end
        : (data.bulletins.at(-1)?.key ?? "")
    );
    setSelectedCategories(
      new Set(
        Array.isArray(stored.categories)
          ? stored.categories.filter((category) => categorySet.has(category))
          : categories.filter((category) => category === "F2B")
      )
    );
    setSelectedCountries(
      new Set(
        Array.isArray(stored.countries)
          ? stored.countries.filter((country) =>
              countrySet.has(country as (typeof AREA_ORDER)[number])
            )
          : AREA_ORDER
      )
    );
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: only run on data arrival; guard prevents re-init; including start/end/categories would cause the exact anti-pattern the prior version had

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t("title");
    localStorage.setItem("language", language);
  }, [language, t]);

  // Theme: persist, respect system, apply .dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode(themeMode));
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [themeMode]);

  useEffect(() => {
    if (!data || !start || !end) return;
    localStorage.setItem(
      FILTER_STATE_KEY,
      JSON.stringify({
        start,
        end,
        categories: [...selectedCategories],
        countries: [...selectedCountries],
      })
    );
  }, [data, end, selectedCategories, selectedCountries, start]);

  const activeBulletins = useMemo(() => {
    if (!data || !start || !end) return [];
    const first = start <= end ? start : end;
    const last = start <= end ? end : start;
    return data.bulletins.filter((bulletin) => bulletin.key >= first && bulletin.key <= last);
  }, [data, end, start]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    const selectedBulletinKeys = new Set(activeBulletins.map((bulletin) => bulletin.key));
    return data.rows
      .filter(
        (row) =>
          selectedCategories.has(row.category) &&
          selectedCountries.has(row.country) &&
          selectedBulletinKeys.has(row.bulletinKey)
      )
      .sort(
        (a, b) =>
          b.bulletinKey.localeCompare(a.bulletinKey) ||
          categorySortKey(a.category).localeCompare(categorySortKey(b.category)) ||
          AREA_ORDER.indexOf(a.country) - AREA_ORDER.indexOf(b.country)
      );
  }, [activeBulletins, data, selectedCategories, selectedCountries]);

  const seriesKeys = useMemo(
    () => [...new Set(filteredRows.map((row) => `${row.category}|${row.country}`))].sort(),
    [filteredRows]
  );

  const rangeText = useMemo(() => {
    if (!data || data.bulletins.length === 0) return t("loading");
    return t("cachedRange", {
      start: localizedBulletinLabel(language, data.bulletins[0]),
      end: localizedBulletinLabel(language, data.bulletins[data.bulletins.length - 1]),
      generated: formatGeneratedAt(language, data.manifest.generatedAt),
    });
  }, [data, language, t]);

  const toggleCategory = (category: string, checked: boolean) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (checked) next.add(category);
      else next.delete(category);
      return next;
    });
  };

  const toggleCountry = (country: (typeof AREA_ORDER)[number], checked: boolean) => {
    setSelectedCountries((current) => {
      const next = new Set(current);
      if (checked) next.add(country);
      else next.delete(country);
      return next;
    });
  };

  const cycleTheme = () => {
    setThemeMode((current) => {
      if (current === "system") return "light";
      if (current === "light") return "dark";
      return "system";
    });
  };

  const themeIcon = (mode: ThemeMode) => (mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "💻");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{rangeText}</p>
          <p className="text-sm text-muted-foreground">{t("note")}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={cycleTheme}
            aria-label={`${t("theme")}: ${t(themeMode)}`}
            title={`${t("theme")}: ${t(themeMode)}`}
            className="flex h-9 items-center gap-1.5 px-2.5 py-0 text-sm"
          >
            <span aria-hidden="true" className="text-base leading-none">
              {themeIcon(themeMode)}
            </span>
            <span className="text-xs font-medium capitalize">{t(themeMode)}</span>
          </Button>
          <div className="w-full sm:w-52">
            <label className="sr-only" htmlFor="language-select">
              {t("languageLabel")}
            </label>
            <Select
              id="language-select"
              name="language"
              value={language}
              aria-label={t("languageLabel")}
              onChange={(event) => setLanguage(event.currentTarget.value as Language)}
            >
              {LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.flag} {option.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </header>

      {dataError && (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-[color:var(--color-destructive-foreground)]">
          <h2 className="font-semibold">{t("loadErrorTitle")}</h2>
          <p>{dataError.message}</p>
          <p>{t("loadErrorHelp")}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={fetchData}>
            {t("retry")}
          </Button>
        </section>
      )}

      {!data && !dataError ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : data && (!start || !end) ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <FilterPanel
            className="order-1 lg:sticky lg:top-4 lg:order-2"
            language={language}
            start={start}
            setStart={setStart}
            end={end}
            setEnd={setEnd}
            availableBulletins={data.bulletins}
            categories={categories}
            selectedCategories={selectedCategories}
            setAllCategories={(checked) =>
              setSelectedCategories(new Set(checked ? categories : []))
            }
            toggleCategory={toggleCategory}
            selectedCountries={selectedCountries}
            setAllCountries={(checked) => setSelectedCountries(new Set(checked ? AREA_ORDER : []))}
            toggleCountry={toggleCountry}
            rowsCount={filteredRows.length}
            linesCount={seriesKeys.length}
            t={t}
          />
          <main className="order-2 min-w-0 space-y-6 lg:order-1">
            <VisaChart
              activeBulletins={activeBulletins}
              rows={filteredRows}
              language={language}
              themeMode={themeMode}
              t={t}
            />
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">{t("filteredData")}</h2>
              <DataTable
                rows={filteredRows}
                language={language}
                t={t}
                bulletinLabel={bulletinLabel}
              />
            </section>
          </main>
        </div>
      ) : null}
    </div>
  );
}
