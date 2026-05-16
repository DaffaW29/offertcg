import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  averageLatestTransactions,
  estimatePortfolioWorth,
  portfolioItemTier
} from "./valuation.ts";
import {
  filterPublicPortfolioPins,
  haversineMiles
} from "./location.ts";
import type {
  PortfolioItem,
  PortfolioPriceSource,
  PublicPortfolioPin
} from "./types.ts";

const rawItem: PortfolioItem = {
  id: "item-raw",
  providerCardId: "sv3-125",
  variantId: "sv3-125-holofoil",
  variantLabel: "Holofoil",
  name: "Charizard ex",
  setName: "Obsidian Flames",
  cardNumber: "125/197",
  rarity: "Double Rare",
  imageUrl: "https://images.pokemontcg.io/sv3/125.png",
  externalUrl: "https://prices.pokemontcg.io/tcgplayer/sv3-125",
  ownershipType: "raw",
  condition: "Near Mint",
  quantity: 2,
  estimatedUnitValue: 12.5,
  priceUpdatedAt: "2026-05-01T00:00:00.000Z",
  isPublic: true,
  notes: ""
};

const gradedItem: PortfolioItem = {
  ...rawItem,
  id: "item-graded",
  ownershipType: "graded",
  grader: "BGS",
  grade: "9.5",
  certNumber: "private-cert",
  quantity: 1,
  estimatedUnitValue: 410
};

const ebaySource: PortfolioPriceSource = {
  source: "eBay sold",
  marketPrice: 400,
  currency: "USD",
  transactions: [
    { id: "old", title: "old comp", price: 300, currency: "USD", soldAt: "2026-01-01T00:00:00.000Z" },
    { id: "a", title: "a", price: 500, currency: "USD", soldAt: "2026-05-05T00:00:00.000Z" },
    { id: "b", title: "b", price: 450, currency: "USD", soldAt: "2026-05-04T00:00:00.000Z" },
    { id: "c", title: "c", price: 425, currency: "USD", soldAt: "2026-05-03T00:00:00.000Z" },
    { id: "d", title: "d", price: 475, currency: "USD", soldAt: "2026-05-02T00:00:00.000Z" },
    { id: "e", title: "e", price: 550, currency: "USD", soldAt: "2026-05-01T00:00:00.000Z" }
  ],
  averageLastFive: null,
  lastUpdated: "2026-05-06T00:00:00.000Z"
};

describe("portfolio valuation helpers", () => {
  it("uses raw condition tiers and graded slab tiers separately", () => {
    assert.equal(portfolioItemTier(rawItem), "NEAR_MINT");
    assert.equal(portfolioItemTier(gradedItem), "BGS_9_5");
  });

  it("averages the five most recent transactions only", () => {
    const average = averageLatestTransactions(ebaySource.transactions);

    assert.equal(average, 480);
  });

  it("values portfolio items from recent transaction averages before market fallback", () => {
    const worth = estimatePortfolioWorth([
      {
        item: rawItem,
        sources: [{ ...ebaySource, marketPrice: 20, transactions: [] }]
      },
      {
        item: gradedItem,
        sources: [ebaySource]
      }
    ]);

    assert.equal(worth.totalValue, 520);
    assert.equal(worth.incompleteCount, 0);
  });
});

describe("portfolio discovery helpers", () => {
  it("computes city centroid distances in miles", () => {
    const miles = haversineMiles(
      { latitude: 34.0522, longitude: -118.2437 },
      { latitude: 32.7157, longitude: -117.1611 }
    );

    assert.ok(miles > 110 && miles < 115);
  });

  it("filters public pins by distance and card query without exposing exact locations", () => {
    const pins: PublicPortfolioPin[] = [
      {
        userId: "public-la",
        displayName: "LA Collector",
        city: "Los Angeles",
        region: "CA",
        latitude: 34.0522,
        longitude: -118.2437,
        portfolioValue: 250,
        itemCount: 2,
        isPublic: true,
        cards: [rawItem]
      },
      {
        userId: "private-sd",
        displayName: "Private",
        city: "San Diego",
        region: "CA",
        latitude: 32.7157,
        longitude: -117.1611,
        portfolioValue: 500,
        itemCount: 1,
        isPublic: false,
        cards: [gradedItem]
      }
    ];

    const visible = filterPublicPortfolioPins(pins, {
      origin: { latitude: 34.0522, longitude: -118.2437 },
      maxDistanceMiles: 25,
      cardQuery: "charizard",
      sort: "distance"
    });

    assert.equal(visible.length, 1);
    assert.deepEqual(Object.keys(visible[0]).sort(), [
      "cards",
      "city",
      "displayName",
      "distanceMiles",
      "isPublic",
      "itemCount",
      "latitude",
      "longitude",
      "portfolioValue",
      "region",
      "userId"
    ]);
    assert.equal("certNumber" in visible[0].cards[0], false);
    assert.equal(visible[0].city, "Los Angeles");
  });
});
