import {
  roundCurrency,
  suggestedBuyPrice,
  type DealItem,
  type DealLotItem
} from "@/lib/deals";
import { DEFAULT_BUY_PERCENT } from "./constants";

export function createDealLotItem(item: DealItem): DealLotItem {
  const buyUnitPrice = suggestedBuyPrice(item);

  return {
    ...item,
    buyUnitPrice,
    buyTotal: roundCurrency(buyUnitPrice * item.quantity),
    soldQuantity: 0,
    sales: []
  };
}

export function saleDraftKey(lotId: string, itemId: string) {
  return `${lotId}|${itemId}`;
}

export function isValidPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_BUY_PERCENT;
  }

  return Math.min(100, Math.max(1, Math.round(value)));
}

export function clampQuantityInput(value: string, maxQuantity: number) {
  if (value === "" || maxQuantity < 1) {
    return "";
  }

  const quantity = Math.floor(Number(value));
  if (!Number.isFinite(quantity)) {
    return "";
  }

  return Math.min(maxQuantity, Math.max(1, quantity)).toString();
}

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
