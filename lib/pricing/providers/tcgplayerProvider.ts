import type { PriceProvider } from "../types";

export const tcgplayerProvider: PriceProvider = {
  name: "tcgplayer",
  async searchCards() {
    throw new Error(
      "Official TCGplayer API provider is not configured. Use official API credentials only; page scraping is intentionally not implemented."
    );
  }
};
