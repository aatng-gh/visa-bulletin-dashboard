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
nub install
nub run dev
```

Open http://localhost:8000/

## Available Scripts

| Command                                         | Description                          |
| ----------------------------------------------- | ------------------------------------ |
| `nub run dev`                                   | Start Vite dev server                |
| `nub run build`                                 | Build for production (`dist/`)       |
| `nub run preview`                               | Preview production build             |
| `nub run data`                                  | Fetch/update visa bulletin JSON data |
| `nub run data -- --start 2025-01 --end 2025-06` | Fetch specific date range            |
| `nub run check`                                 | Type check + lint                    |
| `nub run format`                                | Format with Prettier                 |

> **Note:** Install Nub from https://nubjs.com/ before running these commands.

## Data

The dashboard consumes pre-generated JSON files located in `data/`.

Run `nub run data` (or with `--start` / `--end`) to fetch the latest bulletins from the U.S. Department of State.

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
