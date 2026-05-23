# USCIS Tracker Plan

## Architecture

This project is a **build-time scraper + static client-side dashboard**.

- The fetch task generates parsed JSON data files locally or in CI.
- The dashboard is a static `index.html` shell served by GitHub Pages.
- The dashboard loads JSON files in the browser and filters/charts them
  client-side.
- The dashboard is not rebuilt to change filters or date ranges.

## Data Range

Default fetch range:

- start: `2025-01`
- end: current month

Adjustable fetch range:

```bash
deno task fetch -- --start 2025-01 --end 2026-06
```

Dates use `YYYY-MM`.

## Data Source

Monthly Visa Bulletin pages come from the U.S. Department of State. The path
directory is the **fiscal year**, while the filename uses the bulletin's
calendar month/year:

```text
https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/{FISCAL_YEAR}/visa-bulletin-for-{MONTH}-{CALENDAR_YEAR}.html
```

Fiscal-year rule:

- October through December use `calendar year + 1`.
- January through September use the calendar year.

## Data Files

Generated data files:

```text
data/{YYYY-MM}.json
data/manifest.json
```

Rules:

- Generated data files are ignored on the main branch.
- GitHub Actions generates them during Pages deployment.
- Use cached local JSON when available.
- Query the website only when a month is missing from data.
- Store parsed data, not raw HTML.

## Commands

```bash
deno task fetch
deno task fetch -- --start 2025-06 --end 2026-06
deno task serve
deno task check
deno task lint
```

`deno task build` is an alias for `fetch`.

## GitHub Pages

Serve from repo root. Main page:

```text
index.html
```

For local development, run:

```bash
deno task serve
```

Then open:

```text
http://localhost:8000/
```

The page loads:

```text
data/manifest.json
data/{YYYY-MM}.json
```

## Dashboard Features

- Chart and data table on the left
- Filter panel on the right
- English/Vietnamese language switcher
- Persisted filter panel state via browser local storage
- Dynamic month-year start/end selectors
- Visa category checkboxes
- Country/chargeability checkboxes
- Chart.js line chart
- Filtered data table

Default chart selection:

- `F2B` selected
- All countries selected
- Full cached month range selected

## Visa Categories

Extract family-sponsored and employment-based final action date rows, including:

- Family: `F1`, `F2A`, `F2B`, `F3`, `F4`
- Employment: `EB-1`, `EB-2`, `EB-3`, `EB-3 Other Workers`, `EB-4`,
  `EB-4 Certain Religious Workers`, and EB-5 subcategories

## Countries / Chargeability Areas

Capture:

- All Chargeability Areas Except Those Listed
- China-mainland born
- India
- Mexico
- Philippines

## GitHub Actions

Monthly workflow:

```text
.github/workflows/monthly-build.yml
```

It runs check, lint, fetches missing data, builds a Pages artifact containing
`index.html` and generated `data/*.json`, then deploys to GitHub Pages. It does
not commit generated data to the repo.
