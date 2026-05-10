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

## 2026-05-07

- Updated quick buy percentage controls to run from 70% through 100% in 5-point
  increments, with the default reset target aligned to 70%.
- Added a vertical scroll area to search results so long card searches remain
  contained inside the results panel.
- Added paginated card search using 50 results per page with Next/Previous
  controls and provider response metadata from the Pokemon TCG API.
- Added browser-local recent buy lots under `offertcg-recent-buys-v1`,
  checkout from the active cart, partial sold-quantity tracking, and gross
  profit summaries by lot.
- Clarified selected lot detail profit metrics: `Lot net` is sold revenue minus
  total buy cost, while `Sold profit` remains realized profit on sold quantities.

## 2026-05-09

- Added Supabase Auth/Postgres integration with email/password account sync,
  RLS schema in `supabase/schema.sql`, and client data helpers under
  `lib/supabase`.
- Existing local cart/recent buy data imports once after first sign-in, then
  signed-in persistence uses Supabase while unsigned users keep local fallback.
- Added portfolio analytics and inventory views derived from existing buy lot
  and sale data. No Supabase schema migration is needed for these views because
  they use `recentBuys`/`deal_lots`, `deal_lot_items`, and `sale_records`.
- Added recent-buy history controls for lot search, open/sold/profit/loss
  filters, sorting, and lot status badges. Account controls now live in a
  profile popover opened from the header icon instead of a persistent header
  panel.

## 2026-05-10

- Deployed production to Vercel at `https://offertcg.vercel.app` with project
  `daffa-w-s-projects/offertcg`. Production env vars added: Supabase URL,
  Supabase publishable key, and `PRICE_PROVIDER=pokemon-tcg`.
- Vercel CLI created local `.vercel` project metadata and added `.vercel` to
  `.gitignore`. GitHub auto-deploy connection failed until the Vercel account
  adds a GitHub login connection.
- Live verification passed for `/` and `/api/cards/search?q=charizard`. Supabase
  Auth URL Configuration still needs the production Site URL and redirect URLs
  set in the Supabase dashboard.
- Added a modern first-screen landing hero above the existing workspace with
  floating animated Pokemon card images, CTA buttons that scroll into the app,
  and reduced-motion handling. No route or persistence changes were needed.
- Expanded the landing hero card library to 16 verified Pokemon TCG image URLs
  and added timed cross-fades so each visual slot cycles through new cards.
- Manually redeployed commit `26be898` to Vercel production as
  `dpl_22xUpP17vLRNvifZHejPVpwVw1mz`; `https://offertcg.vercel.app` now serves
  the rotating landing-card hero. Live `/` and `/api/cards/search?q=charizard`
  checks passed after deploy.
