# OfferTCG

OfferTCG is a quick vendor tool for Pokemon card buy deals. Search for a card,
pick the right set/version, add it to a deal cart, and calculate a suggested
payout from a buy percentage.

## MVP Status

This repo currently contains a working MVP website with:

- Search/add flow for Pokemon cards.
- Live server-side Pokemon TCG API lookup with mock fallback.
- Deal cart totals, quantity editing, per-card buy percentages, and global quick
  percentage buttons.
- Condition selection, notes, manual market price override, clear cart, and CSV
  export.
- Browser `localStorage` persistence so the current deal survives refreshes.

## Stack

- Next.js App Router
- React
- TypeScript
- Server route handlers for price lookup
- Browser `localStorage` for the current deal cart

## Features

- Paginated Pokemon card search by name with optional set name, card number, and
  rarity filters.
- Server-side price provider abstraction so API keys stay out of client code.
- Default live provider uses the Pokemon TCG API.
- Mock provider fallback when live price lookup is unavailable.
- Deal cart with market value, buy percentage, suggested buy price, quantity,
  total payout, notes, condition, manual price override, remove, clear cart, and
  CSV export.
- Quick buy percentage buttons: 70%, 75%, 80%, 85%, 90%, 95%, and 100%.
- Cart persistence across refreshes.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The Pokemon TCG API can be used without a key at lower rate limits. For better
limits, add a server-side key:

```bash
POKEMON_TCG_API_KEY=your_key_here
PRICE_PROVIDER=pokemon-tcg
```

To force sample data:

```bash
PRICE_PROVIDER=mock
```

## Price Providers

The app does not scrape TCGplayer pages. Direct TCGplayer support should only be
added through official API access and server-side credentials. The current
provider flow is:

1. `pokemon-tcg`: calls the Pokemon TCG API from the server and maps available
   TCGplayer market prices into the app model.
2. `mock`: deterministic sample data for development and fallback behavior.
3. `tcgplayer`: placeholder for a future official TCGplayer API integration.

TCGplayer credentials must only be used through official API access and must
remain in server-side environment variables. Never expose private provider keys
in frontend code.

## Commands

```bash
npm run dev
npm run lint
npm run build
```

## Verification

The MVP was verified with:

```bash
npm run lint
npm run build
curl "http://localhost:3000/api/cards/search?q=charizard"
```

The API route returned live Pokemon TCG API data when tested locally. If live
lookup is unavailable, the app displays labeled mock data instead of scraping.

## Deal Item Model

Cart items are stored with:

- `id`
- `providerCardId`
- `variantId`
- `variantLabel`
- `name`
- `setName`
- `cardNumber`
- `rarity`
- `condition`
- `marketPrice`
- `manualMarketPrice`
- `buyPercent`
- `quantity`
- `priceSource`
- `lastUpdated`
- `notes`
- `marketPriceMissing`

Suggested buy price is calculated as:

```text
market_price * (buy_percentage / 100)
```

Prices are rounded to two decimals for display and export.
