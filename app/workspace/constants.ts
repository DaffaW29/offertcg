import {
  DEFAULT_SEARCH_PAGE,
  SEARCH_PAGE_SIZE
} from "@/lib/pricing/types";
import type {
  LotHistoryFilter,
  LotHistorySort,
  SearchPagination
} from "./types";

export const QUICK_PERCENTAGES = [70, 75, 80, 85, 90, 95, 100];
export const STORAGE_KEY = "offertcg-current-deal-v1";
export const RECENT_BUYS_STORAGE_KEY = "offertcg-recent-buys-v1";
export const PORTFOLIO_PROFILE_STORAGE_KEY = "offertcg-portfolio-profile-v1";
export const PORTFOLIO_ITEMS_STORAGE_KEY = "offertcg-portfolio-items-v1";
export const DEFAULT_BUY_PERCENT = QUICK_PERCENTAGES[0];
export const MAX_LOT_LABEL_LENGTH = 80;
export const MAX_DISPLAY_NAME_LENGTH = 48;

export const EMPTY_SEARCH_PAGINATION: SearchPagination = {
  page: DEFAULT_SEARCH_PAGE,
  pageSize: SEARCH_PAGE_SIZE,
  count: 0,
  totalCount: 0
};

export const LOT_HISTORY_FILTER_OPTIONS: {
  label: string;
  value: LotHistoryFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Fully sold", value: "sold" },
  { label: "Profitable", value: "profitable" },
  { label: "At loss", value: "loss" }
];

export const LOT_HISTORY_SORT_OPTIONS: {
  label: string;
  value: LotHistorySort;
}[] = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Profit", value: "profit" },
  { label: "ROI", value: "roi" },
  { label: "Remaining cards", value: "remaining" },
  { label: "Buy cost", value: "buy-cost" }
];

export const LANDING_CARDS = [
  {
    id: "sv3-125",
    name: "Charizard ex",
    meta: "Obsidian Flames",
    imageUrl: "https://images.pokemontcg.io/sv3/125.png"
  },
  {
    id: "sv3pt5-25",
    name: "Pikachu",
    meta: "Scarlet & Violet 151",
    imageUrl: "https://images.pokemontcg.io/sv3pt5/25.png"
  },
  {
    id: "swsh7-215",
    name: "Umbreon VMAX",
    meta: "Evolving Skies",
    imageUrl: "https://images.pokemontcg.io/swsh7/215.png"
  },
  {
    id: "sv4-248",
    name: "Iron Hands ex",
    meta: "Paradox Rift",
    imageUrl: "https://images.pokemontcg.io/sv4/248.png"
  },
  {
    id: "swsh8-271",
    name: "Gengar VMAX",
    meta: "Fusion Strike",
    imageUrl: "https://images.pokemontcg.io/swsh8/271.png"
  },
  {
    id: "swsh12-186",
    name: "Lugia V",
    meta: "Silver Tempest",
    imageUrl: "https://images.pokemontcg.io/swsh12/186.png"
  },
  {
    id: "swsh11-186",
    name: "Giratina V",
    meta: "Lost Origin",
    imageUrl: "https://images.pokemontcg.io/swsh11/186.png"
  },
  {
    id: "swsh7-218",
    name: "Rayquaza VMAX",
    meta: "Evolving Skies",
    imageUrl: "https://images.pokemontcg.io/swsh7/218.png"
  },
  {
    id: "sv3pt5-199",
    name: "Charizard ex",
    meta: "Pokemon 151",
    imageUrl: "https://images.pokemontcg.io/sv3pt5/199.png"
  },
  {
    id: "sv3pt5-200",
    name: "Blastoise ex",
    meta: "Pokemon 151",
    imageUrl: "https://images.pokemontcg.io/sv3pt5/200.png"
  },
  {
    id: "sv3pt5-198",
    name: "Venusaur ex",
    meta: "Pokemon 151",
    imageUrl: "https://images.pokemontcg.io/sv3pt5/198.png"
  },
  {
    id: "sv2-203",
    name: "Magikarp",
    meta: "Paldea Evolved",
    imageUrl: "https://images.pokemontcg.io/sv2/203.png"
  },
  {
    id: "sv6-214",
    name: "Greninja ex",
    meta: "Twilight Masquerade",
    imageUrl: "https://images.pokemontcg.io/sv6/214.png"
  },
  {
    id: "base1-4",
    name: "Charizard",
    meta: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/4.png"
  },
  {
    id: "base1-2",
    name: "Blastoise",
    meta: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/2.png"
  },
  {
    id: "base1-15",
    name: "Venusaur",
    meta: "Base Set",
    imageUrl: "https://images.pokemontcg.io/base1/15.png"
  }
] as const;

export type LandingCardItem = (typeof LANDING_CARDS)[number];
