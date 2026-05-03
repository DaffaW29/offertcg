import type {
  CardSearchFilters,
  CardSearchResult,
  PriceProvider,
  PriceVariant
} from "../types";

const POKEMON_TCG_CARDS_URL = "https://api.pokemontcg.io/v2/cards";
const REQUEST_TIMEOUT_MS = 10000;

const priceLabels: Record<string, string> = {
  normal: "Normal",
  holofoil: "Holofoil",
  reverseHolofoil: "Reverse Holofoil",
  "1stEditionHolofoil": "1st Edition Holofoil",
  "1stEditionNormal": "1st Edition Normal"
};

const priceOrder = [
  "normal",
  "holofoil",
  "reverseHolofoil",
  "1stEditionHolofoil",
  "1stEditionNormal"
];

type PokemonTcgPrice = {
  low?: number | null;
  mid?: number | null;
  high?: number | null;
  market?: number | null;
  directLow?: number | null;
};

type PokemonTcgCard = {
  id: string;
  name: string;
  set?: {
    name?: string;
    releaseDate?: string;
  };
  number?: string;
  rarity?: string;
  images?: {
    small?: string;
  };
  tcgplayer?: {
    url?: string;
    updatedAt?: string;
    prices?: Record<string, PokemonTcgPrice>;
  };
};

type PokemonTcgResponse = {
  data?: PokemonTcgCard[];
};

export const pokemonTcgProvider: PriceProvider = {
  name: "pokemon-tcg-api",
  async searchCards(filters: CardSearchFilters) {
    const url = buildSearchUrl(filters);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: buildHeaders(),
        signal: controller.signal,
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        throw new Error(
          `Pokemon TCG API returned ${response.status}${detail ? `: ${detail}` : ""}`
        );
      }

      const payload = (await response.json()) as PokemonTcgResponse;
      return (payload.data ?? []).map(mapPokemonCard);
    } finally {
      clearTimeout(timeout);
    }
  }
};

function buildSearchUrl(filters: CardSearchFilters) {
  const url = new URL(POKEMON_TCG_CARDS_URL);
  const queryParts = [`name:${quoteLucene(filters.query)}`];

  if (filters.setName) {
    queryParts.push(`set.name:${quoteLucene(filters.setName)}`);
  }

  if (filters.cardNumber) {
    queryParts.push(`number:${quoteLucene(filters.cardNumber)}`);
  }

  if (filters.rarity) {
    queryParts.push(`rarity:${quoteLucene(filters.rarity)}`);
  }

  url.searchParams.set("q", queryParts.join(" "));
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("orderBy", "-set.releaseDate,name,number");
  url.searchParams.set("select", "id,name,set,number,rarity,images,tcgplayer");

  return url;
}

function buildHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  const apiKey = process.env.POKEMON_TCG_API_KEY?.trim();
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }

  return headers;
}

function quoteLucene(value: string) {
  return `"${value.trim().replace(/(["\\])/g, "\\$1")}"`;
}

function mapPokemonCard(card: PokemonTcgCard): CardSearchResult {
  return {
    id: card.id,
    name: card.name,
    setName: card.set?.name ?? "Unknown set",
    cardNumber: card.number ?? "Unknown",
    rarity: card.rarity ?? "Unknown rarity",
    imageUrl: card.images?.small,
    externalUrl: card.tcgplayer?.url,
    variants: mapPriceVariants(card),
    priceSource: "pokemon-tcg-api",
    lastUpdated: normalizeDate(card.tcgplayer?.updatedAt)
  };
}

function mapPriceVariants(card: PokemonTcgCard): PriceVariant[] {
  const prices = card.tcgplayer?.prices ?? {};
  const entries = Object.entries(prices).sort(([left], [right]) => {
    return sortIndex(left) - sortIndex(right);
  });

  if (entries.length === 0) {
    return [
      {
        id: `${card.id}-unpriced`,
        label: "Market unavailable",
        marketPrice: null
      }
    ];
  }

  return entries.map(([key, value]) => ({
    id: `${card.id}-${key}`,
    label: priceLabels[key] ?? humanizePriceKey(key),
    marketPrice: asPrice(value.market),
    lowPrice: asPrice(value.low),
    midPrice: asPrice(value.mid),
    highPrice: asPrice(value.high)
  }));
}

function sortIndex(key: string) {
  const index = priceOrder.indexOf(key);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function asPrice(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function humanizePriceKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (first) => first.toUpperCase());
}

function normalizeDate(value?: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value.replace(/\//g, "-"));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

async function readErrorDetail(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 240);
  } catch {
    return "";
  }
}
