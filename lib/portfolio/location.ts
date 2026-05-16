import type {
  PublicPortfolioCard,
  PublicPortfolioFilters,
  PublicPortfolioPin,
  PublicPortfolioResult
} from "./types";

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) {
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const deltaLat = toRadians(destination.latitude - origin.latitude);
  const deltaLon = toRadians(destination.longitude - origin.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_MILES * c * 10) / 10;
}

export function filterPublicPortfolioPins(
  pins: PublicPortfolioPin[],
  filters: PublicPortfolioFilters
): PublicPortfolioResult[] {
  const query = filters.cardQuery.trim().toLowerCase();

  return pins
    .filter((pin) => pin.isPublic)
    .map((pin) => ({
      ...pin,
      cards: sanitizePublicCards(pin.cards),
      distanceMiles: filters.origin
        ? haversineMiles(filters.origin, pin)
        : Number.POSITIVE_INFINITY
    }))
    .filter((pin) => {
      if (
        typeof filters.maxDistanceMiles === "number" &&
        Number.isFinite(filters.maxDistanceMiles) &&
        pin.distanceMiles > filters.maxDistanceMiles
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return pin.cards.some((card) =>
        [
          card.name,
          card.setName,
          card.cardNumber,
          card.variantLabel,
          card.condition,
          card.grader,
          card.grade
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    })
    .toSorted((left, right) => {
      if (filters.sort === "value") {
        return right.portfolioValue - left.portfolioValue;
      }

      if (filters.sort === "cards") {
        return right.itemCount - left.itemCount;
      }

      if (filters.sort === "updated") {
        return latestCardTimestamp(right.cards) - latestCardTimestamp(left.cards);
      }

      return left.distanceMiles - right.distanceMiles;
    });
}

export function sanitizePublicCards(cards: PublicPortfolioCard[]) {
  return cards
    .filter((card) => card.isPublic)
    .map((card) => ({
      id: card.id,
      providerCardId: card.providerCardId,
      variantId: card.variantId,
      variantLabel: card.variantLabel,
      name: card.name,
      setName: card.setName,
      cardNumber: card.cardNumber,
      rarity: card.rarity,
      imageUrl: card.imageUrl,
      externalUrl: card.externalUrl,
      ownershipType: card.ownershipType,
      condition: card.condition,
      grader: card.grader,
      grade: card.grade,
      quantity: card.quantity,
      estimatedUnitValue: card.estimatedUnitValue,
      priceUpdatedAt: card.priceUpdatedAt,
      priceSources: card.priceSources,
      isPublic: card.isPublic
    }));
}

function latestCardTimestamp(cards: PublicPortfolioCard[]) {
  return cards.reduce((latest, card) => {
    const timestamp = new Date(card.priceUpdatedAt).getTime();
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, 0);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
