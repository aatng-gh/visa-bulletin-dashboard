# Visa Bulletin Dashboard Plan

## Architecture

This project is a **build-time scraper + statically built React dashboard**.

- The data task generates parsed JSON data files locally or in CI.
- The dashboard source lives under `src/` and is bundled by Vite.
- The built dashboard is served by GitHub Pages as static files.
- The dashboard loads JSON files in the browser and filters/charts them client-side.
- The dashboard is not rebuilt to change filters or date ranges.

## File Naming

- React component files use `PascalCase.tsx` under `src/components/`.
- shadcn-style primitive files use `kebab/lowercase.tsx` under `src/components/ui/`.
- Utility/domain modules use lowercase names under `src/lib/`.
- Locale modules use BCP-47-ish language codes under `src/locales/`.
- Node scripts live in `scripts/` and use kebab-case filenames.
- Cached bulletin files use `data/YYYY-MM.json`.

## UI Components

The dashboard uses a small set of lightweight, shadcn-inspired primitives under
`src/components/ui/`. These are intentionally minimal wrappers around native
elements (using `cn()` for class merging and `class-variance-authority` only
where variants are needed). They are **not** full shadcn/ui ports.

## Data Range

Default fetch range:

- start: `2005-01`
- end: current month

Adjustable fetch range:

```bash
nub run data -- --start 2025-01 --end 2026-06
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

- Use cached local JSON when available.
- Query the website only when a month is missing from `data/`.
- Store parsed data, not raw HTML.
- Data task logs are JSON structured logs.

## Commands

```bash
nub install
nub run dev
nub run data
nub run data -- --start 2025-06 --end 2026-06
nub run check
nub run build
nub run preview
```

`nub run data` fetches missing data through Nub's TypeScript file runner.
`nub run build` only builds the Vite/React dashboard to `dist/`.

## GitHub Pages

Serve the generated Pages artifact. Main built page:

```text
dist/index.html
```

For local development, run:

```bash
nub run dev
```

Then open:

```text
http://localhost:8000/
```

The Vite dev server serves the app and local cached data files. The page loads:

```text
data/manifest.json
data/{YYYY-MM}.json
```

## Dashboard Features

- Chart and data table on the left
- Filter panel on the right
- Dynamic language dropdown with flags
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

It installs with Nub, restores a data cache, runs checks, fetches missing data, builds the React
dashboard, creates a Pages artifact containing `dist/` and generated
`data/*.json`, then deploys to GitHub Pages. It does not commit generated data
to the repo.
