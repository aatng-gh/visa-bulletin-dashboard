import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  AREA_ORDER,
  AREA_SHORT_LABELS,
  AreaKey,
  bulletinKey,
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

export function FilterPanel(props: FilterPanelProps) {
  const setRangePart = (which: "start" | "end", part: "month" | "year", value: number) => {
    const current = parseBulletinKey(which === "start" ? props.start : props.end);
    const next = bulletinKey({ ...current, [part]: value });
    if (which === "start") props.setStart(next);
    else props.setEnd(next);
  };

  // English fallbacks for category tooltips (used if no i18n entry yet).
  // All strings are also provided via t() in the three locale files.
  const DEFAULT_TOOLTIPS: Record<string, string> = {
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
    "EB-5 Set Aside High Unemployment": "EB-5 High Unemployment: Set-aside for targeted high-unemp. areas",
    "EB-5 Set Aside Infrastructure": "EB-5 Infrastructure: Set-aside for infrastructure projects",
  };

  const getTooltipKey = (category: string) =>
    `tooltip${category.replace(/[^A-Za-z0-9]/g, "")}`;

  const getCategoryTooltip = (category: string) => {
    const key = getTooltipKey(category);
    const translated = props.t(key);
    if (translated === key) {
      return DEFAULT_TOOLTIPS[category] ?? category;
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
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => props.setAllCategories(true)}
            >
              {props.t("all")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => props.setAllCategories(false)}
            >
              {props.t("none")}
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
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 rounded px-1.5 text-[10px] font-medium"
                  aria-label={props.t("allFamily")}
                  onClick={() => setGroupCategories(familyCategories, true)}
                >
                  {props.t("all")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 rounded px-1.5 text-[10px] font-medium"
                  aria-label={props.t("noneFamily")}
                  onClick={() => setGroupCategories(familyCategories, false)}
                >
                  {props.t("none")}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {familyCategories.map((category) => {
                  const tooltip = getCategoryTooltip(category);
                  return (
                    <Tooltip key={category} content={tooltip}>
                      <Label
                        className="flex items-center gap-2 rounded-md border p-2 font-normal"
                        data-value={category}
                        title={tooltip}
                      >
                        <Checkbox
                          checked={props.selectedCategories.has(category)}
                          onChange={(event) =>
                            props.toggleCategory(category, event.currentTarget.checked)
                          }
                        />
                        {category}
                      </Label>
                    </Tooltip>
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
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 rounded px-1.5 text-[10px] font-medium"
                  aria-label={props.t("allEmployment")}
                  onClick={() => setGroupCategories(employmentCategories, true)}
                >
                  {props.t("all")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 rounded px-1.5 text-[10px] font-medium"
                  aria-label={props.t("noneEmployment")}
                  onClick={() => setGroupCategories(employmentCategories, false)}
                >
                  {props.t("none")}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {employmentCategories.map((category) => {
                  const tooltip = getCategoryTooltip(category);
                  return (
                    <Tooltip key={category} content={tooltip}>
                      <Label
                        className="flex items-center gap-2 rounded-md border p-2 font-normal"
                        data-value={category}
                        title={tooltip}
                      >
                        <Checkbox
                          checked={props.selectedCategories.has(category)}
                          onChange={(event) =>
                            props.toggleCategory(category, event.currentTarget.checked)
                          }
                        />
                        {category}
                      </Label>
                    </Tooltip>
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
                  return (
                    <Tooltip key={category} content={tooltip}>
                      <Label
                        className="flex items-center gap-2 rounded-md border p-2 font-normal"
                        data-value={category}
                        title={tooltip}
                      >
                        <Checkbox
                          checked={props.selectedCategories.has(category)}
                          onChange={(event) =>
                            props.toggleCategory(category, event.currentTarget.checked)
                          }
                        />
                        {category}
                      </Label>
                    </Tooltip>
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
              variant="secondary"
              onClick={() => props.setAllCountries(true)}
            >
              {props.t("all")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
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
