import {
  DEFAULT_SEARCH_PAGE,
  MAX_SEARCH_PAGE_SIZE,
  SEARCH_PAGE_SIZE,
  type CardSearchFilters,
  type CardSearchResult,
  type PriceProvider
} from "../types";

const mockUpdatedAt = "2026-05-03T00:00:00.000Z";

const mockCards: CardSearchResult[] = [
  {
    id: "mock-charizard-obsidian-125",
    name: "Charizard ex",
    setName: "Obsidian Flames",
    cardNumber: "125/197",
    rarity: "Double Rare",
    imageUrl: "https://images.pokemontcg.io/sv3/125.png",
    externalUrl: "https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=Charizard%20ex%20Obsidian%20Flames",
    variants: [
      {
        id: "mock-charizard-obsidian-125-normal",
        label: "Normal",
        marketPrice: 11.72,
        lowPrice: 9.95,
        midPrice: 12.58,
        highPrice: 18.99
      },
      {
        id: "mock-charizard-obsidian-125-holofoil",
        label: "Holofoil",
        marketPrice: 13.4,
        lowPrice: 11.2,
        midPrice: 14.25,
        highPrice: 21.5
      }
    ],
    priceSource: "mock",
    lastUpdated: mockUpdatedAt
  },
  {
    id: "mock-pikachu-151-025",
    name: "Pikachu",
    setName: "Scarlet & Violet 151",
    cardNumber: "025/165",
    rarity: "Common",
    imageUrl: "https://images.pokemontcg.io/sv3pt5/25.png",
    externalUrl: "https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=Pikachu%20151",
    variants: [
      {
        id: "mock-pikachu-151-025-normal",
        label: "Normal",
        marketPrice: 0.26,
        lowPrice: 0.12,
        midPrice: 0.3,
        highPrice: 1.2
      },
      {
        id: "mock-pikachu-151-025-reverse",
        label: "Reverse Holofoil",
        marketPrice: 1.18,
        lowPrice: 0.75,
        midPrice: 1.35,
        highPrice: 3.0
      }
    ],
    priceSource: "mock",
    lastUpdated: mockUpdatedAt
  },
  {
    id: "mock-umbreon-evolving-215",
    name: "Umbreon VMAX",
    setName: "Evolving Skies",
    cardNumber: "215/203",
    rarity: "Secret Rare",
    imageUrl: "https://images.pokemontcg.io/swsh7/215.png",
    externalUrl: "https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=Umbreon%20VMAX%20215",
    variants: [
      {
        id: "mock-umbreon-evolving-215-holofoil",
        label: "Holofoil",
        marketPrice: 1265.0,
        lowPrice: 1190.0,
        midPrice: 1325.0,
        highPrice: 1500.0
      }
    ],
    priceSource: "mock",
    lastUpdated: mockUpdatedAt
  },
  {
    id: "mock-iron-hands-paradox-248",
    name: "Iron Hands ex",
    setName: "Paradox Rift",
    cardNumber: "248/182",
    rarity: "Special Illustration Rare",
    imageUrl: "https://images.pokemontcg.io/sv4/248.png",
    externalUrl: "https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=Iron%20Hands%20ex%20248",
    variants: [
      {
        id: "mock-iron-hands-paradox-248-holofoil",
        label: "Holofoil",
        marketPrice: 22.35,
        lowPrice: 19.5,
        midPrice: 24.0,
        highPrice: 33.5
      }
    ],
    priceSource: "mock",
    lastUpdated: mockUpdatedAt
  }
];

export const mockProvider: PriceProvider = {
  name: "mock",
  async searchCards(filters: CardSearchFilters) {
    const query = normalize(filters.query);
    const setName = normalize(filters.setName);
    const cardNumber = normalize(filters.cardNumber);
    const rarity = normalize(filters.rarity);
    const page = normalizedPage(filters.page);
    const pageSize = normalizedPageSize(filters.pageSize);

    const filteredCards = mockCards.filter((card) => {
      const matchesQuery =
        normalize(card.name).includes(query) ||
        normalize(card.setName).includes(query) ||
        normalize(card.cardNumber).includes(query);

      const matchesSet = setName
        ? normalize(card.setName).includes(setName)
        : true;
      const matchesNumber = cardNumber
        ? normalize(card.cardNumber).includes(cardNumber)
        : true;
      const matchesRarity = rarity
        ? normalize(card.rarity).includes(rarity)
        : true;

      return matchesQuery && matchesSet && matchesNumber && matchesRarity;
    });
    const start = (page - 1) * pageSize;
    const cards = filteredCards.slice(start, start + pageSize);

    return {
      cards,
      page,
      pageSize,
      count: cards.length,
      totalCount: filteredCards.length
    };
  }
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizedPage(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_SEARCH_PAGE;
  }

  return Math.max(DEFAULT_SEARCH_PAGE, Math.floor(value));
}

function normalizedPageSize(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return SEARCH_PAGE_SIZE;
  }

  return Math.min(MAX_SEARCH_PAGE_SIZE, Math.max(1, Math.floor(value)));
}
