import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  AREA_ORDER,
  AREA_SHORT_LABELS,
  AreaKey,
  bulletinKey,
  DEFAULT_CATEGORY_TOOLTIPS,
  getCategoryDisplayName,
  Language,
  ManifestMonth,
  MONTH_LABELS,
  parseBulletinKey,
  tryParseBulletinKey,
} from "../lib/visa";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Tooltip } from "./ui/tooltip";

interface FilterPanelProps {
  className?: string;
  language: Language;
  start: string;
  setStart: Dispatch<SetStateAction<string>>;
  end: string;
  setEnd: Dispatch<SetStateAction<string>>;
  availableBulletins: ManifestMonth[];
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
  checkboxId: string;
}

function CategoryCheckbox({
  category,
  tooltip,
  checked,
  onToggle,
  tooltipId,
  checkboxId,
}: CategoryCheckboxProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2" data-value={category}>
      <Checkbox
        id={checkboxId}
        name="categories"
        checked={checked}
        onChange={(event) => onToggle(category, event.currentTarget.checked)}
        aria-describedby={tooltipId}
      />
      <Label
        htmlFor={checkboxId}
        className="flex-1 overflow-hidden text-ellipsis line-clamp-2 text-sm font-normal leading-tight"
      >
        {getCategoryDisplayName(category)}
      </Label>

      <Tooltip content={tooltip} id={tooltipId}>
        <button
          type="button"
          className="ml-1 flex h-5 w-5 flex-shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={tooltip}
          aria-describedby={tooltipId}
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
        </button>
      </Tooltip>
    </div>
  );
}

export function FilterPanel(props: FilterPanelProps) {
  const availableKeys = new Set(props.availableBulletins.map((bulletin) => bulletin.key));
  const yearOptions = [
    ...new Set(props.availableBulletins.map((bulletin) => parseBulletinKey(bulletin.key).year)),
  ];
  const startDate =
    tryParseBulletinKey(props.start) ?? parseBulletinKey(props.availableBulletins[0].key);
  const endDate =
    tryParseBulletinKey(props.end) ??
    parseBulletinKey(props.availableBulletins[props.availableBulletins.length - 1].key);

  const monthOptionsForYear = (year: number) =>
    props.availableBulletins
      .map((bulletin) => parseBulletinKey(bulletin.key))
      .filter((monthYear) => monthYear.year === year)
      .map((monthYear) => monthYear.month);

  const closestKeyForYear = (year: number, preferredMonth: number) => {
    const months = monthOptionsForYear(year);
    const month = months.includes(preferredMonth) ? preferredMonth : months[0];
    return bulletinKey({ month, year });
  };

  const setRangePart = (which: "start" | "end", part: "month" | "year", value: number) => {
    const current = which === "start" ? startDate : endDate;
    const next =
      part === "year"
        ? closestKeyForYear(value, current.month)
        : bulletinKey({ ...current, month: value });
    if (!availableKeys.has(next)) return;
    if (which === "start") props.setStart(next);
    else props.setEnd(next);
  };

  const getTooltipKey = (category: string) => `tooltip${category.replace(/[^A-Za-z0-9]/g, "")}`;

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
  const otherCategories = props.categories.filter((c) => !/^F\d/i.test(c) && !/^EB-/i.test(c));

  const setGroupCategories = (cats: string[], checked: boolean) => {
    cats.forEach((cat) => props.toggleCategory(cat, checked));
  };

  const allCountriesSelected = AREA_ORDER.every((c) => props.selectedCountries.has(c));
  const noCountriesSelected = props.selectedCountries.size === 0;

  // Per-group selection states
  const allFamilySelected =
    familyCategories.length > 0 && familyCategories.every((c) => props.selectedCategories.has(c));

  const allEmploymentSelected =
    employmentCategories.length > 0 &&
    employmentCategories.every((c) => props.selectedCategories.has(c));

  return (
    <Card className={props.className}>
      <CardHeader>
        <CardTitle>{props.t("filters")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FilterSection title={props.t("monthRange")}>
          <div className="grid gap-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">{props.t("start")}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="sr-only" htmlFor="start-month">
                    {props.t("startMonth")}
                  </Label>
                  <Select
                    id="start-month"
                    name="startMonth"
                    value={String(startDate.month)}
                    aria-label={props.t("startMonth")}
                    onChange={(event) =>
                      setRangePart("start", "month", Number(event.currentTarget.value))
                    }
                  >
                    {monthOptionsForYear(startDate.year).map((month) => (
                      <option key={month} value={month}>
                        {MONTH_LABELS[props.language][month]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="sr-only" htmlFor="start-year">
                    {props.t("startYear")}
                  </Label>
                  <Select
                    id="start-year"
                    name="startYear"
                    value={String(startDate.year)}
                    aria-label={props.t("startYear")}
                    onChange={(event) =>
                      setRangePart("start", "year", Number(event.currentTarget.value))
                    }
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">{props.t("end")}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="sr-only" htmlFor="end-month">
                    {props.t("endMonth")}
                  </Label>
                  <Select
                    id="end-month"
                    name="endMonth"
                    value={String(endDate.month)}
                    aria-label={props.t("endMonth")}
                    onChange={(event) =>
                      setRangePart("end", "month", Number(event.currentTarget.value))
                    }
                  >
                    {monthOptionsForYear(endDate.year).map((month) => (
                      <option key={month} value={month}>
                        {MONTH_LABELS[props.language][month]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="sr-only" htmlFor="end-year">
                    {props.t("endYear")}
                  </Label>
                  <Select
                    id="end-year"
                    name="endYear"
                    value={String(endDate.year)}
                    aria-label={props.t("endYear")}
                    onChange={(event) =>
                      setRangePart("end", "year", Number(event.currentTarget.value))
                    }
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </div>
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
            <div className="mt-3 space-y-2" role="group" aria-label={props.t("familySectionAria")}>
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
                  const checkboxId = `category-${category.replace(/[^A-Za-z0-9]/g, "-")}`;
                  return (
                    <CategoryCheckbox
                      key={category}
                      category={category}
                      tooltip={tooltip}
                      checked={props.selectedCategories.has(category)}
                      onToggle={props.toggleCategory}
                      tooltipId={tooltipId}
                      checkboxId={checkboxId}
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
                  const checkboxId = `category-${category.replace(/[^A-Za-z0-9]/g, "-")}`;
                  return (
                    <CategoryCheckbox
                      key={category}
                      category={category}
                      tooltip={tooltip}
                      checked={props.selectedCategories.has(category)}
                      onToggle={props.toggleCategory}
                      tooltipId={tooltipId}
                      checkboxId={checkboxId}
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
                  const checkboxId = `category-${category.replace(/[^A-Za-z0-9]/g, "-")}`;
                  return (
                    <CategoryCheckbox
                      key={category}
                      category={category}
                      tooltip={tooltip}
                      checked={props.selectedCategories.has(category)}
                      onToggle={props.toggleCategory}
                      tooltipId={tooltipId}
                      checkboxId={checkboxId}
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
                htmlFor={`country-${country}`}
                className="flex items-center gap-2 rounded-md border p-2 font-normal"
                data-value={country}
              >
                <Checkbox
                  id={`country-${country}`}
                  name="countries"
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
