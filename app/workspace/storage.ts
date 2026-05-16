import type { DealLot } from "@/lib/deals";
import type { PortfolioItem } from "@/lib/portfolio/types";
import {
  defaultPortfolioProfile,
  type PortfolioProfile
} from "@/lib/supabase/portfolio";
import {
  PORTFOLIO_ITEMS_STORAGE_KEY,
  PORTFOLIO_PROFILE_STORAGE_KEY,
  RECENT_BUYS_STORAGE_KEY,
  STORAGE_KEY
} from "./constants";
import type { StoredDeal } from "./types";

// Local persistence is the offline fallback; authenticated users migrate these keys into cloud sync once.
export function readStoredDeal(): StoredDeal {
  const rawDeal = window.localStorage.getItem(STORAGE_KEY);
  if (!rawDeal) {
    return {};
  }

  try {
    return JSON.parse(rawDeal) as StoredDeal;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

export function readStoredRecentBuys(): DealLot[] {
  const rawRecentBuys = window.localStorage.getItem(RECENT_BUYS_STORAGE_KEY);
  if (!rawRecentBuys) {
    return [];
  }

  try {
    const parsedRecentBuys = JSON.parse(rawRecentBuys) as unknown;
    return Array.isArray(parsedRecentBuys)
      ? (parsedRecentBuys as DealLot[])
      : [];
  } catch {
    window.localStorage.removeItem(RECENT_BUYS_STORAGE_KEY);
    return [];
  }
}

export function readStoredPortfolioProfile(): PortfolioProfile {
  const rawProfile = window.localStorage.getItem(PORTFOLIO_PROFILE_STORAGE_KEY);
  if (!rawProfile) {
    return defaultPortfolioProfile();
  }

  try {
    const parsedProfile = JSON.parse(rawProfile) as PortfolioProfile;
    return {
      ...defaultPortfolioProfile(),
      ...parsedProfile,
      autoMirrorDealItems: parsedProfile.autoMirrorDealItems ?? false,
      location: parsedProfile.location ?? null
    };
  } catch {
    window.localStorage.removeItem(PORTFOLIO_PROFILE_STORAGE_KEY);
    return defaultPortfolioProfile();
  }
}

export function readStoredPortfolioItems(): PortfolioItem[] {
  const rawPortfolioItems = window.localStorage.getItem(
    PORTFOLIO_ITEMS_STORAGE_KEY
  );
  if (!rawPortfolioItems) {
    return [];
  }

  try {
    const parsedItems = JSON.parse(rawPortfolioItems) as unknown;
    return Array.isArray(parsedItems) ? (parsedItems as PortfolioItem[]) : [];
  } catch {
    window.localStorage.removeItem(PORTFOLIO_ITEMS_STORAGE_KEY);
    return [];
  }
}

export function clearLocalDealStorage() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(RECENT_BUYS_STORAGE_KEY);
}

export function clearLocalPortfolioStorage() {
  window.localStorage.removeItem(PORTFOLIO_PROFILE_STORAGE_KEY);
  window.localStorage.removeItem(PORTFOLIO_ITEMS_STORAGE_KEY);
}
