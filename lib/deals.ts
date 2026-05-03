import type { PriceProviderName } from "./pricing/types";

export const CONDITIONS = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged"
] as const;

export type CardCondition = (typeof CONDITIONS)[number];

export type DealItem = {
  id: string;
  providerCardId: string;
  variantId: string;
  variantLabel: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  condition: CardCondition;
  marketPrice: number;
  manualMarketPrice?: number;
  buyPercent: number;
  quantity: number;
  priceSource: PriceProviderName;
  lastUpdated: string;
  imageUrl?: string;
  externalUrl?: string;
  notes: string;
  marketPriceMissing: boolean;
};

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function effectiveMarketPrice(item: DealItem) {
  return item.manualMarketPrice ?? item.marketPrice;
}

export function suggestedBuyPrice(item: DealItem) {
  return roundCurrency(effectiveMarketPrice(item) * (item.buyPercent / 100));
}

export function totalPayout(item: DealItem) {
  return roundCurrency(suggestedBuyPrice(item) * item.quantity);
}
