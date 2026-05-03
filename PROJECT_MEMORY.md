# Project Memory

## 2026-05-03

- Initialized the empty repo as a Next.js App Router + TypeScript app.
- Added a server-only price-provider abstraction under `lib/pricing`.
- Default provider is Pokemon TCG API via `/api/cards/search`; it falls back to
  labeled mock data if the live provider fails.
- TCGplayer scraping is intentionally not implemented. Future TCGplayer support
  should use official API credentials through server-side environment variables.
- Built the vendor MVP UI with search, filters, variant selection, condition
  dropdowns, localStorage cart persistence, quick buy percentage controls,
  per-card overrides, notes, CSV export, and deal totals.
- Cart persistence key: `offertcg-current-deal-v1`.
- Current verification target: `npm run lint`, `npm run build`, and manual local
  testing through the Next.js dev server.
