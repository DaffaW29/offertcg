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

export type SaleRecord = {
  id: string;
  soldAt: string;
  quantity: number;
  saleTotal: number;
};

export type DealLotItem = DealItem & {
  buyUnitPrice: number;
  buyTotal: number;
  soldQuantity: number;
  sales: SaleRecord[];
};

export type DealLot = {
  id: string;
  label: string;
  checkedOutAt: string;
  items: DealLotItem[];
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

export function remainingQuantity(item: DealLotItem) {
  return Math.max(0, item.quantity - item.soldQuantity);
}

export function soldRevenue(item: DealLotItem) {
  return roundCurrency(
    item.sales.reduce((total, sale) => total + sale.saleTotal, 0)
  );
}

export function soldCost(item: DealLotItem) {
  return roundCurrency(item.buyUnitPrice * item.soldQuantity);
}

export function grossProfit(item: DealLotItem) {
  return roundCurrency(soldRevenue(item) - soldCost(item));
}

export function lotTotals(lot: DealLot) {
  return lot.items.reduce(
    (summary, item) => {
      summary.buyCost += item.buyTotal;
      summary.soldRevenue += soldRevenue(item);
      summary.grossProfit += grossProfit(item);
      summary.quantity += item.quantity;
      summary.soldQuantity += item.soldQuantity;
      summary.remainingQuantity += remainingQuantity(item);
      return summary;
    },
    {
      buyCost: 0,
      soldRevenue: 0,
      grossProfit: 0,
      quantity: 0,
      soldQuantity: 0,
      remainingQuantity: 0
    }
  );
}

export function lotNetProfit(lot: DealLot) {
  const totals = lotTotals(lot);
  return roundCurrency(totals.soldRevenue - totals.buyCost);
}
