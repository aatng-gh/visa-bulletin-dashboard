import Chart from "chart.js/auto";
import { useEffect, useMemo, useRef } from "react";
import {
  AREA_ORDER,
  AREA_SHORT_LABELS,
  Language,
  localizedBulletinShortLabel,
  ManifestMonth,
  ordinalToIso,
  VisaRow,
} from "../lib/visa";
import { isDarkMode, type ThemeMode } from "../lib/theme";

const countryColors: Record<string, string> = {
  all_chargeability: "#2563eb",
  china: "#16a34a",
  india: "#dc2626",
  mexico: "#9333ea",
  philippines: "#ea580c",
};

const dashPatterns = [[], [6, 4], [2, 4], [8, 3, 2, 3], [12, 4]] as const;

function colorForCountry(country: string): string {
  return countryColors[country] ?? "#4f46e5";
}

function dashForIndex(index: number): number[] {
  return [...dashPatterns[index % dashPatterns.length]];
}

function splitSeriesKey(seriesKey: string) {
  const [category, country] = seriesKey.split("|");
  return { category, country };
}

interface VisaChartProps {
  activeBulletins: ManifestMonth[];
  rows: VisaRow[];
  language: Language;
  themeMode: ThemeMode;
  t: (key: string, params?: Record<string, string>) => string;
}

export function VisaChart({ activeBulletins, rows, language, themeMode, t }: VisaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"line", (number | null)[], string> | null>(null);
  const rowsWithDateCutoffs = useMemo(
    () => rows.filter((row) => row.cutoff.ordinal !== null),
    [rows]
  );
  const hasDateCutoffs = rowsWithDateCutoffs.length > 0;
  const nonDateRows = rows.length - rowsWithDateCutoffs.length;
  const seriesKeys = useMemo(
    () => [...new Set(rows.map((row) => `${row.category}|${row.country}`))].sort(),
    [rows]
  );
  const pointRadius = activeBulletins.length <= 24 ? 2 : 0;

  useEffect(() => {
    if (!canvasRef.current || chartRef.current) return;
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 4, right: 8, bottom: 4, left: 8 } },
        plugins: {
          title: { display: true, text: "" },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ordinalToIso(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            grid: { color: "rgba(148, 163, 184, 0.25)" },
            ticks: {
              callback: (value) => ordinalToIso(Number(value)),
              maxTicksLimit: 8,
            },
            title: { display: true, text: "" },
          },
          x: {
            grid: { color: "rgba(148, 163, 184, 0.18)" },
            ticks: {
              autoSkip: true,
              maxRotation: 0,
              maxTicksLimit: 12,
            },
            title: { display: true, text: "" },
          },
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = activeBulletins.map((bulletin) =>
      localizedBulletinShortLabel(language, bulletin)
    );
    chart.data.datasets = seriesKeys.map((seriesKey, index) => {
      const { category, country } = splitSeriesKey(seriesKey);
      const pointsByBulletin = new Map(
        rowsWithDateCutoffs
          .filter((row) => row.category === category && row.country === country)
          .map((row) => [row.bulletinKey, row.cutoff.ordinal])
      );
      return {
        label: `${category} / ${
          AREA_SHORT_LABELS[language][country as keyof typeof AREA_SHORT_LABELS.en] ?? country
        }`,
        data: activeBulletins.map((bulletin) => pointsByBulletin.get(bulletin.key) ?? null),
        borderColor: colorForCountry(country),
        backgroundColor: colorForCountry(country),
        borderDash: dashForIndex(index),
        borderWidth: 2,
        pointRadius,
        pointHoverRadius: 4,
        spanGaps: false,
        stepped: true,
        tension: 0,
      };
    });
    if (chart.options.plugins?.title) {
      chart.options.plugins.title.text = t("chartTitle");
    }
    if (chart.options.scales?.y?.title) {
      chart.options.scales.y.title.text = t("yAxis");
    }
    if (chart.options.scales?.x?.title) {
      chart.options.scales.x.title.text = t("xAxis");
    }
    // Theme-aware grid lines + text colors for polished dark mode on canvas
    const isDark = isDarkMode(themeMode);
    const yGridColor = isDark ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.25)";
    const xGridColor = isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(148, 163, 184, 0.18)";
    if (chart.options.scales?.y?.grid) {
      chart.options.scales.y.grid.color = yGridColor;
    }
    if (chart.options.scales?.x?.grid) {
      chart.options.scales.x.grid.color = xGridColor;
    }

    const textColor = isDark ? "#e2e8f0" : "#334155";
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = textColor;
    }
    if (chart.options.plugins?.title) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart.options.plugins.title as any).color = textColor;
    }
    if (chart.options.scales?.y?.ticks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart.options.scales.y.ticks as any).color = textColor;
    }
    if (chart.options.scales?.y?.title) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart.options.scales.y.title as any).color = textColor;
    }
    if (chart.options.scales?.x?.ticks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart.options.scales.x.ticks as any).color = textColor;
    }
    if (chart.options.scales?.x?.title) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart.options.scales.x.title as any).color = textColor;
    }

    // Theme the tooltip for better dark mode experience
    if (chart.options.plugins?.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = isDark
        ? "rgba(30, 41, 59, 0.95)"
        : "rgba(255, 255, 255, 0.95)";
      chart.options.plugins.tooltip.titleColor = textColor;
      chart.options.plugins.tooltip.bodyColor = textColor;
      chart.options.plugins.tooltip.borderColor = isDark
        ? "rgba(148, 163, 184, 0.25)"
        : "rgba(148, 163, 184, 0.35)";
    }

    chart.update();
  }, [activeBulletins, language, pointRadius, rowsWithDateCutoffs, seriesKeys, t, themeMode]);

  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow">
      <div className="relative h-[520px]">
        <canvas
          ref={canvasRef}
          className={hasDateCutoffs ? "h-full w-full max-w-full" : "hidden"}
          aria-label={t("chartAriaLabel")}
        />
        {!hasDateCutoffs && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? t("noDataSelected") : t("noChartData")}
          </div>
        )}
      </div>
      {nonDateRows > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("chartNonDateNote", { rows: String(nonDateRows) })}
        </p>
      )}
      {seriesKeys.length > 0 && (
        <div className="mt-4 max-h-28 overflow-auto border-t pt-3" aria-label={t("chartLegend")}>
          <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
            {seriesKeys.map((seriesKey, index) => {
              const { category, country } = splitSeriesKey(seriesKey);
              const label = `${category} / ${
                AREA_SHORT_LABELS[language][country as (typeof AREA_ORDER)[number]] ?? country
              }`;
              return (
                <div key={seriesKey} className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-0 w-8 flex-shrink-0 border-t-2"
                    style={{
                      borderColor: colorForCountry(country),
                      borderStyle: dashForIndex(index).length > 0 ? "dashed" : "solid",
                    }}
                  />
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
