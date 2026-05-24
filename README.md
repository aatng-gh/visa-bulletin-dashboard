# Visa Bulletin Dashboard

Modern React + Vite dashboard for exploring USCIS Visa Bulletin data (2005–present).

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:8000/

See [PLAN.md](./PLAN.md) for architecture, data source details, full commands (`pnpm data`, `pnpm build`, etc.), and GitHub Pages deployment notes.

## Key Features

- Client-side filtering and Chart.js visualization
- 3-language support (English, Vietnamese, Haitian Creole)
- Persisted filter state
- Fully static export for GitHub Pages

## Data

Run `pnpm data` (or with `--start`/`--end`) to fetch/update the JSON cache from travel.state.gov.

## License

See repository for details.
