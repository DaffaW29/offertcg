import {
  effectiveMarketPrice,
  grossProfit,
  lotNetProfit,
  lotTotals,
  portfolioTotals,
  remainingCost,
  remainingMarketValue,
  remainingQuantity,
  remainingSpread,
  roiPercent,
  roundCurrency,
  soldRevenue,
  totalPayout,
  type DealItem,
  type DealLot
} from "@/lib/deals";
import { formatDateTime } from "./formatters";
import type {
  DealCartTotals,
  InventoryMode,
  InventoryRow,
  InventorySort,
  LotHistoryFilter,
  LotHistorySort,
  LotPerformance,
  LotStatusBadge,
  MonthlyProfit
} from "./types";

export function deriveCurrentDealTotals(cart: DealItem[]): DealCartTotals {
  return cart.reduce(
    (summary, item) => {
      const marketTotal = effectiveMarketPrice(item) * item.quantity;
      summary.marketValue += marketTotal;
      summary.payout += totalPayout(item);
      summary.quantity += item.quantity;
      return summary;
    },
    { marketValue: 0, payout: 0, quantity: 0 }
  );
}

export function derivePortfolioSummary(recentBuys: DealLot[]) {
  return portfolioTotals(recentBuys);
}

// Analytics are derived from checked-out lots so history, inventory, and charts stay consistent.
export function deriveLotPerformance(recentBuys: DealLot[]): LotPerformance[] {
  return recentBuys
    .map<LotPerformance>((lot) => {
      const totals = lotTotals(lot);
      const lotNet = lotNetProfit(lot);

      return {
        lot,
        totals,
        lotNet,
        portfolioRoi: roiPercent(lotNet, totals.buyCost)
      };
    })
    .sort((first, second) => second.lotNet - first.lotNet);
}

export function getVisibleLots(
  recentBuys: DealLot[],
  lotHistoryQuery: string,
  lotHistoryFilter: LotHistoryFilter,
  lotHistorySort: LotHistorySort
) {
  const query = lotHistoryQuery.trim().toLowerCase();

  return recentBuys
    .filter((lot) => {
      const totals = lotTotals(lot);
      const lotNet = lotNetProfit(lot);

      switch (lotHistoryFilter) {
        case "open":
          return totals.remainingQuantity > 0;
        case "sold":
          return totals.quantity > 0 && totals.remainingQuantity === 0;
        case "profitable":
          return lotNet > 0;
        case "loss":
          return (
            lotNet < 0 &&
            (totals.soldRevenue > 0 || totals.remainingQuantity === 0)
          );
        case "all":
        default:
          return true;
      }
    })
    .filter((lot) => {
      if (!query) {
        return true;
      }

      return [
        lot.label,
        formatDateTime(lot.checkedOutAt),
        ...lot.items.flatMap((item) => [
          item.name,
          item.setName,
          item.cardNumber,
          item.rarity,
          item.condition,
          item.variantLabel
        ])
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((first, second) => {
      const firstTotals = lotTotals(first);
      const secondTotals = lotTotals(second);
      const firstNet = lotNetProfit(first);
      const secondNet = lotNetProfit(second);

      switch (lotHistorySort) {
        case "oldest":
          return (
            new Date(first.checkedOutAt).getTime() -
            new Date(second.checkedOutAt).getTime()
          );
        case "profit":
          return secondNet - firstNet;
        case "roi":
          return (
            roiPercent(secondNet, secondTotals.buyCost) -
            roiPercent(firstNet, firstTotals.buyCost)
          );
        case "remaining":
          return secondTotals.remainingQuantity - firstTotals.remainingQuantity;
        case "buy-cost":
          return secondTotals.buyCost - firstTotals.buyCost;
        case "newest":
        default:
          return (
            new Date(second.checkedOutAt).getTime() -
            new Date(first.checkedOutAt).getTime()
          );
      }
    });
}

export function getHistorySelectedLot(
  visibleLots: DealLot[],
  selectedLotId: string | null
) {
  return (
    visibleLots.find((lot) => lot.id === selectedLotId) ??
    visibleLots[0] ??
    null
  );
}

export function deriveMonthlyProfit(recentBuys: DealLot[]): MonthlyProfit[] {
  const months = new Map<string, MonthlyProfit>();

  recentBuys.forEach((lot) => {
    lot.items.forEach((item) => {
      item.sales.forEach((sale) => {
        const soldAt = new Date(sale.soldAt);
        const key = Number.isNaN(soldAt.getTime())
          ? "unknown"
          : `${soldAt.getFullYear()}-${String(soldAt.getMonth() + 1).padStart(2, "0")}`;
        const label =
          key === "unknown"
            ? "Unknown"
            : soldAt.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric"
              });
        const current = months.get(key) ?? {
          key,
          label,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantity: 0
        };

        current.revenue += sale.saleTotal;
        current.cost += item.buyUnitPrice * sale.quantity;
        current.quantity += sale.quantity;
        current.profit = current.revenue - current.cost;
        months.set(key, current);
      });
    });
  });

  return [...months.values()]
    .map((month) => ({
      ...month,
      revenue: roundCurrency(month.revenue),
      cost: roundCurrency(month.cost),
      profit: roundCurrency(month.profit)
    }))
    .sort((first, second) => first.key.localeCompare(second.key));
}

export function getMaxMonthlyProfit(monthlyProfit: MonthlyProfit[]) {
  return Math.max(1, ...monthlyProfit.map((month) => Math.abs(month.profit)));
}

export function deriveInventoryRows(
  recentBuys: DealLot[],
  inventoryQuery: string,
  inventoryMode: InventoryMode,
  inventorySort: InventorySort
): InventoryRow[] {
  const query = inventoryQuery.trim().toLowerCase();

  return recentBuys
    .flatMap<InventoryRow>((lot) =>
      lot.items.map((item) => ({
        id: `${lot.id}|${item.id}`,
        lotId: lot.id,
        lotLabel: lot.label,
        checkedOutAt: lot.checkedOutAt,
        item,
        remaining: remainingQuantity(item),
        buyCost: remainingCost(item),
        marketValue: remainingMarketValue(item),
        spread: remainingSpread(item)
      }))
    )
    .filter((row) => inventoryMode === "all" || row.remaining > 0)
    .filter((row) => {
      if (!query) {
        return true;
      }

      return [
        row.item.name,
        row.item.setName,
        row.item.cardNumber,
        row.item.rarity,
        row.item.condition,
        row.item.variantLabel,
        row.lotLabel
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((first, second) => {
      switch (inventorySort) {
        case "cost":
          return second.buyCost - first.buyCost;
        case "name":
          return first.item.name.localeCompare(second.item.name);
        case "spread":
          return second.spread - first.spread;
        case "value":
          return second.marketValue - first.marketValue;
        case "newest":
        default:
          return (
            new Date(second.checkedOutAt).getTime() -
            new Date(first.checkedOutAt).getTime()
          );
      }
    });
}

export function lotStatusBadges(lot: DealLot): LotStatusBadge[] {
  const totals = lotTotals(lot);
  const lotNet = lotNetProfit(lot);
  const badges: LotStatusBadge[] = [
    totals.remainingQuantity === 0
      ? { label: "Sold out", tone: "sold" }
      : { label: "Open", tone: "open" }
  ];

  if (lotNet > 0) {
    badges.push({ label: "Profit", tone: "profit" });
  } else if (
    lotNet < 0 &&
    (totals.soldRevenue > 0 || totals.remainingQuantity === 0)
  ) {
    badges.push({ label: "Loss", tone: "loss" });
  } else if (totals.soldRevenue > 0) {
    badges.push({ label: "Break even", tone: "neutral" });
  }

  return badges;
}

export { grossProfit, remainingQuantity, soldRevenue };
