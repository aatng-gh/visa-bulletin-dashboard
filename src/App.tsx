import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  Show,
} from "solid-js";
import { DataTable } from "./components/DataTable.tsx";
import { FilterPanel } from "./components/FilterPanel.tsx";
import { VisaChart } from "./components/VisaChart.tsx";
import {
  AREA_ORDER,
  categorySortKey,
  Language,
  loadVisaData,
  localizedBulletinLabel,
  translate,
} from "./lib/visa.ts";

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
  return localStorage.getItem("language") === "vi" ? "vi" : "en";
}

export function App() {
  const [data] = createResource(loadVisaData);
  const [language, setLanguage] = createSignal<Language>(readLanguage());
  const [start, setStart] = createSignal("");
  const [end, setEnd] = createSignal("");
  const [selectedCategories, setSelectedCategories] = createSignal<Set<string>>(
    new Set(),
  );
  const [selectedCountries, setSelectedCountries] = createSignal<Set<string>>(
    new Set(AREA_ORDER),
  );

  const t = (key: string, params?: Record<string, string>) =>
    translate(language(), key, params);
  const bulletinLabel = (key: string) =>
    localizedBulletinLabel(language(), { key });

  const categories = createMemo(() =>
    [
      ...new Set((data()?.rows ?? []).map((row) => row.category)),
    ].sort((a, b) => categorySortKey(a).localeCompare(categorySortKey(b)))
  );

  createEffect(() => {
    const loaded = data();
    if (!loaded || start() || end()) return;
    const stored = readStoredFilterState();
    const bulletinKeys = new Set(
      loaded.bulletins.map((bulletin) => bulletin.key),
    );
    const categorySet = new Set(categories());
    const countrySet = new Set(AREA_ORDER);

    setStart(
      typeof stored.start === "string" && bulletinKeys.has(stored.start)
        ? stored.start
        : loaded.bulletins[0]?.key ?? "",
    );
    setEnd(
      typeof stored.end === "string" && bulletinKeys.has(stored.end)
        ? stored.end
        : loaded.bulletins.at(-1)?.key ?? "",
    );
    setSelectedCategories(
      new Set(
        Array.isArray(stored.categories)
          ? stored.categories.filter((category) => categorySet.has(category))
          : categories().filter((category) => category === "F2B"),
      ),
    );
    setSelectedCountries(
      new Set(
        Array.isArray(stored.countries)
          ? stored.countries.filter((country) =>
            countrySet.has(country as typeof AREA_ORDER[number])
          )
          : AREA_ORDER,
      ),
    );
  });

  createEffect(() => {
    document.documentElement.lang = language();
    document.title = t("title");
    localStorage.setItem("language", language());
  });

  createEffect(() => {
    if (!data() || !start() || !end()) return;
    localStorage.setItem(
      FILTER_STATE_KEY,
      JSON.stringify({
        start: start(),
        end: end(),
        categories: [...selectedCategories()],
        countries: [...selectedCountries()],
      }),
    );
  });

  const activeBulletins = createMemo(() => {
    const loaded = data();
    if (!loaded) return [];
    const startKey = start();
    const endKey = end();
    const minKey = startKey <= endKey ? startKey : endKey;
    const maxKey = startKey <= endKey ? endKey : startKey;
    return loaded.bulletins.filter((bulletin) =>
      bulletin.key >= minKey && bulletin.key <= maxKey
    );
  });

  const filteredRows = createMemo(() => {
    const loaded = data();
    if (!loaded) return [];
    const selectedBulletinKeys = new Set(
      activeBulletins().map((bulletin) => bulletin.key),
    );
    return loaded.rows.filter((row) =>
      selectedCategories().has(row.category) &&
      selectedCountries().has(row.country) &&
      selectedBulletinKeys.has(row.bulletinKey)
    );
  });

  const seriesKeys = createMemo(() =>
    [
      ...new Set(filteredRows().map((row) => `${row.category}|${row.country}`)),
    ].sort()
  );

  const rangeText = createMemo(() => {
    const loaded = data();
    if (!loaded || loaded.bulletins.length === 0) return t("loading");
    return t("cachedRange", {
      start: localizedBulletinLabel(language(), loaded.bulletins[0]),
      end: localizedBulletinLabel(
        language(),
        loaded.bulletins[loaded.bulletins.length - 1],
      ),
      generated: new Date(loaded.manifest.generatedAt).toLocaleString(
        language() === "vi" ? "vi-VN" : undefined,
      ),
    });
  });

  const toggleCategory = (category: string, checked: boolean) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      checked ? next.add(category) : next.delete(category);
      return next;
    });
  };
  const toggleCountry = (
    country: typeof AREA_ORDER[number],
    checked: boolean,
  ) => {
    setSelectedCountries((current) => {
      const next = new Set(current);
      checked ? next.add(country) : next.delete(country);
      return next;
    });
  };

  return (
    <>
      <h1>{t("title")}</h1>
      <p class="note">{rangeText()}</p>
      <p class="note">{t("note")}</p>
      <Show when={data.error}>
        <section class="errors">
          <h2>{t("loadErrorTitle")}</h2>
          <p>{data.error?.message}</p>
          <p>{t("loadErrorHelp")}</p>
        </section>
      </Show>

      <Show when={data()} fallback={<p>{t("loading")}</p>}>
        {(loaded) => (
          <div class="layout">
            <main>
              <VisaChart
                activeBulletins={activeBulletins()}
                rows={filteredRows()}
                language={language()}
                t={t}
              />
              <h2>{t("filteredData")}</h2>
              <DataTable
                rows={filteredRows()}
                language={language()}
                t={t}
                bulletinLabel={bulletinLabel}
              />
            </main>
            <FilterPanel
              language={language()}
              setLanguage={setLanguage}
              bulletins={loaded().bulletins}
              start={start()}
              setStart={setStart}
              end={end()}
              setEnd={setEnd}
              categories={categories()}
              selectedCategories={selectedCategories()}
              setAllCategories={(checked) =>
                setSelectedCategories(new Set(checked ? categories() : []))}
              toggleCategory={toggleCategory}
              selectedCountries={selectedCountries()}
              setAllCountries={(checked) =>
                setSelectedCountries(new Set(checked ? AREA_ORDER : []))}
              toggleCountry={toggleCountry}
              rowsCount={filteredRows().length}
              linesCount={seriesKeys().length}
              t={t}
            />
          </div>
        )}
      </Show>
    </>
  );
}
