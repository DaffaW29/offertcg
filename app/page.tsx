"use client";

import type { Session } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  effectiveMarketPrice,
  lotTotals,
  roundCurrency,
  suggestedBuyPrice,
  totalPayout,
  type CardCondition,
  type DealItem,
  type DealLot
} from "@/lib/deals";
import type {
  CityLocation,
  PortfolioItem,
  PortfolioOwnershipType,
  PortfolioPriceSource,
  PublicPortfolioPin
} from "@/lib/portfolio/types";
import { estimatePortfolioWorth } from "@/lib/portfolio/valuation";
import type { PortfolioPriceResearchResponse } from "@/lib/portfolio/pricing";
import {
  DEFAULT_SEARCH_PAGE,
  type CardSearchResult,
  type ProviderSearchResponse
} from "@/lib/pricing/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteCloudLot,
  loadCloudDealState,
  loadCloudLots,
  renameCloudLot,
  saveCloudDealState,
  saveCloudLot,
  saveCloudLots,
  saveCloudSale
} from "@/lib/supabase/deals";
import {
  defaultPortfolioProfile,
  deleteCloudPortfolioItem,
  loadCloudPortfolioItems,
  loadCloudPortfolioProfile,
  loadPublicPortfolioPins,
  saveCloudPortfolioItem,
  saveCloudPortfolioProfile,
  type PortfolioProfile
} from "@/lib/supabase/portfolio";
import {
  deriveCurrentDealTotals,
  deriveInventoryRows,
  deriveLotPerformance,
  deriveMonthlyProfit,
  derivePortfolioSummary,
  getHistorySelectedLot,
  getMaxMonthlyProfit,
  getVisibleLots
} from "./workspace/analytics";
import { AppHeader } from "./workspace/components/app-header";
import { AnalyticsView } from "./workspace/components/analytics-view";
import { CurrentDealView } from "./workspace/components/current-deal-view";
import { InventoryView } from "./workspace/components/inventory-view";
import { NearbyView } from "./workspace/components/nearby-view";
import {
  LandingHero,
  landingCardsForOffset
} from "./workspace/components/landing-hero";
import { PortfolioView } from "./workspace/components/portfolio-view";
import { RecentBuysView } from "./workspace/components/recent-buys-view";
import { WorkspaceTabs } from "./workspace/components/workspace-tabs";
import {
  DEFAULT_BUY_PERCENT,
  EMPTY_SEARCH_PAGINATION,
  LANDING_CARDS,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_LOT_LABEL_LENGTH,
  PORTFOLIO_ITEMS_STORAGE_KEY,
  PORTFOLIO_PROFILE_STORAGE_KEY,
  RECENT_BUYS_STORAGE_KEY,
  STORAGE_KEY
} from "./workspace/constants";
import {
  clampPercent,
  createDealLotItem,
  createId,
  isValidPercent,
  saleDraftKey
} from "./workspace/deal-helpers";
import {
  escapeCsvValue,
  formatLotLabel,
  sourceLabel
} from "./workspace/formatters";
import {
  appendOptionalParam,
  getSelectedVariant,
  sortCardsByMarketAvailability,
  toSearchFilters
} from "./workspace/search";
import {
  clearLocalPortfolioStorage,
  clearLocalDealStorage,
  readStoredDeal,
  readStoredPortfolioItems,
  readStoredPortfolioProfile,
  readStoredRecentBuys
} from "./workspace/storage";
import type {
  ActiveTab,
  ApiErrorResponse,
  AuthMode,
  CitySearchResponse,
  InventoryMode,
  InventorySort,
  LotHistoryFilter,
  LotHistorySort,
  NearbySort,
  SaleDraft,
  SearchFilters
} from "./workspace/types";

export default function Home() {
  const supabaseClient = useMemo(() => getSupabaseBrowserClient(), []);
  const [visibleLandingOffset, setVisibleLandingOffset] = useState(0);
  const [previousLandingOffset, setPreviousLandingOffset] = useState<
    number | null
  >(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [hasCloudDataLoaded, setHasCloudDataLoaded] = useState(false);
  const [cloudMessage, setCloudMessage] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("current");
  const [query, setQuery] = useState("");
  const [setName, setSetName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [rarity, setRarity] = useState("");
  const [addCondition, setAddCondition] =
    useState<CardCondition>("Near Mint");
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [activeSearch, setActiveSearch] = useState<SearchFilters | null>(null);
  const [pagination, setPagination] = useState(EMPTY_SEARCH_PAGINATION);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [searchError, setSearchError] = useState("");
  const [providerNotice, setProviderNotice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<DealItem[]>([]);
  const [recentBuys, setRecentBuys] = useState<DealLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [saleDrafts, setSaleDrafts] = useState<Record<string, SaleDraft>>({});
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [lotNameDraft, setLotNameDraft] = useState("");
  const [lotRenameError, setLotRenameError] = useState("");
  const [isRenamingLot, setIsRenamingLot] = useState(false);
  const [lotHistoryQuery, setLotHistoryQuery] = useState("");
  const [lotHistoryFilter, setLotHistoryFilter] =
    useState<LotHistoryFilter>("all");
  const [lotHistorySort, setLotHistorySort] =
    useState<LotHistorySort>("newest");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>("unsold");
  const [inventorySort, setInventorySort] = useState<InventorySort>("value");
  const [portfolioProfile, setPortfolioProfile] = useState<PortfolioProfile>(
    defaultPortfolioProfile()
  );
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioMessage, setPortfolioMessage] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityLocation[]>([]);
  const [cityMessage, setCityMessage] = useState("");
  const [isCitySearching, setIsCitySearching] = useState(false);
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState("");
  const [portfolioSearchSetName, setPortfolioSearchSetName] = useState("");
  const [portfolioSearchCardNumber, setPortfolioSearchCardNumber] = useState("");
  const [portfolioSearchResults, setPortfolioSearchResults] = useState<
    CardSearchResult[]
  >([]);
  const [portfolioSearchError, setPortfolioSearchError] = useState("");
  const [portfolioProviderNotice, setPortfolioProviderNotice] = useState("");
  const [hasPortfolioSearched, setHasPortfolioSearched] = useState(false);
  const [isPortfolioSearching, setIsPortfolioSearching] = useState(false);
  const [portfolioSearchPagination, setPortfolioSearchPagination] = useState(
    EMPTY_SEARCH_PAGINATION
  );
  const [portfolioSelectedVariants, setPortfolioSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [portfolioOwnershipType, setPortfolioOwnershipType] =
    useState<PortfolioOwnershipType>("raw");
  const [portfolioAddCondition, setPortfolioAddCondition] =
    useState<CardCondition>("Near Mint");
  const [portfolioAddGrader, setPortfolioAddGrader] =
    useState<NonNullable<PortfolioItem["grader"]>>("PSA");
  const [portfolioAddGrade, setPortfolioAddGrade] = useState("10");
  const [portfolioAddQuantity, setPortfolioAddQuantity] = useState("1");
  const [portfolioAddCertNumber, setPortfolioAddCertNumber] = useState("");
  const [portfolioAddNotes, setPortfolioAddNotes] = useState("");
  const [portfolioAddItemPublic, setPortfolioAddItemPublic] = useState(true);
  const [refreshingPortfolioItemId, setRefreshingPortfolioItemId] = useState("");
  const [publicPortfolioPins, setPublicPortfolioPins] = useState<
    PublicPortfolioPin[]
  >([]);
  const [nearbyMessage, setNearbyMessage] = useState("");
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [nearbyCardQuery, setNearbyCardQuery] = useState("");
  const [nearbyMaxDistance, setNearbyMaxDistance] = useState("50");
  const [nearbySort, setNearbySort] = useState<NearbySort>("distance");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [globalBuyPercent, setGlobalBuyPercent] =
    useState(DEFAULT_BUY_PERCENT);
  const [pushNoMarketCardsDown, setPushNoMarketCardsDown] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const workspaceRef = useRef<HTMLElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const landingOffsetRef = useRef(0);
  const landingTransitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (prefersReducedMotion.matches) {
      return;
    }

    const interval = window.setInterval(() => {
      const current = landingOffsetRef.current;
      const next = (current + 4) % LANDING_CARDS.length;

      landingOffsetRef.current = next;
      setPreviousLandingOffset(current);
      setVisibleLandingOffset(next);

      window.clearTimeout(landingTransitionTimeoutRef.current ?? undefined);
      landingTransitionTimeoutRef.current = window.setTimeout(() => {
        setPreviousLandingOffset(null);
      }, 900);
    }, 4800);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(landingTransitionTimeoutRef.current ?? undefined);
    };
  }, []);

  useEffect(() => {
    if (!supabaseClient) {
      const frame = window.requestAnimationFrame(() => {
        setIsAuthReady(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    let isMounted = true;

    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthMessage(error.message);
      }

      setSession(data.session);
      setIsAuthReady(true);
    });

    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setHasCloudDataLoaded(false);
      if (!nextSession) {
        setCloudMessage("");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  useEffect(() => {
    const storedDeal = readStoredDeal();
    const storedRecentBuys = readStoredRecentBuys();
    const storedPortfolioProfile = readStoredPortfolioProfile();
    const storedPortfolioItems = readStoredPortfolioItems();

    const frame = window.requestAnimationFrame(() => {
      if (Array.isArray(storedDeal.cart)) {
        setCart(storedDeal.cart);
      }
      setRecentBuys(storedRecentBuys);
      setSelectedLotId(storedRecentBuys[0]?.id ?? null);
      setPortfolioProfile(storedPortfolioProfile);
      setCityQuery(storedPortfolioProfile.location?.placeName ?? "");
      setPortfolioItems(storedPortfolioItems);
      if (isValidPercent(storedDeal.globalBuyPercent)) {
        setGlobalBuyPercent(storedDeal.globalBuyPercent);
      }
      if (typeof storedDeal.pushNoMarketCardsDown === "boolean") {
        setPushNoMarketCardsDown(storedDeal.pushNoMarketCardsDown);
      }
      setHasHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasHydrated || session) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cart, globalBuyPercent, pushNoMarketCardsDown })
    );
  }, [cart, globalBuyPercent, hasHydrated, pushNoMarketCardsDown, session]);

  useEffect(() => {
    if (!hasHydrated || !session) {
      return;
    }

    const storedDeal = readStoredDeal();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...storedDeal, pushNoMarketCardsDown })
    );
  }, [hasCloudDataLoaded, hasHydrated, pushNoMarketCardsDown, session]);

  useEffect(() => {
    if (!hasHydrated || session) {
      return;
    }

    window.localStorage.setItem(
      RECENT_BUYS_STORAGE_KEY,
      JSON.stringify(recentBuys)
    );
  }, [recentBuys, hasHydrated, session]);

  useEffect(() => {
    if (!hasHydrated || session) {
      return;
    }

    window.localStorage.setItem(
      PORTFOLIO_PROFILE_STORAGE_KEY,
      JSON.stringify(portfolioProfile)
    );
  }, [hasHydrated, portfolioProfile, session]);

  useEffect(() => {
    if (!hasHydrated || session) {
      return;
    }

    window.localStorage.setItem(
      PORTFOLIO_ITEMS_STORAGE_KEY,
      JSON.stringify(portfolioItems)
    );
  }, [hasHydrated, portfolioItems, session]);

  useEffect(() => {
    if (!supabaseClient || !session || !hasHydrated || hasCloudDataLoaded) {
      return;
    }

    let isCancelled = false;

    async function loadAccountData() {
      if (!supabaseClient || !session) {
        return;
      }

      setIsCloudLoading(true);
      setCloudMessage("Loading cloud data...");

      try {
        let cloudDeal = await loadCloudDealState(
          supabaseClient,
          session.user.id,
          DEFAULT_BUY_PERCENT
        );
        let cloudLots = await loadCloudLots(supabaseClient, session.user.id);
        let cloudPortfolioProfile = await loadCloudPortfolioProfile(
          supabaseClient,
          session.user.id
        );
        let cloudPortfolioItems = await loadCloudPortfolioItems(
          supabaseClient,
          session.user.id
        );

        if (!cloudDeal.importedLocalData) {
          const localDeal = readStoredDeal();
          const localLots = readStoredRecentBuys();
          const localPortfolioProfile = readStoredPortfolioProfile();
          const localPortfolioItems = readStoredPortfolioItems();
          const shouldImportCart =
            Array.isArray(localDeal.cart) &&
            localDeal.cart.length > 0 &&
            cloudDeal.cart.length === 0;
          const shouldImportLots = localLots.length > 0;
          const shouldImportPortfolio = localPortfolioItems.length > 0;
          const shouldImportProfile =
            localPortfolioProfile.location !== null ||
            localPortfolioProfile.displayName !== "Collector" ||
            localPortfolioProfile.portfolioPublic;

          if (shouldImportCart) {
            await saveCloudDealState(
              supabaseClient,
              session.user.id,
              localDeal.cart ?? [],
              isValidPercent(localDeal.globalBuyPercent)
                ? localDeal.globalBuyPercent
                : DEFAULT_BUY_PERCENT
            );
          } else {
            await saveCloudDealState(
              supabaseClient,
              session.user.id,
              cloudDeal.cart,
              cloudDeal.globalBuyPercent
            );
          }

          if (shouldImportLots) {
            await saveCloudLots(supabaseClient, session.user.id, localLots);
          }

          if (shouldImportProfile) {
            await saveCloudPortfolioProfile(
              supabaseClient,
              session.user.id,
              localPortfolioProfile
            );
          }

          if (shouldImportPortfolio) {
            for (const item of localPortfolioItems) {
              await saveCloudPortfolioItem(supabaseClient, session.user.id, item);
            }
          }

          clearLocalDealStorage();
          clearLocalPortfolioStorage();
          cloudDeal = await loadCloudDealState(
            supabaseClient,
            session.user.id,
            DEFAULT_BUY_PERCENT
          );
          cloudLots = await loadCloudLots(supabaseClient, session.user.id);
          cloudPortfolioProfile = await loadCloudPortfolioProfile(
            supabaseClient,
            session.user.id
          );
          cloudPortfolioItems = await loadCloudPortfolioItems(
            supabaseClient,
            session.user.id
          );

          setCloudMessage(
            shouldImportCart || shouldImportLots || shouldImportPortfolio
              ? "Imported local data and enabled cloud sync."
              : "Cloud sync enabled."
          );
        } else {
          setCloudMessage("Cloud sync active.");
        }

        if (isCancelled) {
          return;
        }

        setCart(cloudDeal.cart);
        setGlobalBuyPercent(
          isValidPercent(cloudDeal.globalBuyPercent)
            ? cloudDeal.globalBuyPercent
            : DEFAULT_BUY_PERCENT
        );
        setRecentBuys(cloudLots);
        setSelectedLotId(cloudLots[0]?.id ?? null);
        setPortfolioProfile(cloudPortfolioProfile);
        setCityQuery(cloudPortfolioProfile.location?.placeName ?? "");
        setPortfolioItems(cloudPortfolioItems);
        setHasCloudDataLoaded(true);
      } catch (error) {
        if (!isCancelled) {
          setCloudMessage(
            error instanceof Error
              ? `Cloud sync failed: ${error.message}`
              : "Cloud sync failed."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsCloudLoading(false);
        }
      }
    }

    void loadAccountData();

    return () => {
      isCancelled = true;
    };
  }, [supabaseClient, session, hasHydrated, hasCloudDataLoaded]);

  useEffect(() => {
    if (!supabaseClient || !session || !hasCloudDataLoaded || isCloudLoading) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveCloudDealState(
        supabaseClient,
        session.user.id,
        cart,
        globalBuyPercent
      ).catch((error: unknown) => {
        setCloudMessage(
          error instanceof Error
            ? `Unable to save current deal: ${error.message}`
            : "Unable to save current deal."
        );
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [
    cart,
    globalBuyPercent,
    hasCloudDataLoaded,
    isCloudLoading,
    session,
    supabaseClient
  ]);

  useEffect(() => {
    resultListRef.current?.scrollTo({ top: 0 });
  }, [results]);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        profilePopoverRef.current &&
        event.target instanceof Node &&
        !profilePopoverRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const visibleLandingCards = useMemo(() => {
    return landingCardsForOffset(visibleLandingOffset);
  }, [visibleLandingOffset]);
  const previousLandingCards = useMemo(() => {
    return previousLandingOffset === null
      ? null
      : landingCardsForOffset(previousLandingOffset);
  }, [previousLandingOffset]);

  const totals = useMemo(() => deriveCurrentDealTotals(cart), [cart]);
  const portfolioSummary = useMemo(
    () => derivePortfolioSummary(recentBuys),
    [recentBuys]
  );
  const lotPerformance = useMemo(
    () => deriveLotPerformance(recentBuys),
    [recentBuys]
  );
  const visibleLots = useMemo(
    () =>
      getVisibleLots(
        recentBuys,
        lotHistoryQuery,
        lotHistoryFilter,
        lotHistorySort
      ),
    [lotHistoryFilter, lotHistoryQuery, lotHistorySort, recentBuys]
  );
  const historySelectedLot = useMemo(() => {
    return getHistorySelectedLot(visibleLots, selectedLotId);
  }, [selectedLotId, visibleLots]);
  const historySelectedLotTotals = useMemo(() => {
    return historySelectedLot ? lotTotals(historySelectedLot) : null;
  }, [historySelectedLot]);
  const monthlyProfit = useMemo(
    () => deriveMonthlyProfit(recentBuys),
    [recentBuys]
  );
  const maxMonthlyProfit = useMemo(() => {
    return getMaxMonthlyProfit(monthlyProfit);
  }, [monthlyProfit]);
  const inventoryRows = useMemo(
    () =>
      deriveInventoryRows(
        recentBuys,
        inventoryQuery,
        inventoryMode,
        inventorySort
      ),
    [inventoryMode, inventoryQuery, inventorySort, recentBuys]
  );
  const portfolioWorth = useMemo(() => {
    return estimatePortfolioWorth(portfolioItems.map((item) => ({ item })));
  }, [portfolioItems]);
  const displayedResults = useMemo(() => {
    return pushNoMarketCardsDown ? sortCardsByMarketAvailability(results) : results;
  }, [pushNoMarketCardsDown, results]);
  const totalPages = Math.max(
    DEFAULT_SEARCH_PAGE,
    Math.ceil(pagination.totalCount / pagination.pageSize)
  );
  const hasPagedResults =
    hasSearched &&
    !searchError &&
    results.length > 0 &&
    pagination.totalCount > 0;
  const resultStart = hasPagedResults
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const resultEnd = hasPagedResults
    ? Math.min(resultStart + results.length - 1, pagination.totalCount)
    : 0;
  const canGoPrevious =
    hasPagedResults && pagination.page > DEFAULT_SEARCH_PAGE;
  const canGoNext = hasPagedResults && pagination.page < totalPages;

  async function submitAuth(mode: AuthMode) {
    if (!supabaseClient) {
      setAuthMessage("Add Supabase env vars to enable account sync.");
      return;
    }

    const email = authEmail.trim();
    if (!email || authPassword.length < 6) {
      setAuthMessage("Enter an email and a password with at least 6 characters.");
      return;
    }

    setIsAuthSubmitting(true);
    setAuthMessage("");

    const result =
      mode === "login"
        ? await supabaseClient.auth.signInWithPassword({
            email,
            password: authPassword
          })
        : await supabaseClient.auth.signUp({
            email,
            password: authPassword
          });

    setIsAuthSubmitting(false);

    if (result.error) {
      setAuthMessage(result.error.message);
      return;
    }

    setAuthPassword("");
    setAuthMessage(
      mode === "login"
        ? "Signed in. Loading cloud data..."
        : "Account created. Check your email if confirmation is enabled."
    );
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAuth("login");
  }

  async function signOut() {
    if (!supabaseClient) {
      return;
    }

    setIsAuthSubmitting(true);
    const { error } = await supabaseClient.auth.signOut();
    setIsAuthSubmitting(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setSession(null);
    setHasCloudDataLoaded(false);
    setCart([]);
    setRecentBuys([]);
    setPortfolioProfile(defaultPortfolioProfile());
    setPortfolioItems([]);
    setPublicPortfolioPins([]);
    setNearbyMessage("");
    setSelectedLotId(null);
    setGlobalBuyPercent(DEFAULT_BUY_PERCENT);
    setAuthMessage("Signed out. Local mode is active.");
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filters = toSearchFilters(query, setName, cardNumber, rarity);

    if (filters.query.length < 2) {
      setSearchError("Enter at least 2 characters to search.");
      return;
    }

    setActiveSearch(filters);
    await fetchSearchResults(filters, DEFAULT_SEARCH_PAGE);
  }

  async function fetchSearchResults(filters: SearchFilters, page: number) {
    setIsSearching(true);
    setSearchError("");
    setProviderNotice("");
    setHasSearched(true);

    const params = new URLSearchParams({
      q: filters.query,
      page: page.toString()
    });
    appendOptionalParam(params, "set", filters.setName);
    appendOptionalParam(params, "number", filters.cardNumber);
    appendOptionalParam(params, "rarity", filters.rarity);

    try {
      const response = await fetch(`/api/cards/search?${params.toString()}`);
      const payload = (await response.json()) as
        | ProviderSearchResponse
        | ApiErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Card search failed."
        );
      }

      const data = payload as ProviderSearchResponse;
      setResults(data.cards);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        count: data.count,
        totalCount: data.totalCount
      });
      setProviderNotice(data.message ?? "");
      setSelectedVariants((current) => {
        const next = { ...current };
        data.cards.forEach((card) => {
          if (!next[card.id] && card.variants[0]) {
            next[card.id] = card.variants[0].id;
          }
        });
        return next;
      });
    } catch (error) {
      setResults([]);
      setPagination(EMPTY_SEARCH_PAGINATION);
      setSearchError(
        error instanceof Error ? error.message : "Unable to search cards."
      );
    } finally {
      setIsSearching(false);
    }
  }

  function goToSearchPage(page: number) {
    if (!activeSearch || isSearching) {
      return;
    }

    void fetchSearchResults(
      activeSearch,
      Math.min(totalPages, Math.max(DEFAULT_SEARCH_PAGE, page))
    );
  }

  function addCardToCart(card: CardSearchResult) {
    const variant = getSelectedVariant(card, selectedVariants[card.id]);
    if (!variant) {
      return;
    }

    const id = `${card.id}|${variant.id}|${addCondition}`;
    const marketPrice = variant.marketPrice ?? 0;

    setCart((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          id,
          providerCardId: card.id,
          variantId: variant.id,
          variantLabel: variant.label,
          name: card.name,
          setName: card.setName,
          cardNumber: card.cardNumber,
          rarity: card.rarity,
          condition: addCondition,
          marketPrice,
          buyPercent: globalBuyPercent,
          quantity: 1,
          priceSource: card.priceSource,
          lastUpdated: card.lastUpdated,
          imageUrl: card.imageUrl,
          externalUrl: card.externalUrl,
          notes: "",
          marketPriceMissing: variant.marketPrice === null
        }
      ];
    });
  }

  function applyGlobalPercent(percent: number) {
    const nextPercent = clampPercent(percent);
    setGlobalBuyPercent(nextPercent);
    setCart((current) =>
      current.map((item) => ({ ...item, buyPercent: nextPercent }))
    );
  }

  function updateCartItem(id: string, updater: (item: DealItem) => DealItem) {
    setCart((current) =>
      current.map((item) => (item.id === id ? updater(item) : item))
    );
  }

  function removeCartItem(id: string) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  function checkoutCart() {
    if (cart.length === 0) {
      return;
    }

    const checkedOutAt = new Date().toISOString();
    const lot: DealLot = {
      id: createId("lot"),
      label: formatLotLabel(checkedOutAt),
      checkedOutAt,
      items: cart.map(createDealLotItem)
    };

    setRecentBuys((current) => [lot, ...current]);
    setSelectedLotId(lot.id);
    setCart([]);
    setActiveTab("recent");

    if (supabaseClient && session && hasCloudDataLoaded) {
      saveCloudLot(supabaseClient, session.user.id, lot).catch((error: unknown) => {
        setCloudMessage(
          error instanceof Error
            ? `Unable to save checked-out lot: ${error.message}`
            : "Unable to save checked-out lot."
        );
      });
    }
  }

  function updateSaleDraft(key: string, draft: SaleDraft) {
    setSaleDrafts((current) => ({
      ...current,
      [key]: draft
    }));
  }

  function markItemSold(lotId: string, itemId: string) {
    const key = saleDraftKey(lotId, itemId);
    const draft = saleDrafts[key];
    const quantity = Math.floor(Number(draft?.quantity));
    const saleTotal = roundCurrency(Number(draft?.saleTotal));

    if (
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      !Number.isFinite(saleTotal) ||
      saleTotal <= 0
    ) {
      return;
    }

    const lot = recentBuys.find((currentLot) => currentLot.id === lotId);
    const item = lot?.items.find((currentItem) => currentItem.id === itemId);
    if (!item) {
      return;
    }

    const soldQuantity = Math.min(quantity, item.quantity - item.soldQuantity);
    if (soldQuantity < 1) {
      return;
    }

    const soldAt = new Date().toISOString();
    const sale = {
      id: createId("sale"),
      soldAt,
      quantity: soldQuantity,
      saleTotal
    };
    const nextSoldQuantity = item.soldQuantity + soldQuantity;

    setRecentBuys((current) =>
      current.map((lot) => {
        if (lot.id !== lotId) {
          return lot;
        }

        return {
          ...lot,
          items: lot.items.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              soldQuantity: nextSoldQuantity,
              sales: [...item.sales, sale]
            };
          })
        };
      })
    );

    setSaleDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });

    if (supabaseClient && session && hasCloudDataLoaded) {
      saveCloudSale(
        supabaseClient,
        session.user.id,
        lotId,
        itemId,
        soldQuantity,
        nextSoldQuantity,
        sale
      ).catch((error: unknown) => {
        setCloudMessage(
          error instanceof Error
            ? `Unable to save sale: ${error.message}`
            : "Unable to save sale."
        );
      });
    }
  }

  function startRenamingLot(lot: DealLot) {
    setEditingLotId(lot.id);
    setLotNameDraft(lot.label);
    setLotRenameError("");
  }

  function cancelRenamingLot() {
    setEditingLotId(null);
    setLotNameDraft("");
    setLotRenameError("");
    setIsRenamingLot(false);
  }

  async function saveLotRename(
    event: FormEvent<HTMLFormElement>,
    lotId: string
  ) {
    event.preventDefault();

    const lot = recentBuys.find((currentLot) => currentLot.id === lotId);
    if (!lot) {
      cancelRenamingLot();
      return;
    }

    const nextLabel = lotNameDraft.trim();
    if (!nextLabel) {
      setLotRenameError("Enter a lot name.");
      return;
    }

    if (nextLabel.length > MAX_LOT_LABEL_LENGTH) {
      setLotRenameError(
        `Keep the lot name under ${MAX_LOT_LABEL_LENGTH} characters.`
      );
      return;
    }

    if (nextLabel === lot.label) {
      cancelRenamingLot();
      return;
    }

    if (supabaseClient && session) {
      if (!hasCloudDataLoaded) {
        setLotRenameError("Wait for cloud sync to finish before renaming.");
        return;
      }

      setIsRenamingLot(true);
      try {
        await renameCloudLot(supabaseClient, session.user.id, lotId, nextLabel);
        setCloudMessage("Renamed lot.");
      } catch (error) {
        setLotRenameError(
          error instanceof Error
            ? `Unable to rename lot: ${error.message}`
            : "Unable to rename lot."
        );
        setIsRenamingLot(false);
        return;
      }
    }

    setRecentBuys((current) =>
      current.map((lot) =>
        lot.id === lotId ? { ...lot, label: nextLabel } : lot
      )
    );
    cancelRenamingLot();
  }

  async function deleteLot(lotId: string) {
    const lot = recentBuys.find((currentLot) => currentLot.id === lotId);
    if (!lot) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${lot.label}?\n\nThis permanently removes the lot, its cards, sale records, inventory rows, and analytics history.`
    );
    if (!confirmed) {
      return;
    }

    if (supabaseClient && session && hasCloudDataLoaded) {
      try {
        await deleteCloudLot(supabaseClient, session.user.id, lotId);
        setCloudMessage("Deleted lot.");
      } catch (error) {
        setCloudMessage(
          error instanceof Error
            ? `Unable to delete lot: ${error.message}`
            : "Unable to delete lot."
        );
        return;
      }
    }

    const remainingLots = recentBuys.filter(
      (currentLot) => currentLot.id !== lotId
    );

    if (editingLotId === lotId) {
      cancelRenamingLot();
    }
    setRecentBuys(remainingLots);
    setSelectedLotId((currentLotId) =>
      currentLotId === lotId ? remainingLots[0]?.id ?? null : currentLotId
    );
    setSaleDrafts((current) => {
      const next = { ...current };
      const lotDraftPrefix = `${lotId}|`;
      Object.keys(next).forEach((key) => {
        if (key.startsWith(lotDraftPrefix)) {
          delete next[key];
        }
      });
      return next;
    });
  }

  function viewLot(lotId: string) {
    setLotHistoryQuery("");
    setLotHistoryFilter("all");
    setSelectedLotId(lotId);
    setActiveTab("recent");
  }

  async function handleCitySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = cityQuery.trim();
    if (query.length < 2) {
      setCityMessage("Enter at least 2 characters to search cities.");
      return;
    }

    setIsCitySearching(true);
    setCityMessage("");

    try {
      const response = await fetch(
        `/api/locations/city-search?q=${encodeURIComponent(query)}`
      );
      const payload = (await response.json()) as CitySearchResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "City search failed.");
      }

      setCityResults(payload.cities ?? []);
      setCityMessage(payload.message ?? "");
    } catch (error) {
      setCityResults([]);
      setCityMessage(
        error instanceof Error ? error.message : "Unable to search cities."
      );
    } finally {
      setIsCitySearching(false);
    }
  }

  function selectPortfolioCity(city: CityLocation) {
    setPortfolioProfile((current) => ({
      ...current,
      location: city
    }));
    setCityQuery(city.placeName);
    setCityResults([]);
    setCityMessage("");
  }

  function clearPortfolioCity() {
    setPortfolioProfile((current) => ({
      ...current,
      location: null,
      portfolioPublic: false
    }));
    setCityQuery("");
    setCityResults([]);
  }

  async function savePortfolioProfile() {
    const displayName = portfolioProfile.displayName.trim();
    if (!displayName) {
      setPortfolioMessage("Enter a display name.");
      return;
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      setPortfolioMessage(
        `Keep the display name under ${MAX_DISPLAY_NAME_LENGTH} characters.`
      );
      return;
    }

    if (portfolioProfile.portfolioPublic && !portfolioProfile.location) {
      setPortfolioMessage("Choose a city before revealing your portfolio.");
      return;
    }

    if (portfolioProfile.portfolioPublic && !session) {
      setPortfolioMessage("Sign in before revealing your portfolio.");
      setPortfolioProfile((current) => ({ ...current, portfolioPublic: false }));
      return;
    }

    const nextProfile = {
      ...portfolioProfile,
      displayName
    };
    setPortfolioProfile(nextProfile);

    if (supabaseClient && session && hasCloudDataLoaded) {
      try {
        await saveCloudPortfolioProfile(
          supabaseClient,
          session.user.id,
          nextProfile
        );
        setPortfolioMessage("Portfolio settings saved.");
      } catch (error) {
        setPortfolioMessage(
          error instanceof Error
            ? `Unable to save portfolio settings: ${error.message}`
            : "Unable to save portfolio settings."
        );
      }
      return;
    }

    setPortfolioMessage("Portfolio settings saved locally.");
  }

  async function handlePortfolioSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filters = toSearchFilters(
      portfolioSearchQuery,
      portfolioSearchSetName,
      portfolioSearchCardNumber,
      ""
    );

    if (filters.query.length < 2) {
      setPortfolioSearchError("Enter at least 2 characters to search.");
      return;
    }

    setIsPortfolioSearching(true);
    setPortfolioSearchError("");
    setPortfolioProviderNotice("");
    setHasPortfolioSearched(true);

    const params = new URLSearchParams({
      q: filters.query,
      page: DEFAULT_SEARCH_PAGE.toString()
    });
    appendOptionalParam(params, "set", filters.setName);
    appendOptionalParam(params, "number", filters.cardNumber);

    try {
      const response = await fetch(`/api/cards/search?${params.toString()}`);
      const payload = (await response.json()) as
        | ProviderSearchResponse
        | ApiErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Card search failed."
        );
      }

      const data = payload as ProviderSearchResponse;
      setPortfolioSearchResults(data.cards);
      setPortfolioSearchPagination({
        page: data.page,
        pageSize: data.pageSize,
        count: data.count,
        totalCount: data.totalCount
      });
      setPortfolioProviderNotice(data.message ?? "");
      setPortfolioSelectedVariants((current) => {
        const next = { ...current };
        data.cards.forEach((card) => {
          if (!next[card.id] && card.variants[0]) {
            next[card.id] = card.variants[0].id;
          }
        });
        return next;
      });
    } catch (error) {
      setPortfolioSearchResults([]);
      setPortfolioSearchPagination(EMPTY_SEARCH_PAGINATION);
      setPortfolioSearchError(
        error instanceof Error ? error.message : "Unable to search cards."
      );
    } finally {
      setIsPortfolioSearching(false);
    }
  }

  function addCardToPortfolio(card: CardSearchResult) {
    const variant = getSelectedVariant(card, portfolioSelectedVariants[card.id]);
    if (!variant) {
      return;
    }

    const quantity = Math.max(1, Math.floor(Number(portfolioAddQuantity)));
    const grade = portfolioAddGrade.trim();
    if (portfolioOwnershipType === "graded" && !grade) {
      setPortfolioMessage("Enter a grade for graded cards.");
      return;
    }

    const variantPrice = variant.marketPrice ?? 0;
    const now = new Date().toISOString();
    const tierKey =
      portfolioOwnershipType === "graded"
        ? `${portfolioAddGrader}-${grade}`
        : portfolioAddCondition;
    const id = `${card.id}|${variant.id}|${portfolioOwnershipType}|${tierKey}`;
    const priceSources: PortfolioPriceSource[] =
      variant.marketPrice === null
        ? []
        : [
            {
              source: sourceLabel(card.priceSource),
              marketPrice: variantPrice,
              currency: "USD",
              transactions: [],
              averageLastFive: null,
              lastUpdated: card.lastUpdated || now,
              message: "Current provider market price; refresh for recent comps."
            }
          ];

    const nextItem: PortfolioItem = {
      id,
      providerCardId: card.id,
      variantId: variant.id,
      variantLabel: variant.label,
      name: card.name,
      setName: card.setName,
      cardNumber: card.cardNumber,
      rarity: card.rarity,
      imageUrl: card.imageUrl,
      externalUrl: card.externalUrl,
      ownershipType: portfolioOwnershipType,
      condition:
        portfolioOwnershipType === "raw" ? portfolioAddCondition : undefined,
      grader:
        portfolioOwnershipType === "graded" ? portfolioAddGrader : undefined,
      grade: portfolioOwnershipType === "graded" ? grade : undefined,
      certNumber:
        portfolioOwnershipType === "graded"
          ? portfolioAddCertNumber.trim() || undefined
          : undefined,
      quantity,
      estimatedUnitValue: variantPrice,
      priceUpdatedAt: card.lastUpdated || now,
      priceSources,
      isPublic: portfolioAddItemPublic,
      notes: portfolioAddNotes.trim()
    };

    const existing = portfolioItems.find((item) => item.id === id);
    const itemToSave = existing
      ? {
          ...existing,
          quantity: existing.quantity + quantity,
          isPublic: portfolioAddItemPublic,
          notes: portfolioAddNotes.trim() || existing.notes
        }
      : nextItem;
    setPortfolioItems((current) =>
      existing
        ? current.map((item) => (item.id === id ? itemToSave : item))
        : [nextItem, ...current]
    );
    persistPortfolioItem(itemToSave);
    setPortfolioMessage("Added card to portfolio.");
  }

  function updatePortfolioItem(
    itemId: string,
    updater: (item: PortfolioItem) => PortfolioItem
  ) {
    let nextItem: PortfolioItem | null = null;
    setPortfolioItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        nextItem = updater(item);
        return nextItem;
      })
    );

    if (nextItem) {
      persistPortfolioItem(nextItem);
    }
  }

  function persistPortfolioItem(item: PortfolioItem) {
    if (supabaseClient && session && hasCloudDataLoaded) {
      saveCloudPortfolioItem(supabaseClient, session.user.id, item).catch(
        (error: unknown) => {
          setPortfolioMessage(
            error instanceof Error
              ? `Unable to save portfolio item: ${error.message}`
              : "Unable to save portfolio item."
          );
        }
      );
    }
  }

  async function deletePortfolioItem(itemId: string) {
    if (supabaseClient && session && hasCloudDataLoaded) {
      try {
        await deleteCloudPortfolioItem(supabaseClient, session.user.id, itemId);
      } catch (error) {
        setPortfolioMessage(
          error instanceof Error
            ? `Unable to delete portfolio item: ${error.message}`
            : "Unable to delete portfolio item."
        );
        return;
      }
    }

    setPortfolioItems((current) => current.filter((item) => item.id !== itemId));
    setPortfolioMessage("Removed portfolio item.");
  }

  async function refreshPortfolioItemPrice(item: PortfolioItem) {
    setRefreshingPortfolioItemId(item.id);
    setPortfolioMessage("");

    try {
      const response = await fetch("/api/cards/price-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerCardId: item.providerCardId,
          name: item.name,
          setName: item.setName,
          cardNumber: item.cardNumber,
          variantLabel: item.variantLabel,
          ownershipType: item.ownershipType,
          condition: item.condition,
          grader: item.grader,
          grade: item.grade,
          fallbackMarketPrice: item.estimatedUnitValue
        })
      });
      const payload = (await response.json()) as
        | PortfolioPriceResearchResponse
        | ApiErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Price research failed."
        );
      }

      const research = payload as PortfolioPriceResearchResponse;
      const nextItem = {
        ...item,
        estimatedUnitValue: research.estimatedUnitValue,
        priceSources: research.sources,
        priceUpdatedAt: new Date().toISOString()
      };
      updatePortfolioItem(item.id, () => nextItem);
      setPortfolioMessage(research.message ?? "Portfolio price refreshed.");
    } catch (error) {
      setPortfolioMessage(
        error instanceof Error
          ? `Unable to refresh price: ${error.message}`
          : "Unable to refresh price."
      );
    } finally {
      setRefreshingPortfolioItemId("");
    }
  }

  async function refreshPublicPortfolios() {
    if (!supabaseClient || !session) {
      setNearbyMessage("Sign in to browse nearby portfolios.");
      return;
    }

    setIsNearbyLoading(true);
    setNearbyMessage("");

    try {
      const pins = await loadPublicPortfolioPins(supabaseClient);
      setPublicPortfolioPins(pins);
      setNearbyMessage("Loaded city-level public portfolios.");
    } catch (error) {
      setPublicPortfolioPins([]);
      setNearbyMessage(
        error instanceof Error
          ? `Unable to load nearby portfolios: ${error.message}`
          : "Unable to load nearby portfolios."
      );
    } finally {
      setIsNearbyLoading(false);
    }
  }

  function scrollToWorkspace(tab?: ActiveTab) {
    if (tab) {
      setActiveTab(tab);
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    workspaceRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  function exportCsv() {
    if (cart.length === 0) {
      return;
    }

    const headers = [
      "Name",
      "Set",
      "Card Number",
      "Rarity",
      "Variant",
      "Condition",
      "Market Price",
      "Buy Percent",
      "Suggested Buy Price",
      "Quantity",
      "Total Payout",
      "Price Source",
      "Last Updated",
      "Notes"
    ];

    const rows = cart.map((item) => [
      item.name,
      item.setName,
      item.cardNumber,
      item.rarity,
      item.variantLabel,
      item.condition,
      effectiveMarketPrice(item).toFixed(2),
      item.buyPercent.toString(),
      suggestedBuyPrice(item).toFixed(2),
      item.quantity.toString(),
      totalPayout(item).toFixed(2),
      item.priceSource,
      item.lastUpdated,
      item.notes
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `offertcg-deal-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <>
      <LandingHero
        visibleLandingCards={visibleLandingCards}
        previousLandingCards={previousLandingCards}
        previousLandingOffset={previousLandingOffset}
        visibleLandingOffset={visibleLandingOffset}
        onLaunch={() => scrollToWorkspace("current")}
        onViewAnalytics={() => scrollToWorkspace("analytics")}
      />

      <main className="app-shell" ref={workspaceRef}>
        <AppHeader
          totals={totals}
          session={session}
          supabaseEnabled={Boolean(supabaseClient)}
          isProfileOpen={isProfileOpen}
          profilePopoverRef={profilePopoverRef}
          isAuthReady={isAuthReady}
          isAuthSubmitting={isAuthSubmitting}
          isCloudLoading={isCloudLoading}
          cloudMessage={cloudMessage}
          authEmail={authEmail}
          authPassword={authPassword}
          authMessage={authMessage}
          onToggleProfile={() => setIsProfileOpen((current) => !current)}
          onAuthEmailChange={setAuthEmail}
          onAuthPasswordChange={setAuthPassword}
          onAuthSubmit={(event) => void handleAuthSubmit(event)}
          onSubmitAuth={(mode) => void submitAuth(mode)}
          onSignOut={() => void signOut()}
        />

        <WorkspaceTabs
          activeTab={activeTab}
          recentBuysCount={recentBuys.length}
          remainingQuantity={portfolioSummary.remainingQuantity}
          portfolioCount={portfolioWorth.itemCount}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            if (tab === "nearby") {
              void refreshPublicPortfolios();
            }
          }}
        />

        {activeTab === "current" ? (
          <CurrentDealView
            query={query}
            setName={setName}
            cardNumber={cardNumber}
            rarity={rarity}
            addCondition={addCondition}
            pushNoMarketCardsDown={pushNoMarketCardsDown}
            searchError={searchError}
            providerNotice={providerNotice}
            isSearching={isSearching}
            hasSearched={hasSearched}
            pagination={pagination}
            displayedResults={displayedResults}
            selectedVariants={selectedVariants}
            totalPages={totalPages}
            hasPagedResults={hasPagedResults}
            resultStart={resultStart}
            resultEnd={resultEnd}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            resultListRef={resultListRef}
            cart={cart}
            totals={totals}
            globalBuyPercent={globalBuyPercent}
            onQueryChange={setQuery}
            onSetNameChange={setSetName}
            onCardNumberChange={setCardNumber}
            onRarityChange={setRarity}
            onAddConditionChange={setAddCondition}
            onPushNoMarketCardsDownChange={setPushNoMarketCardsDown}
            onSearch={(event) => void handleSearch(event)}
            onSelectedVariantsChange={setSelectedVariants}
            onAddCard={addCardToCart}
            onGoToSearchPage={goToSearchPage}
            onCheckoutCart={checkoutCart}
            onExportCsv={exportCsv}
            onClearCart={clearCart}
            onApplyGlobalPercent={applyGlobalPercent}
            onUpdateCartItem={updateCartItem}
            onRemoveCartItem={removeCartItem}
          />
        ) : activeTab === "portfolio" ? (
          <PortfolioView
            sessionActive={Boolean(session)}
            profile={portfolioProfile}
            profileMessage={portfolioMessage}
            cityQuery={cityQuery}
            cityResults={cityResults}
            cityMessage={cityMessage}
            isCitySearching={isCitySearching}
            portfolioItems={portfolioItems}
            portfolioWorth={portfolioWorth}
            searchQuery={portfolioSearchQuery}
            searchSetName={portfolioSearchSetName}
            searchCardNumber={portfolioSearchCardNumber}
            searchError={portfolioSearchError}
            providerNotice={portfolioProviderNotice}
            isSearching={isPortfolioSearching}
            hasSearched={hasPortfolioSearched}
            pagination={portfolioSearchPagination}
            searchResults={portfolioSearchResults}
            selectedVariants={portfolioSelectedVariants}
            ownershipType={portfolioOwnershipType}
            addCondition={portfolioAddCondition}
            addGrader={portfolioAddGrader}
            addGrade={portfolioAddGrade}
            addQuantity={portfolioAddQuantity}
            addCertNumber={portfolioAddCertNumber}
            addNotes={portfolioAddNotes}
            addItemPublic={portfolioAddItemPublic}
            refreshingItemId={refreshingPortfolioItemId}
            onProfileChange={setPortfolioProfile}
            onSaveProfile={() => void savePortfolioProfile()}
            onCityQueryChange={setCityQuery}
            onSearchCities={(event) => void handleCitySearch(event)}
            onSelectCity={selectPortfolioCity}
            onClearCity={clearPortfolioCity}
            onSearchQueryChange={setPortfolioSearchQuery}
            onSearchSetNameChange={setPortfolioSearchSetName}
            onSearchCardNumberChange={setPortfolioSearchCardNumber}
            onSearch={(event) => void handlePortfolioSearch(event)}
            onSelectedVariantsChange={setPortfolioSelectedVariants}
            onOwnershipTypeChange={setPortfolioOwnershipType}
            onAddConditionChange={(value) =>
              setPortfolioAddCondition(value ?? "Near Mint")
            }
            onAddGraderChange={setPortfolioAddGrader}
            onAddGradeChange={setPortfolioAddGrade}
            onAddQuantityChange={setPortfolioAddQuantity}
            onAddCertNumberChange={setPortfolioAddCertNumber}
            onAddNotesChange={setPortfolioAddNotes}
            onAddItemPublicChange={setPortfolioAddItemPublic}
            onAddCard={addCardToPortfolio}
            onRefreshItemPrice={(item) => void refreshPortfolioItemPrice(item)}
            onDeleteItem={(itemId) => void deletePortfolioItem(itemId)}
            onUpdateItem={updatePortfolioItem}
          />
        ) : activeTab === "nearby" ? (
          <NearbyView
            sessionActive={Boolean(session)}
            profile={portfolioProfile}
            publicPins={publicPortfolioPins}
            isLoading={isNearbyLoading}
            message={nearbyMessage}
            cardQuery={nearbyCardQuery}
            maxDistanceMiles={nearbyMaxDistance}
            nearbySort={nearbySort}
            mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? ""}
            onCardQueryChange={setNearbyCardQuery}
            onMaxDistanceChange={setNearbyMaxDistance}
            onNearbySortChange={setNearbySort}
            onRefresh={() => void refreshPublicPortfolios()}
          />
        ) : activeTab === "recent" ? (
          <RecentBuysView
            recentBuys={recentBuys}
            portfolioSummary={portfolioSummary}
            visibleLots={visibleLots}
            historySelectedLot={historySelectedLot}
            historySelectedLotTotals={historySelectedLotTotals}
            saleDrafts={saleDrafts}
            editingLotId={editingLotId}
            lotNameDraft={lotNameDraft}
            lotRenameError={lotRenameError}
            isRenamingLot={isRenamingLot}
            lotHistoryQuery={lotHistoryQuery}
            lotHistoryFilter={lotHistoryFilter}
            lotHistorySort={lotHistorySort}
            onLotHistoryQueryChange={setLotHistoryQuery}
            onLotHistoryFilterChange={setLotHistoryFilter}
            onLotHistorySortChange={setLotHistorySort}
            onSelectLot={setSelectedLotId}
            onStartRenamingLot={startRenamingLot}
            onCancelRenamingLot={cancelRenamingLot}
            onSaveLotRename={(event, lotId) => void saveLotRename(event, lotId)}
            onLotNameDraftChange={(value) => {
              setLotNameDraft(value);
              setLotRenameError("");
            }}
            onDeleteLot={(lotId) => void deleteLot(lotId)}
            onUpdateSaleDraft={updateSaleDraft}
            onMarkItemSold={markItemSold}
          />
        ) : activeTab === "analytics" ? (
          <AnalyticsView
            recentBuys={recentBuys}
            portfolioSummary={portfolioSummary}
            monthlyProfit={monthlyProfit}
            maxMonthlyProfit={maxMonthlyProfit}
            lotPerformance={lotPerformance}
            onViewLot={viewLot}
          />
        ) : (
          <InventoryView
            recentBuys={recentBuys}
            inventoryRows={inventoryRows}
            inventoryQuery={inventoryQuery}
            inventoryMode={inventoryMode}
            inventorySort={inventorySort}
            onInventoryQueryChange={setInventoryQuery}
            onInventoryModeChange={setInventoryMode}
            onInventorySortChange={setInventorySort}
            onViewLot={viewLot}
          />
        )}
      </main>
    </>
  );
}
