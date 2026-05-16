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
- Added Tailwind CSS v3 with preflight disabled, shadcn-compatible
  `components.json`, `lib/utils.ts`, and `/components/ui/aurora-background.tsx`.
  The landing hero now uses the Aurora background behind the existing rotating
  Pokemon card scene.
- Added confirmed hard-delete for recent buy lots. Signed-in deletes remove the
  `deal_lots` row and rely on the existing Supabase cascade constraints for lot
  items and sale records; unsigned deletes update local recent-buy state.
- Japanese search support is intentionally deferred. The current search path
  uses Pokemon TCG API card data plus TCGplayer pricing, while no-cost
  multilingual catalog sources would need manual/unavailable pricing handling.
- Fixed Pokemon TCG search mapping so missing `tcgplayer.updatedAt` stays blank
  instead of showing today. Users can toggle whether search pages push cards
  with market prices above unpriced cards, and that browser preference is stored
  locally instead of synced to Supabase.
- Added README screenshot gallery assets under `docs/screenshots/` covering the
  landing hero, deal builder, recent buys, analytics dashboard, and inventory
  view.
- Added inline recent-buy lot renaming. Local renames persist through existing
  recent-buy storage, while signed-in renames update `deal_lots.label` through
  Supabase before the local label changes.

## 2026-05-15

- Refactored the single-page workspace into focused `app/workspace` components
  plus pure helper modules for formatting, search, storage, deal helpers, and
  analytics derivations. API routes, Supabase schema/helpers, pricing provider
  behavior, persistence keys, and CSV fields remain unchanged.
- Applied the `ui-ux-pro-max` dashboard direction: dark financial palette,
  compact trading-desk spacing, Fira Sans/Fira Code via `next/font/google`,
  dense tables, mobile card table layouts, visible focus states, and
  reduced-motion support.
- `next/font/google` Fira builds need network access the first time fonts are
  fetched if the Next cache is cold.
- Verification covered lint, production build, and live Safari checks for search,
  add-to-cart, percentage changes, quantity/manual override, CSV availability,
  checkout to recent buys, analytics, inventory, and the profile popover.

## 2026-05-16

- Added user-owned portfolio tracking separate from vendor buy lots. Portfolio
  items distinguish raw condition entries from graded slab entries, keep cert
  numbers/notes private, store source-specific price snapshots, and compute
  worth from recent transaction averages before market-price fallback.
- Added Supabase `profiles`, `portfolio_items`, and
  `search_public_portfolios()` to support signed-in nearby discovery. The RPC
  returns sanitized city-level public fields only; exact locations, email,
  cert numbers, private notes, and hidden cards are not exposed.
- Added `/api/locations/city-search` with Mapbox city-only lookup and bundled
  fallback cities, plus `/api/cards/price-research` for PokeTrace-backed recent
  comps when `POKETRACE_API_KEY` is configured.
- Nearby discovery uses a Mapbox GL JS runtime load when
  `NEXT_PUBLIC_MAPBOX_TOKEN` is present and otherwise renders a local city
  centroid fallback map.
- Added recent-buy portfolio imports. Profiles now have
  `auto_mirror_deal_items`; when enabled, checkout creates private raw
  portfolio entries linked to the lot item. When disabled, the Portfolio tab
  suggests unsold recent buys with add-selected/add-all controls. Linked
  portfolio quantities are inventory-managed and sync down on sales or lot
  deletion.
- Verification targets now include `npm run lint`, `npm run build`, and
  `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test
  --experimental-strip-types lib/portfolio/portfolio.test.mts`.
- API routes for card search, city search, and price research now require
  server-side Supabase auth before provider work, validate inputs with Zod, and
  call an Upstash-backed per-user route limiter when
  `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are configured.
- The server auth helper intentionally treats missing Supabase env vars as
  unauthenticated so local-only mode returns 401 instead of throwing 500s.
- Next 16 uses the `proxy.ts` convention for Supabase auth cookie refresh on
  `/api/*` and `/workspace/*`; avoid reintroducing deprecated `middleware.ts`.
