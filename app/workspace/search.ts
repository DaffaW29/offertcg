import type { CardSearchResult } from "@/lib/pricing/types";
import type { SearchFilters } from "./types";

export function getSelectedVariant(card: CardSearchResult, selectedId?: string) {
  return (
    card.variants.find((variant) => variant.id === selectedId) ??
    card.variants[0]
  );
}

export function sortCardsByMarketAvailability(cards: CardSearchResult[]) {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((left, right) => {
      const priceRank =
        Number(hasCardMarketPrice(right.card)) -
        Number(hasCardMarketPrice(left.card));

      return priceRank === 0 ? left.index - right.index : priceRank;
    })
    .map(({ card }) => card);
}

export function hasCardMarketPrice(card: CardSearchResult) {
  return card.variants.some((variant) => variant.marketPrice !== null);
}

export function toSearchFilters(
  query: string,
  setName: string,
  cardNumber: string,
  rarity: string
): SearchFilters {
  return {
    query: query.trim(),
    setName: setName.trim(),
    cardNumber: cardNumber.trim(),
    rarity: rarity.trim()
  };
}

export function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string
) {
  const trimmed = value.trim();
  if (trimmed) {
    params.set(key, trimmed);
  }
}
