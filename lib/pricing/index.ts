import "server-only";

import { mockProvider } from "./providers/mockProvider";
import { pokemonTcgProvider } from "./providers/pokemonTcgProvider";
import { tcgplayerProvider } from "./providers/tcgplayerProvider";
import type {
  CardSearchFilters,
  PriceProvider,
  ProviderSearchResponse
} from "./types";

export async function searchCardsWithFallback(
  filters: CardSearchFilters
): Promise<ProviderSearchResponse> {
  const provider = getConfiguredProvider();

  if (provider.name === "mock") {
    return {
      cards: await mockProvider.searchCards(filters),
      provider: "mock",
      isFallback: false,
      message: "Using mock price data."
    };
  }

  try {
    return {
      cards: await provider.searchCards(filters),
      provider: provider.name,
      isFallback: false
    };
  } catch (error) {
    const fallbackCards = await mockProvider.searchCards(filters);
    const detail =
      error instanceof Error ? error.message : "Live price provider failed.";

    return {
      cards: fallbackCards,
      provider: "mock",
      isFallback: true,
      message: `${provider.name} unavailable. Showing mock data until a supported live provider is available. ${detail}`
    };
  }
}

function getConfiguredProvider(): PriceProvider {
  const provider = process.env.PRICE_PROVIDER?.trim().toLowerCase();

  if (provider === "mock") {
    return mockProvider;
  }

  if (provider === "tcgplayer") {
    return tcgplayerProvider;
  }

  return pokemonTcgProvider;
}
