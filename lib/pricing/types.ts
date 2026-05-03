export type PriceProviderName = "pokemon-tcg-api" | "tcgplayer" | "mock";

export type CardSearchFilters = {
  query: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
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

export type ProviderSearchResponse = {
  cards: CardSearchResult[];
  provider: PriceProviderName;
  isFallback: boolean;
  message?: string;
};

export type PriceProvider = {
  name: PriceProviderName;
  searchCards(filters: CardSearchFilters): Promise<CardSearchResult[]>;
};
