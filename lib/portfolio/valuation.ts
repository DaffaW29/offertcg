import type {
  PortfolioItem,
  PortfolioPriceSource,
  PortfolioTransaction,
  PortfolioWorth
} from "./types";

export function portfolioItemTier(item: PortfolioItem) {
  if (item.ownershipType === "graded") {
    const grader = normalizeTierPart(item.grader ?? "GRADED");
    const grade = normalizeTierPart(item.grade ?? "UNKNOWN");
    return `${grader}_${grade}`;
  }

  return normalizeTierPart(item.condition ?? "Raw");
}

export function averageLatestTransactions(
  transactions: PortfolioTransaction[],
  limit = 5
) {
  const prices = latestTransactions(transactions, limit).map(
    (transaction) => transaction.price
  );

  if (prices.length === 0) {
    return null;
  }

  return roundCurrency(
    prices.reduce((total, price) => total + price, 0) / prices.length
  );
}

export function latestTransactions(
  transactions: PortfolioTransaction[],
  limit = 5
) {
  return transactions
    .filter(
      (transaction) =>
        Number.isFinite(transaction.price) && transaction.price > 0
    )
    .toSorted((left, right) => {
      return new Date(right.soldAt).getTime() - new Date(left.soldAt).getTime();
    })
    .slice(0, limit);
}

export function estimatePortfolioWorth(
  entries: { item: PortfolioItem; sources?: PortfolioPriceSource[] }[]
): PortfolioWorth {
  return entries.reduce(
    (summary, entry) => {
      const unitValue = estimatedUnitValue(entry.item, entry.sources);
      const quantity = Math.max(0, Math.floor(entry.item.quantity));

      summary.itemCount += quantity;
      summary.totalValue = roundCurrency(
        summary.totalValue + roundCurrency(unitValue * quantity)
      );

      if (unitValue <= 0) {
        summary.incompleteCount += 1;
      }

      return summary;
    },
    {
      totalValue: 0,
      itemCount: 0,
      incompleteCount: 0
    }
  );
}

export function estimatedUnitValue(
  item: PortfolioItem,
  sources = item.priceSources ?? []
) {
  for (const source of sources) {
    const transactionAverage =
      source.averageLastFive ?? averageLatestTransactions(source.transactions);
    if (transactionAverage !== null && transactionAverage > 0) {
      return transactionAverage;
    }
  }

  const marketSource = sources.find(
    (source) =>
      source.marketPrice !== null &&
      Number.isFinite(source.marketPrice) &&
      source.marketPrice > 0
  );
  if (marketSource?.marketPrice) {
    return marketSource.marketPrice;
  }

  return Number.isFinite(item.estimatedUnitValue)
    ? Math.max(0, item.estimatedUnitValue)
    : 0;
}

export function normalizeTierPart(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/\.5\b/g, "_5")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "UNKNOWN";
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
