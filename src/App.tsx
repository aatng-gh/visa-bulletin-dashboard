import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "./components/DataTable";
import { FilterPanel } from "./components/FilterPanel";
import { Select } from "./components/ui/select";
import { VisaChart } from "./components/VisaChart";
import {
  AREA_ORDER,
  bulletinKey,
  categorySortKey,
  formatGeneratedAt,
  isLanguage,
  LANGUAGES,
  Language,
  loadVisaData,
  localizedBulletinLabel,
  manifestMonthFromKey,
  monthRange,
  translate,
  VisaData,
} from "./lib/visa";

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
    return JSON.parse(raw) as StoredFilterState;
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
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(AREA_ORDER));

  useEffect(() => {
    let cancelled = false;
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

  const activeBulletins = useMemo(
    () => monthRange(start, end).map((monthYear) => manifestMonthFromKey(bulletinKey(monthYear))),
    [end, start]
  );

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{rangeText}</p>
          <p className="text-sm text-muted-foreground">{t("note")}</p>
        </div>
        <div className="w-full sm:w-52">
          <label className="sr-only" htmlFor="language-select">
            {t("languageLabel")}
          </label>
          <Select
            id="language-select"
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
      </header>

      {dataError && (
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <h2 className="font-semibold">{t("loadErrorTitle")}</h2>
          <p>{dataError.message}</p>
          <p>{t("loadErrorHelp")}</p>
        </section>
      )}

      {!data ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <main className="space-y-6">
            <VisaChart
              activeBulletins={activeBulletins}
              rows={filteredRows}
              language={language}
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
          <FilterPanel
            language={language}
            start={start}
            setStart={setStart}
            end={end}
            setEnd={setEnd}
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
        </div>
      )}
    </div>
  );
}
