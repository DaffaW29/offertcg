export type PriceProviderName = "pokemon-tcg-api" | "tcgplayer" | "mock";

export const DEFAULT_SEARCH_PAGE = 1;
export const SEARCH_PAGE_SIZE = 50;
export const MAX_SEARCH_PAGE_SIZE = 250;

export type CardSearchFilters = {
  query: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
  page?: number;
  pageSize?: number;
};

export type PriceVariant = {
  id: string;
  label: string;
  marketPrice: number | null;
  lowPrice?: number | null;
  midPrice?: number | null;
  highPrice?: number | null;
};

export type CardSearchResult = {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl?: string;
  externalUrl?: string;
  variants: PriceVariant[];
  priceSource: PriceProviderName;
  lastUpdated: string;
};

export type CardSearchPage = {
  cards: CardSearchResult[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
};

export type ProviderSearchResponse = CardSearchPage & {
  provider: PriceProviderName;
  isFallback: boolean;
  message?: string;
};

export type PriceProvider = {
  name: PriceProviderName;
  searchCards(filters: CardSearchFilters): Promise<CardSearchPage>;
};
