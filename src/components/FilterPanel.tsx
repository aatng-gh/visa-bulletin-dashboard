import { For, Setter } from "solid-js";
import {
  AREA_ORDER,
  AREA_SHORT_LABELS,
  AreaKey,
  Language,
  localizedBulletinLabel,
  ManifestMonth,
} from "../lib/visa.ts";

interface FilterPanelProps {
  language: Language;
  setLanguage: Setter<Language>;
  bulletins: ManifestMonth[];
  start: string;
  setStart: Setter<string>;
  end: string;
  setEnd: Setter<string>;
  categories: string[];
  selectedCategories: Set<string>;
  setAllCategories: (checked: boolean) => void;
  toggleCategory: (category: string, checked: boolean) => void;
  selectedCountries: Set<string>;
  setAllCountries: (checked: boolean) => void;
  toggleCountry: (country: AreaKey, checked: boolean) => void;
  rowsCount: number;
  linesCount: number;
  t: (key: string, params?: Record<string, string>) => string;
}

export function FilterPanel(props: FilterPanelProps) {
  return (
    <aside class="filters">
      <fieldset>
        <legend>{props.t("language")}</legend>
        <label>
          <span>{props.t("languageLabel")}</span>{" "}
          <select
            value={props.language}
            onChange={(event) =>
              props.setLanguage(event.currentTarget.value as Language)}
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>{props.t("monthRange")}</legend>
        <label>
          <span>{props.t("start")}</span>{" "}
          <select
            value={props.start}
            onChange={(event) => props.setStart(event.currentTarget.value)}
          >
            <For each={props.bulletins}>
              {(bulletin) => (
                <option value={bulletin.key}>
                  {localizedBulletinLabel(props.language, bulletin)}
                </option>
              )}
            </For>
          </select>
        </label>
        <label>
          <span>{props.t("end")}</span>{" "}
          <select
            value={props.end}
            onChange={(event) => props.setEnd(event.currentTarget.value)}
          >
            <For each={props.bulletins}>
              {(bulletin) => (
                <option value={bulletin.key}>
                  {localizedBulletinLabel(props.language, bulletin)}
                </option>
              )}
            </For>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>{props.t("visaCategories")}</legend>
        <button type="button" onClick={() => props.setAllCategories(true)}>
          {props.t("all")}
        </button>
        <button type="button" onClick={() => props.setAllCategories(false)}>
          {props.t("none")}
        </button>
        <For each={props.categories}>
          {(category) => (
            <label data-value={category}>
              <input
                type="checkbox"
                checked={props.selectedCategories.has(category)}
                onChange={(event) =>
                  props.toggleCategory(category, event.currentTarget.checked)}
              />{" "}
              {category}
            </label>
          )}
        </For>
      </fieldset>

      <fieldset>
        <legend>{props.t("countries")}</legend>
        <button type="button" onClick={() => props.setAllCountries(true)}>
          {props.t("all")}
        </button>
        <button type="button" onClick={() => props.setAllCountries(false)}>
          {props.t("none")}
        </button>
        <For each={AREA_ORDER}>
          {(country) => (
            <label data-value={country}>
              <input
                type="checkbox"
                checked={props.selectedCountries.has(country)}
                onChange={(event) =>
                  props.toggleCountry(country, event.currentTarget.checked)}
              />{" "}
              {AREA_SHORT_LABELS[props.language][country]}
            </label>
          )}
        </For>
      </fieldset>
      <p class="count">
        {props.t("rowsSelected", {
          rows: String(props.rowsCount),
          lines: String(props.linesCount),
        })}
      </p>
    </aside>
  );
}
