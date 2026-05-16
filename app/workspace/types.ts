import type { DealItem, DealLot, DealLotItem, lotTotals } from "@/lib/deals";
import type { CityLocation } from "@/lib/portfolio/types";
import type { CardSearchResult } from "@/lib/pricing/types";

export type StoredDeal = {
  cart?: DealItem[];
  globalBuyPercent?: number;
  pushNoMarketCardsDown?: boolean;
};

export type ApiErrorResponse = {
  error?: string;
};

export type ActiveTab =
  | "current"
  | "recent"
  | "analytics"
  | "inventory"
  | "portfolio"
  | "nearby";
export type InventoryMode = "unsold" | "all";
export type InventorySort = "newest" | "value" | "cost" | "name" | "spread";
export type NearbySort = "distance" | "value" | "cards" | "updated";
export type LotHistoryFilter = "all" | "open" | "sold" | "profitable" | "loss";
export type LotHistorySort =
  | "newest"
  | "oldest"
  | "profit"
  | "roi"
  | "remaining"
  | "buy-cost";

export type SearchFilters = {
  query: string;
  setName: string;
  cardNumber: string;
  rarity: string;
};

export type SearchPagination = {
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
};

export type SaleDraft = {
  quantity: string;
  saleTotal: string;
};

export type AuthMode = "login" | "signup";

export type DealCartTotals = {
  marketValue: number;
  payout: number;
  quantity: number;
};

export type LotPerformance = {
  lot: DealLot;
  totals: ReturnType<typeof lotTotals>;
  lotNet: number;
  portfolioRoi: number;
};

export type MonthlyProfit = {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  quantity: number;
};

export type InventoryRow = {
  id: string;
  lotId: string;
  lotLabel: string;
  checkedOutAt: string;
  item: DealLotItem;
  remaining: number;
  buyCost: number;
  marketValue: number;
  spread: number;
};

export type LotStatusBadge = {
  label: string;
  tone: "open" | "sold" | "profit" | "loss" | "neutral";
};

export type SearchVariantSetter = React.Dispatch<
  React.SetStateAction<Record<string, string>>
>;

export type ResultCard = CardSearchResult;

export type CitySearchResponse = {
  cities?: CityLocation[];
  message?: string;
  error?: string;
};
