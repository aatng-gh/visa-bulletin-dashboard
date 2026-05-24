# Visa Bulletin Dashboard

A modern, statically built React dashboard for exploring U.S. Visa Bulletin data (2005–present).

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue)](https://aatng-gh.github.io/visa-bulletin-dashboard/)

## Features

- Client-side filtering, sorting, and Chart.js visualization
- Full 3-language support (English, Vietnamese, Haitian Creole)
- Persisted filter state in localStorage
- Dynamic month/year range selection
- Fully static export suitable for GitHub Pages

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:8000/

## Available Scripts

| Command              | Description |
|----------------------|-------------|
| `pnpm dev`           | Start Vite dev server |
| `pnpm build`         | Build for production (`dist/`) |
| `pnpm preview`       | Preview production build |
| `pnpm data`          | Fetch/update visa bulletin JSON data |
| `pnpm data -- --start 2025-01 --end 2025-06` | Fetch specific date range |
| `pnpm check`         | Type check + lint |
| `pnpm format`        | Format with Prettier |

> **Note:** `pnpm data` requires Node.js >= 26 (uses native TypeScript support).

## Data

The dashboard consumes pre-generated JSON files located in `data/`.

Run `pnpm data` (or with `--start` / `--end`) to fetch the latest bulletins from the U.S. Department of State.

See [PLAN.md](./PLAN.md) for:
- Detailed architecture
- Data source & fiscal year rules
- File naming conventions
- GitHub Actions monthly build process
- Full data fetching behavior

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **Charts**: Chart.js
- **Data Fetching**: Custom Node script with retries, concurrency control, and structured logging
- **Deployment**: GitHub Pages (static export)

## License

See the repository for details.