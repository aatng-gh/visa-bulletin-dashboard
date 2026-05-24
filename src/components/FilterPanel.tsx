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
          <div className="grid grid-cols-2 gap-2">
            {props.categories.map((category) => (
              <Label
                key={category}
                className="flex items-center gap-2 rounded-md border p-2 font-normal"
                data-value={category}
              >
                <Checkbox
                  checked={props.selectedCategories.has(category)}
                  onChange={(event) => props.toggleCategory(category, event.currentTarget.checked)}
                />
                {category}
              </Label>
            ))}
          </div>
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
