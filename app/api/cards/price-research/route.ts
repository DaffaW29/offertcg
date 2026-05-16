import { NextResponse } from "next/server";
import {
  buildFallbackPriceResearch,
  summarizePriceResearch,
  type PortfolioPriceResearchRequest
} from "@/lib/portfolio/pricing";
import type {
  PortfolioPriceSource,
  PortfolioTransaction
} from "@/lib/portfolio/types";
import { normalizeTierPart } from "@/lib/portfolio/valuation";

export const dynamic = "force-dynamic";

const POKETRACE_API_BASE = "https://api.poketrace.com/v1";
const REQUEST_TIMEOUT_MS = 10000;

type PokeTraceCard = {
  id?: string;
  name?: string;
  setName?: string;
  number?: string;
  cardNumber?: string;
  prices?: Record<string, Record<string, PokeTracePriceAggregate>>;
};

type PokeTracePriceAggregate = {
  avg?: number | null;
  low?: number | null;
  high?: number | null;
  saleCount?: number | null;
};

type PokeTraceSearchResponse = {
  data?: PokeTraceCard[];
};

type PokeTraceListingsResponse = {
  data?: {
    sourceItemId?: string;
    title?: string;
    price?: number;
    currency?: string;
    listingUrl?: string | null;
    grader?: string | null;
    grade?: string | null;
    condition?: string | null;
    soldAt?: string | null;
    anomalyReason?: string | null;
  }[];
};

type PokeTraceHistoryResponse = {
  data?: {
    source?: string;
    avg?: number | null;
    low?: number | null;
    high?: number | null;
    date?: string;
  }[];
};

export async function POST(request: Request) {
  let payload: PortfolioPriceResearchRequest;

  try {
    payload = (await request.json()) as PortfolioPriceResearchRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validationError = validateRequest(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const apiKey = process.env.POKETRACE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(buildFallbackPriceResearch(payload));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const card = await findPokeTraceCard(payload, apiKey, controller.signal);
    if (!card?.id) {
      return NextResponse.json({
        ...buildFallbackPriceResearch(payload),
        message:
          "No matching PokeTrace card found. Showing existing market fallback."
      });
    }

    const tier = researchTier(payload);
    const [listings, history] = await Promise.all([
      fetchPokeTraceListings(card.id, payload, apiKey, controller.signal).catch(
        () => []
      ),
      fetchPokeTraceHistory(card.id, tier, apiKey, controller.signal).catch(
        () => []
      )
    ]);
    const aggregate = aggregateSourceFromCard(card, tier);
    const sources = buildSources(listings, history, aggregate);

    return NextResponse.json(summarizePriceResearch(payload, sources));
  } catch (error) {
    return NextResponse.json({
      ...buildFallbackPriceResearch(payload),
      message:
        error instanceof Error
          ? `Price provider unavailable: ${error.message}`
          : "Price provider unavailable."
    });
  } finally {
    clearTimeout(timeout);
  }
}

function validateRequest(payload: PortfolioPriceResearchRequest) {
  if (!payload.name?.trim() || !payload.providerCardId?.trim()) {
    return "Card name and provider card ID are required.";
  }

  if (payload.ownershipType === "graded") {
    if (!payload.grader || !payload.grade?.trim()) {
      return "Graded cards need a grading company and grade.";
    }
  } else if (!payload.condition?.trim()) {
    return "Raw cards need a condition.";
  }

  return "";
}

async function findPokeTraceCard(
  request: PortfolioPriceResearchRequest,
  apiKey: string,
  signal: AbortSignal
) {
  const url = new URL(`${POKETRACE_API_BASE}/cards`);
  url.searchParams.set("search", request.name);
  url.searchParams.set("limit", "10");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`PokeTrace returned ${response.status}.`);
  }

  const payload = (await response.json()) as PokeTraceSearchResponse;
  const cards = payload.data ?? [];
  const normalizedSet = request.setName.trim().toLowerCase();
  const normalizedNumber = request.cardNumber.trim().toLowerCase();

  return (
    cards.find((card) => {
      const setName = card.setName?.trim().toLowerCase();
      const cardNumber = (card.cardNumber ?? card.number)?.trim().toLowerCase();
      return setName === normalizedSet && cardNumber === normalizedNumber;
    }) ?? cards[0]
  );
}

async function fetchPokeTraceListings(
  cardId: string,
  request: PortfolioPriceResearchRequest,
  apiKey: string,
  signal: AbortSignal
): Promise<PortfolioTransaction[]> {
  const url = new URL(`${POKETRACE_API_BASE}/cards/${cardId}/listings`);
  url.searchParams.set("limit", "5");
  url.searchParams.set("sort", "sold_at_desc");

  if (request.ownershipType === "graded") {
    url.searchParams.set("grader", request.grader ?? "");
    url.searchParams.set("grade", request.grade ?? "");
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`PokeTrace listings returned ${response.status}.`);
  }

  const payload = (await response.json()) as PokeTraceListingsResponse;
  return (payload.data ?? []).flatMap((listing) => {
    if (!listing.price || !listing.soldAt) {
      return [];
    }

    return [
      {
        id: listing.sourceItemId ?? `${listing.title}-${listing.soldAt}`,
        title: listing.title ?? "Sold listing",
        price: listing.price,
        currency: listing.currency ?? "USD",
        soldAt: listing.soldAt,
        url: listing.listingUrl ?? undefined,
        grader: listing.grader,
        grade: listing.grade,
        condition: listing.condition,
        anomalyReason: listing.anomalyReason
      }
    ];
  });
}

async function fetchPokeTraceHistory(
  cardId: string,
  tier: string,
  apiKey: string,
  signal: AbortSignal
): Promise<PortfolioPriceSource[]> {
  const url = new URL(`${POKETRACE_API_BASE}/cards/${cardId}/prices/${tier}/history`);
  url.searchParams.set("period", "30d");
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`PokeTrace history returned ${response.status}.`);
  }

  const payload = (await response.json()) as PokeTraceHistoryResponse;
  return (payload.data ?? []).flatMap((row) => {
    if (!row.source || typeof row.avg !== "number") {
      return [];
    }

    return [
      {
        source: sourceLabel(row.source),
        marketPrice: row.avg,
        currency: "USD",
        transactions: [],
        averageLastFive: null,
        lastUpdated: row.date
          ? new Date(row.date).toISOString()
          : new Date().toISOString(),
        message: "Historical aggregate row. Individual transactions unavailable."
      }
    ];
  });
}

function aggregateSourceFromCard(card: PokeTraceCard, tier: string) {
  const prices = card.prices ?? {};
  for (const [source, tiers] of Object.entries(prices)) {
    const aggregate = tiers[tier];
    if (aggregate && typeof aggregate.avg === "number") {
      return {
        source: sourceLabel(source),
        marketPrice: aggregate.avg,
        currency: "USD",
        transactions: [],
        averageLastFive: null,
        lastUpdated: new Date().toISOString(),
        message: `Current aggregate from ${sourceLabel(source)}.`
      } satisfies PortfolioPriceSource;
    }
  }

  return null;
}

function buildSources(
  listings: PortfolioTransaction[],
  history: PortfolioPriceSource[],
  aggregate: PortfolioPriceSource | null
) {
  const sources: PortfolioPriceSource[] = [];
  if (listings.length > 0) {
    sources.push({
      source: "eBay sold",
      marketPrice: null,
      currency: "USD",
      transactions: listings,
      averageLastFive: null,
      lastUpdated: listings[0]?.soldAt ?? new Date().toISOString()
    });
  }

  if (aggregate) {
    sources.push(aggregate);
  }

  sources.push(...history);
  return sources;
}

function researchTier(request: PortfolioPriceResearchRequest) {
  if (request.ownershipType === "graded") {
    return `${normalizeTierPart(request.grader ?? "GRADED")}_${normalizeTierPart(
      request.grade ?? "UNKNOWN"
    )}`;
  }

  return normalizeTierPart(request.condition ?? "RAW");
}

function sourceLabel(source: string) {
  return source
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
