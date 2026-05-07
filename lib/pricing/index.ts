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
    const searchPage = await mockProvider.searchCards(filters);

    return {
      ...searchPage,
      provider: "mock",
      isFallback: false,
      message: "Using mock price data."
    };
  }

  try {
    const searchPage = await provider.searchCards(filters);

    return {
      ...searchPage,
      provider: provider.name,
      isFallback: false
    };
  } catch (error) {
    const fallbackPage = await mockProvider.searchCards(filters);
    const detail =
      error instanceof Error ? error.message : "Live price provider failed.";

    return {
      ...fallbackPage,
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
