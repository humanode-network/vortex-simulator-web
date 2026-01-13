# Vortex Experimental Mockups

This repo ships:

1. A React UI mockup of Vortex (Humanode governance hub)
2. An off-chain “simulation backend” served from `/api/*` (API handlers)

Humanode mainnet is used only as a read-only eligibility gate; all simulated governance state lives off-chain.

## Stack

- React with React Router
- Rsbuild
- Tailwind v4 (via PostCSS) + token-driven CSS (`src/styles/base.css`)
- Yarn (Node version: `.node-version`)
<<<<<<< HEAD
- API handlers in `functions/` + Postgres via Drizzle
=======
<<<<<<< Updated upstream
- Pages Functions API in `functions/` + Postgres via Drizzle
=======
- API handlers in `api/` + Postgres via Drizzle
>>>>>>> Stashed changes
>>>>>>> 5e32f02 (Eliminated functions (getting ready for migration))

## Getting Started

```bash
corepack enable
yarn install
yarn dev
```

Dev server: http://localhost:3000

Landing: http://localhost:3000/
App: http://localhost:3000/app

## Simulation API (local)

The UI reads from `/api/*` (API handlers). For local dev, run the API locally so the UI can reach it:

- One command: `yarn dev:full` (API on `:8788` + UI on `:3000` + `/api/*` proxy)
- Two terminals:
  - Terminal 1: `yarn dev:api`
  - Terminal 2: `yarn dev`

If only `yarn dev` runs, `/api/*` is not available and auth/gating/read pages will show an “API is not available” error.

### Production note (Pages env)

In production, API handlers use runtime env vars. If `DATABASE_URL` is not configured, the API falls back to an **ephemeral in-memory mode** (useful for quick demos, not durable). For a persistent public demo, set `DATABASE_URL` and run `yarn db:migrate` against that database.

### Backend docs

- Start here: `docs/README.md`
- Docs are grouped in: `docs/simulation/`, `docs/ops/`, `docs/paper/`
- Module map (paper → docs → code): `docs/simulation/vortex-simulation-modules.md`
- API contract: `docs/simulation/vortex-simulation-api-contract.md`
- Proposal wizard architecture: `docs/simulation/vortex-simulation-proposal-wizard-architecture.md`
- Local dev: `docs/simulation/vortex-simulation-local-dev.md`
- Scope and rules: `docs/simulation/vortex-simulation-scope-v1.md`, `docs/simulation/vortex-simulation-state-machines.md`
- Vortex 1.0 reference (working copy): `docs/paper/vortex-1.0-paper.md`

## Scripts

- `yarn dev` – start the dev server
- `yarn dev:api` – run the API handlers locally (Node runner)
- `yarn dev:full` – run UI + API together (recommended)
- `yarn build` – build the app
- `yarn test` – run API/unit tests
- `yarn prettier:check` / `yarn prettier:fix`

## Type checking

- Repo typecheck (UI + API handlers + DB seed builders): `yarn exec tsc --noEmit`

## Project Structure

- `src/app` – App shell, routes, sidebar
- `src/components` – shared UI (Hint, PageHint, SearchBar) and primitives under `primitives/`
- `src/data` – glossary (vortexopedia), page hints/tutorial content
- `src/pages` – feature pages (proposals, human-nodes, formations, chambers, factions, courts, feed, profile, invision, etc.)
- `src/styles` – base/global styles
<<<<<<< HEAD
- `functions/` – API handlers (`/api/*`) + shared server helpers
=======
<<<<<<< Updated upstream
- `functions/` – Pages Functions API (`/api/*`) + shared server helpers
=======
- `api/` – API handlers (`/api/*`) + shared server helpers
>>>>>>> Stashed changes
>>>>>>> 5e32f02 (Eliminated functions (getting ready for migration))
- `db/` – Drizzle schema + migrations + seed builders
- `scripts/` – DB seed/clear + local API runner
- `prolog/vortexopedia.pl` – Prolog glossary mirror
- `public/landing/` – landing page assets (see `public/landing/README.md`)

## Shared Patterns

- **Hints**: `HintLabel` for inline glossary popups; `PageHint` for page-level help overlays.
- **Search**: `SearchBar` component standardizes the search row across pages.
- **Status/Stage bars**: proposal pages share a stage bar for Draft → Pool → Chamber vote → Formation.

## Notes

- `dist/` is generated build output.
- Keep glossary entries in sync between `src/data/vortexopedia.ts` and `prolog/vortexopedia.pl` if you edit definitions.
- DB-backed dev requires `DATABASE_URL` + `yarn db:migrate && yarn db:seed` (see `docs/simulation/vortex-simulation-local-dev.md`).
