import Chart from "chart.js/auto";
import { useEffect, useMemo, useRef } from "react";
import {
  AREA_SHORT_LABELS,
  Language,
  localizedBulletinShortLabel,
  ManifestMonth,
  ordinalToIso,
  VisaRow,
} from "../lib/visa";

const colors = [
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#dc2626",
  "#ea580c",
  "#0891b2",
  "#4f46e5",
  "#be123c",
  "#0f766e",
  "#a16207",
  "#7c3aed",
  "#15803d",
];

const LEGEND_SERIES_LIMIT = 12;

function colorForIndex(index: number): string {
  return colors[index] ?? `hsl(${(index * 137.508) % 360} 70% 42%)`;
}

interface VisaChartProps {
  activeBulletins: ManifestMonth[];
  rows: VisaRow[];
  language: Language;
  t: (key: string, params?: Record<string, string>) => string;
}

export function VisaChart({ activeBulletins, rows, language, t }: VisaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"line", (number | null)[], string> | null>(null);
  const rowsWithDateCutoffs = useMemo(
    () => rows.filter((row) => row.cutoff.ordinal !== null),
    [rows]
  );
  const hasDateCutoffs = rowsWithDateCutoffs.length > 0;

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
          legend: {
            position: "bottom",
            labels: {
              boxHeight: 10,
              boxWidth: 18,
              usePointStyle: true,
            },
          },
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
    const seriesKeys = [
      ...new Set(rowsWithDateCutoffs.map((row) => `${row.category}|${row.country}`)),
    ].sort();
    chart.data.labels = activeBulletins.map((bulletin) =>
      localizedBulletinShortLabel(language, bulletin)
    );
    chart.data.datasets = seriesKeys.map((seriesKey, index) => {
      const [category, country] = seriesKey.split("|");
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
        borderColor: colorForIndex(index),
        backgroundColor: colorForIndex(index),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        spanGaps: true,
        tension: 0.15,
      };
    });
    if (chart.options.plugins?.legend) {
      chart.options.plugins.legend.display = seriesKeys.length <= LEGEND_SERIES_LIMIT;
    }
    if (chart.options.plugins?.title) {
      chart.options.plugins.title.text = t("chartTitle");
    }
    if (chart.options.scales?.y?.title) {
      chart.options.scales.y.title.text = t("yAxis");
    }
    if (chart.options.scales?.x?.title) {
      chart.options.scales.x.title.text = t("xAxis");
    }
    chart.update();
  }, [activeBulletins, language, rowsWithDateCutoffs, t]);

  return (
    <div className="relative h-[560px] rounded-xl border bg-card p-4 shadow">
      <canvas ref={canvasRef} className={hasDateCutoffs ? undefined : "hidden"} />
      {!hasDateCutoffs && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? t("noDataSelected") : t("noChartData")}
        </div>
      )}
    </div>
  );
}
