import { roundCurrency } from "@/lib/deals";
import type { CardSearchResult } from "@/lib/pricing/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(roundCurrency(value));
}

export function formatPercent(value: number) {
  return `${percentFormatter.format(roundCurrency(value))}%`;
}

export function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatPriceDate(value: string) {
  if (!value.trim()) {
    return "Price date unavailable";
  }

  return `Updated ${formatDate(value)}`;
}

export function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function formatLotLabel(checkedOutAt: string) {
  return `Lot ${formatDateTime(checkedOutAt)}`;
}

export function sourceLabel(source: CardSearchResult["priceSource"]) {
  if (source === "pokemon-tcg-api") {
    return "Pokemon TCG API";
  }

  if (source === "tcgplayer") {
    return "TCGplayer";
  }

  return "Mock";
}

export function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
