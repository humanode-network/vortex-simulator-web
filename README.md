# Vortex Simulator — Web

This repo contains the **frontend UI only** for the Vortex Simulator.

Backend API lives separately in `humanode-network/vortex-simulator-server`.

Docs live separately in `humanode-network/vortex-simulator-docs`.

## Stack

- React with React Router
- Rsbuild
- Tailwind v4 (via PostCSS) + token-driven CSS (`src/styles/base.css`)
- Yarn (Node version: `.node-version`)
- `public/landing/` – landing page assets (see `public/landing/README.md`)

## Shared Patterns

- **Hints**: `HintLabel` for inline glossary popups; `PageHint` for page-level help overlays.
- **Search**: `SearchBar` component standardizes the search row across pages.
- **Status/Stage bars**: proposal pages share a stage bar for Draft → Pool → Chamber vote → Formation.

## Notes

- `dist/` is generated build output.
- UI expects the API at `/api/*`. During local dev, Rsbuild proxies `/api/*` to `http://127.0.0.1:8788` by default (override with `API_PROXY_TARGET`).
