import Chart from "chart.js/auto";
import { createEffect, onCleanup } from "solid-js";
import {
  AREA_SHORT_LABELS,
  Language,
  localizedBulletinLabel,
  ManifestMonth,
  ordinalToIso,
  VisaRow,
} from "../lib/visa.ts";

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

interface VisaChartProps {
  activeBulletins: ManifestMonth[];
  rows: VisaRow[];
  language: Language;
  t: (key: string, params?: Record<string, string>) => string;
}

export function VisaChart(props: VisaChartProps) {
  let canvas!: HTMLCanvasElement;
  let chart: Chart<"line", (number | null)[], string> | undefined;

  createEffect(() => {
    if (!canvas || chart) return;
    chart = new Chart(canvas, {
      type: "line",
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          title: { display: true, text: props.t("chartTitle") },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${ordinalToIso(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: (value) => ordinalToIso(Number(value)) },
            title: { display: true, text: props.t("yAxis") },
          },
          x: { title: { display: true, text: props.t("xAxis") } },
        },
      },
    });
  });

  createEffect(() => {
    if (!chart) return;
    const seriesKeys = [
      ...new Set(props.rows.map((row) => `${row.category}|${row.country}`)),
    ].sort();
    chart.data.labels = props.activeBulletins.map((bulletin) =>
      localizedBulletinLabel(props.language, bulletin)
    );
    chart.data.datasets = seriesKeys.map((seriesKey, index) => {
      const [category, country] = seriesKey.split("|");
      const pointsByBulletin = new Map(
        props.rows
          .filter((row) => row.category === category && row.country === country)
          .map((row) => [row.bulletinKey, row.cutoff.ordinal]),
      );
      return {
        label: `${category} / ${
          AREA_SHORT_LABELS[props.language][
            country as keyof typeof AREA_SHORT_LABELS.en
          ] ?? country
        }`,
        data: props.activeBulletins.map((bulletin) =>
          pointsByBulletin.get(bulletin.key) ?? null
        ),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        spanGaps: true,
        tension: 0.15,
      };
    });
    if (chart.options.plugins?.title) {
      chart.options.plugins.title.text = props.t("chartTitle");
    }
    if (chart.options.scales?.y?.title) {
      chart.options.scales.y.title.text = props.t("yAxis");
    }
    if (chart.options.scales?.x?.title) {
      chart.options.scales.x.title.text = props.t("xAxis");
    }
    chart.update();
  });

  onCleanup(() => chart?.destroy());

  return (
    <div class="chart-wrap">
      <canvas ref={canvas}></canvas>
    </div>
  );
}
