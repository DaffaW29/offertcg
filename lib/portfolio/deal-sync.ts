import type { DealLot, DealLotItem } from "../deals";
import type { PriceProviderName } from "../pricing/types";
import type { PortfolioItem, PortfolioPriceSource } from "./types";

type PortfolioSyncSource = {
  lot: DealLot;
  item: DealLotItem;
};

export function portfolioItemIdForDealItem(lotId: string, itemId: string) {
  return `deal|${lotId}|${itemId}`;
}

export function isDealLinkedPortfolioItem(item: PortfolioItem) {
  return (
    item.sourceType === "deal" &&
    Boolean(item.sourceLotId) &&
    Boolean(item.sourceLotItemId)
  );
}

export function dealLotItemToPortfolioItem(
  lot: DealLot,
  item: DealLotItem
): PortfolioItem | null {
  const quantity = remainingQuantity(item);
  if (quantity < 1) {
    return null;
  }

  const estimatedUnitValue = roundCurrency(effectiveMarketPrice(item));
  const priceUpdatedAt = item.lastUpdated || lot.checkedOutAt;

  return {
    id: portfolioItemIdForDealItem(lot.id, item.id),
    providerCardId: item.providerCardId,
    variantId: item.variantId,
    variantLabel: item.variantLabel,
    name: item.name,
    setName: item.setName,
    cardNumber: item.cardNumber,
    rarity: item.rarity,
    imageUrl: item.imageUrl,
    externalUrl: item.externalUrl,
    ownershipType: "raw",
    condition: item.condition,
    quantity,
    estimatedUnitValue,
    priceUpdatedAt,
    priceSources: priceSourcesForDealItem(item, estimatedUnitValue, priceUpdatedAt),
    isPublic: false,
    notes: item.notes,
    sourceType: "deal",
    sourceLotId: lot.id,
    sourceLotItemId: item.id,
    sourceLotLabel: lot.label,
    sourceCheckedOutAt: lot.checkedOutAt
  };
}

export function dealLotToPortfolioItems(lot: DealLot) {
  return lot.items
    .map((item) => dealLotItemToPortfolioItem(lot, item))
    .filter((item): item is PortfolioItem => item !== null);
}

export function getDealPortfolioImportCandidates(
  lots: DealLot[],
  portfolioItems: PortfolioItem[]
) {
  const existingIds = new Set(portfolioItems.map((item) => item.id));
  const existingSourceKeys = new Set(
    portfolioItems
      .map((item) => portfolioItemSourceKey(item))
      .filter((key): key is string => key !== null)
  );

  return lots.flatMap((lot) =>
    dealLotToPortfolioItems(lot).filter((item) => {
      const sourceKey = portfolioItemSourceKey(item);

      return (
        !existingIds.has(item.id) &&
        sourceKey !== null &&
        !existingSourceKeys.has(sourceKey)
      );
    })
  );
}

export function mergePortfolioImportItems(
  currentItems: PortfolioItem[],
  imports: PortfolioItem[]
) {
  const existingIds = new Set(currentItems.map((item) => item.id));
  const existingSourceKeys = new Set(
    currentItems
      .map((item) => portfolioItemSourceKey(item))
      .filter((key): key is string => key !== null)
  );
  const added: PortfolioItem[] = [];

  imports.forEach((item) => {
    const sourceKey = portfolioItemSourceKey(item);
    if (
      existingIds.has(item.id) ||
      sourceKey === null ||
      existingSourceKeys.has(sourceKey)
    ) {
      return;
    }

    added.push(item);
    existingIds.add(item.id);
    existingSourceKeys.add(sourceKey);
  });

  return {
    items: added.length > 0 ? [...added, ...currentItems] : currentItems,
    added
  };
}

export function syncDealLinkedPortfolioItems(
  currentItems: PortfolioItem[],
  lots: DealLot[]
) {
  const dealItemsBySource = dealItemSourceMap(lots);
  const changed: PortfolioItem[] = [];
  const removed: PortfolioItem[] = [];
  const items = currentItems.flatMap((portfolioItem) => {
    const sourceKey = portfolioItemSourceKey(portfolioItem);
    if (!isDealLinkedPortfolioItem(portfolioItem) || sourceKey === null) {
      return [portfolioItem];
    }

    const source = dealItemsBySource.get(sourceKey);
    if (!source) {
      removed.push(portfolioItem);
      return [];
    }

    const quantity = remainingQuantity(source.item);
    if (quantity < 1) {
      removed.push(portfolioItem);
      return [];
    }

    const nextItem = {
      ...portfolioItem,
      quantity,
      sourceLotLabel: source.lot.label,
      sourceCheckedOutAt: source.lot.checkedOutAt
    };

    if (
      nextItem.quantity !== portfolioItem.quantity ||
      nextItem.sourceLotLabel !== portfolioItem.sourceLotLabel ||
      nextItem.sourceCheckedOutAt !== portfolioItem.sourceCheckedOutAt
    ) {
      changed.push(nextItem);
    }

    return [nextItem];
  });

  return { items, changed, removed };
}

function dealItemSourceMap(lots: DealLot[]) {
  const sources = new Map<string, PortfolioSyncSource>();

  lots.forEach((lot) => {
    lot.items.forEach((item) => {
      sources.set(dealSourceKey(lot.id, item.id), { lot, item });
    });
  });

  return sources;
}

function portfolioItemSourceKey(item: PortfolioItem) {
  if (!item.sourceLotId || !item.sourceLotItemId) {
    return null;
  }

  return dealSourceKey(item.sourceLotId, item.sourceLotItemId);
}

function dealSourceKey(lotId: string, itemId: string) {
  return `${lotId}|${itemId}`;
}

function priceSourcesForDealItem(
  item: DealLotItem,
  estimatedUnitValue: number,
  lastUpdated: string
): PortfolioPriceSource[] {
  if (estimatedUnitValue <= 0) {
    return [];
  }

  if (typeof item.manualMarketPrice === "number") {
    return [
      {
        source: "Manual override",
        marketPrice: estimatedUnitValue,
        currency: "USD",
        transactions: [],
        averageLastFive: null,
        lastUpdated,
        message: "Manual market override from checked-out deal."
      }
    ];
  }

  if (item.marketPriceMissing) {
    return [];
  }

  return [
    {
      source: priceProviderLabel(item.priceSource),
      marketPrice: estimatedUnitValue,
      currency: "USD",
      transactions: [],
      averageLastFive: null,
      lastUpdated,
      message: "Current provider market price from checked-out deal."
    }
  ];
}

function priceProviderLabel(source: PriceProviderName) {
  if (source === "pokemon-tcg-api") {
    return "Pokemon TCG API";
  }

  if (source === "tcgplayer") {
    return "TCGplayer";
  }

  return "Mock";
}

function effectiveMarketPrice(item: DealLotItem) {
  return item.manualMarketPrice ?? item.marketPrice;
}

function remainingQuantity(item: DealLotItem) {
  return Math.max(0, item.quantity - item.soldQuantity);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
