import type {
  GradingCompany,
  PortfolioItem,
  PortfolioOwnershipType,
  PortfolioPriceSource
} from "./types";
import {
  averageLatestTransactions,
  estimatedUnitValue,
  portfolioItemTier
} from "./valuation";

export type PortfolioPriceResearchRequest = {
  providerCardId: string;
  name: string;
  setName: string;
  cardNumber: string;
  variantLabel: string;
  ownershipType: PortfolioOwnershipType;
  condition?: string;
  grader?: GradingCompany;
  grade?: string;
  fallbackMarketPrice?: number;
};

export type PortfolioPriceResearchResponse = {
  tier: string;
  estimatedUnitValue: number;
  sources: PortfolioPriceSource[];
  message?: string;
};

export function buildFallbackPriceResearch(
  request: PortfolioPriceResearchRequest,
  now = new Date().toISOString()
): PortfolioPriceResearchResponse {
  const fallbackPrice =
    typeof request.fallbackMarketPrice === "number" &&
    Number.isFinite(request.fallbackMarketPrice)
      ? Math.max(0, request.fallbackMarketPrice)
      : 0;
  const item = requestToPortfolioItem(request, fallbackPrice, now);
  const source: PortfolioPriceSource = {
    source: "Configured market fallback",
    marketPrice: fallbackPrice,
    currency: "USD",
    transactions: [],
    averageLastFive: null,
    lastUpdated: now,
    isFallback: true,
    message:
      "Add POKETRACE_API_KEY to show source-specific recent transactions."
  };

  return {
    tier: portfolioItemTier(item),
    estimatedUnitValue: estimatedUnitValue(item, [source]),
    sources: [source],
    message:
      "Using existing market price because no credentialed transaction API is configured."
  };
}

export function summarizePriceResearch(
  request: PortfolioPriceResearchRequest,
  sources: PortfolioPriceSource[],
  now = new Date().toISOString()
): PortfolioPriceResearchResponse {
  const item = requestToPortfolioItem(request, 0, now);
  const normalizedSources = sources.map((source) => ({
    ...source,
    averageLastFive:
      source.averageLastFive ?? averageLatestTransactions(source.transactions)
  }));

  return {
    tier: portfolioItemTier(item),
    estimatedUnitValue: estimatedUnitValue(item, normalizedSources),
    sources: normalizedSources
  };
}

export function requestToPortfolioItem(
  request: PortfolioPriceResearchRequest,
  estimatedUnitValue: number,
  now: string
): PortfolioItem {
  return {
    id: "research",
    providerCardId: request.providerCardId,
    variantId: request.providerCardId,
    variantLabel: request.variantLabel,
    name: request.name,
    setName: request.setName,
    cardNumber: request.cardNumber,
    rarity: "",
    ownershipType: request.ownershipType,
    condition: request.condition as PortfolioItem["condition"],
    grader: request.grader,
    grade: request.grade,
    quantity: 1,
    estimatedUnitValue,
    priceUpdatedAt: now,
    isPublic: true,
    notes: ""
  };
}
