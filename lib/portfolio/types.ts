import type { CardCondition } from "@/lib/deals";

export const GRADING_COMPANIES = [
  "PSA",
  "BGS",
  "CGC",
  "SGC",
  "ACE",
  "TAG"
] as const;

export type GradingCompany = (typeof GRADING_COMPANIES)[number];
export type PortfolioOwnershipType = "raw" | "graded";
export type PortfolioSort = "distance" | "value" | "cards" | "updated";

export type CityLocation = {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  placeName: string;
};

export type PortfolioTransaction = {
  id: string;
  title: string;
  price: number;
  currency: string;
  soldAt: string;
  url?: string;
  grader?: string | null;
  grade?: string | null;
  condition?: string | null;
  anomalyReason?: string | null;
};

export type PortfolioPriceSource = {
  source: string;
  marketPrice: number | null;
  currency: string;
  transactions: PortfolioTransaction[];
  averageLastFive: number | null;
  lastUpdated: string;
  isFallback?: boolean;
  message?: string;
};

export type PortfolioItem = {
  id: string;
  providerCardId: string;
  variantId: string;
  variantLabel: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl?: string;
  externalUrl?: string;
  ownershipType: PortfolioOwnershipType;
  condition?: CardCondition;
  grader?: GradingCompany;
  grade?: string;
  certNumber?: string;
  quantity: number;
  estimatedUnitValue: number;
  priceUpdatedAt: string;
  priceSources?: PortfolioPriceSource[];
  isPublic: boolean;
  notes: string;
};

export type PublicPortfolioCard = Pick<
  PortfolioItem,
  | "id"
  | "providerCardId"
  | "variantId"
  | "variantLabel"
  | "name"
  | "setName"
  | "cardNumber"
  | "rarity"
  | "imageUrl"
  | "externalUrl"
  | "ownershipType"
  | "condition"
  | "grader"
  | "grade"
  | "quantity"
  | "estimatedUnitValue"
  | "priceUpdatedAt"
  | "priceSources"
  | "isPublic"
>;

export type PublicPortfolioPin = {
  userId: string;
  displayName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  portfolioValue: number;
  itemCount: number;
  isPublic: boolean;
  cards: PublicPortfolioCard[];
};

export type PublicPortfolioResult = PublicPortfolioPin & {
  distanceMiles: number;
};

export type PublicPortfolioFilters = {
  origin?: {
    latitude: number;
    longitude: number;
  };
  maxDistanceMiles?: number;
  cardQuery: string;
  sort: PortfolioSort;
};

export type PortfolioWorth = {
  totalValue: number;
  itemCount: number;
  incompleteCount: number;
};
