import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  AREA_ORDER,
  AREA_SHORT_LABELS,
  AreaKey,
  bulletinKey,
  DEFAULT_CATEGORY_TOOLTIPS,
  getCategoryDisplayName,
  Language,
  MONTH_LABELS,
  parseBulletinKey,
} from "../lib/visa";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Tooltip } from "./ui/tooltip";

interface FilterPanelProps {
  language: Language;
  start: string;
  setStart: Dispatch<SetStateAction<string>>;
  end: string;
  setEnd: Dispatch<SetStateAction<string>>;
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

const START_YEAR = 2005;

const YEAR_OPTIONS = (() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - START_YEAR + 1 }, (_, index) => START_YEAR + index);
})();

function FilterSection(props: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold tracking-tight">{props.title}</h3>
      {props.children}
    </section>
  );
}

interface CategoryCheckboxProps {
  category: string;
  tooltip: string;
  checked: boolean;
  onToggle: (category: string, checked: boolean) => void;
  tooltipId: string;
}

function CategoryCheckbox({ category, tooltip, checked, onToggle, tooltipId }: CategoryCheckboxProps) {
  return (
    <Label
      className="flex items-center gap-2 rounded-md border p-2 font-normal"
      data-value={category}
    >
      <Checkbox
        checked={checked}
        onChange={(event) => onToggle(category, event.currentTarget.checked)}
        aria-describedby={tooltipId}
      />
      <span className="flex-1 overflow-hidden text-ellipsis line-clamp-2 text-sm leading-tight">
        {getCategoryDisplayName(category)}
      </span>

      {/* Question mark icon as the dedicated hover target for the tooltip */}
      <Tooltip content={tooltip} id={tooltipId}>
        <span
          className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-help"
          aria-hidden="true"
          title={tooltip}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </span>
      </Tooltip>
    </Label>
  );
}

export function FilterPanel(props: FilterPanelProps) {
  const setRangePart = (which: "start" | "end", part: "month" | "year", value: number) => {
    const current = parseBulletinKey(which === "start" ? props.start : props.end);
    const next = bulletinKey({ ...current, [part]: value });
    if (which === "start") props.setStart(next);
    else props.setEnd(next);
  };

  const getTooltipKey = (category: string) =>
    `tooltip${category.replace(/[^A-Za-z0-9]/g, "")}`;

  const getCategoryTooltip = (category: string) => {
    const key = getTooltipKey(category);
    const translated = props.t(key);
    if (translated === key) {
      return DEFAULT_CATEGORY_TOOLTIPS[category] ?? category;
    }
    return translated;
  };

  const familyCategories = props.categories.filter((c) => /^F\d/i.test(c));
  const employmentCategories = props.categories.filter((c) => /^EB-/i.test(c));
  const otherCategories = props.categories.filter(
    (c) => !/^F\d/i.test(c) && !/^EB-/i.test(c)
  );

  const setGroupCategories = (cats: string[], checked: boolean) => {
    cats.forEach((cat) => props.toggleCategory(cat, checked));
  };

  const allCountriesSelected = AREA_ORDER.every((c) => props.selectedCountries.has(c));
  const noCountriesSelected = props.selectedCountries.size === 0;

  // Per-group selection states
  const allFamilySelected =
    familyCategories.length > 0 &&
    familyCategories.every((c) => props.selectedCategories.has(c));

  const allEmploymentSelected =
    employmentCategories.length > 0 &&
    employmentCategories.every((c) => props.selectedCategories.has(c));

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>{props.t("filters")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FilterSection title={props.t("monthRange")}>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{props.t("start")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={String(parseBulletinKey(props.start).month)}
                  onChange={(event) =>
                    setRangePart("start", "month", Number(event.currentTarget.value))
                  }
                >
                  {MONTH_LABELS[props.language].slice(1).map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={String(parseBulletinKey(props.start).year)}
                  onChange={(event) =>
                    setRangePart("start", "year", Number(event.currentTarget.value))
                  }
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{props.t("end")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={String(parseBulletinKey(props.end).month)}
                  onChange={(event) =>
                    setRangePart("end", "month", Number(event.currentTarget.value))
                  }
                >
                  {MONTH_LABELS[props.language].slice(1).map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={String(parseBulletinKey(props.end).year)}
                  onChange={(event) =>
                    setRangePart("end", "year", Number(event.currentTarget.value))
                  }
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </FilterSection>

        <FilterSection title={props.t("visaCategories")}>
          {/* Quick group toggles for Family and Employment */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={allFamilySelected ? "secondary" : "outline"}
              onClick={() => setGroupCategories(familyCategories, !allFamilySelected)}
            >
              {props.t("familySponsored")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={allEmploymentSelected ? "secondary" : "outline"}
              onClick={() => setGroupCategories(employmentCategories, !allEmploymentSelected)}
            >
              {props.t("employmentBased")}
            </Button>
          </div>

          {/* Family-sponsored group */}
          {familyCategories.length > 0 && (
            <div
              className="mt-3 space-y-2"
              role="group"
              aria-label={props.t("familySectionAria")}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
                  {props.t("familySponsored")}
                </span>
                <div className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {familyCategories.map((category) => {
                  const tooltip = getCategoryTooltip(category);
                  const tooltipId = `tooltip-${category.replace(/\s+/g, "-")}`;
                  return (
                    <CategoryCheckbox
                      key={category}
                      category={category}
                      tooltip={tooltip}
                      checked={props.selectedCategories.has(category)}
                      onToggle={props.toggleCategory}
                      tooltipId={tooltipId}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Employment-based group */}
          {employmentCategories.length > 0 && (
            <div
              className="mt-3 space-y-2"
              role="group"
              aria-label={props.t("employmentSectionAria")}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
                  {props.t("employmentBased")}
                </span>
                <div className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {employmentCategories.map((category) => {
                  const tooltip = getCategoryTooltip(category);
                  const tooltipId = `tooltip-${category.replace(/\s+/g, "-")}`;
                  return (
                    <CategoryCheckbox
                      key={category}
                      category={category}
                      tooltip={tooltip}
                      checked={props.selectedCategories.has(category)}
                      onToggle={props.toggleCategory}
                      tooltipId={tooltipId}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Other / future categories (graceful fallback) */}
          {otherCategories.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
                  {props.t("otherCategories")}
                </span>
                <div className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {otherCategories.map((category) => {
                  const tooltip = getCategoryTooltip(category);
                  const tooltipId = `tooltip-${category.replace(/\s+/g, "-")}`;
                  return (
                    <CategoryCheckbox
                      key={category}
                      category={category}
                      tooltip={tooltip}
                      checked={props.selectedCategories.has(category)}
                      onToggle={props.toggleCategory}
                      tooltipId={tooltipId}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </FilterSection>

        <FilterSection title={props.t("countries")}>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={allCountriesSelected ? "secondary" : "outline"}
              onClick={() => props.setAllCountries(true)}
            >
              {props.t("all")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={noCountriesSelected ? "secondary" : "outline"}
              onClick={() => props.setAllCountries(false)}
            >
              {props.t("none")}
            </Button>
          </div>
          <div className="grid gap-2">
            {AREA_ORDER.map((country) => (
              <Label
                key={country}
                className="flex items-center gap-2 rounded-md border p-2 font-normal"
                data-value={country}
              >
                <Checkbox
                  checked={props.selectedCountries.has(country)}
                  onChange={(event) => props.toggleCountry(country, event.currentTarget.checked)}
                />
                {AREA_SHORT_LABELS[props.language][country]}
              </Label>
            ))}
          </div>
        </FilterSection>

        <p className="text-sm text-muted-foreground">
          {props.t("rowsSelected", {
            rows: String(props.rowsCount),
            lines: String(props.linesCount),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
