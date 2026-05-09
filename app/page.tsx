"use client";

import Image from "next/image";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CircleUserRound,
  Download,
  History,
  LogIn,
  LogOut,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  X
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CONDITIONS,
  type CardCondition,
  type DealLot,
  type DealLotItem,
  type DealItem,
  effectiveMarketPrice,
  grossProfit,
  lotNetProfit,
  lotTotals,
  portfolioTotals,
  remainingCost,
  remainingMarketValue,
  remainingQuantity,
  remainingSpread,
  roundCurrency,
  roiPercent,
  suggestedBuyPrice,
  soldRevenue,
  totalPayout
} from "@/lib/deals";
import {
  DEFAULT_SEARCH_PAGE,
  SEARCH_PAGE_SIZE,
  type CardSearchResult,
  type ProviderSearchResponse
} from "@/lib/pricing/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  loadCloudDealState,
  loadCloudLots,
  saveCloudDealState,
  saveCloudLot,
  saveCloudLots,
  saveCloudSale
} from "@/lib/supabase/deals";

const QUICK_PERCENTAGES = [70, 75, 80, 85, 90, 95, 100];
const STORAGE_KEY = "offertcg-current-deal-v1";
const RECENT_BUYS_STORAGE_KEY = "offertcg-recent-buys-v1";
const DEFAULT_BUY_PERCENT = QUICK_PERCENTAGES[0];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

type StoredDeal = {
  cart?: DealItem[];
  globalBuyPercent?: number;
};

type ApiErrorResponse = {
  error?: string;
};

type ActiveTab = "current" | "recent" | "analytics" | "inventory";
type InventoryMode = "unsold" | "all";
type InventorySort = "newest" | "value" | "cost" | "name" | "spread";
type LotHistoryFilter = "all" | "open" | "sold" | "profitable" | "loss";
type LotHistorySort =
  | "newest"
  | "oldest"
  | "profit"
  | "roi"
  | "remaining"
  | "buy-cost";

type SearchFilters = {
  query: string;
  setName: string;
  cardNumber: string;
  rarity: string;
};

type SearchPagination = {
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
};

type SaleDraft = {
  quantity: string;
  saleTotal: string;
};

type AuthMode = "login" | "signup";

type LotPerformance = {
  lot: DealLot;
  totals: ReturnType<typeof lotTotals>;
  lotNet: number;
  portfolioRoi: number;
};

type MonthlyProfit = {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  quantity: number;
};

type InventoryRow = {
  id: string;
  lotId: string;
  lotLabel: string;
  checkedOutAt: string;
  item: DealLotItem;
  remaining: number;
  buyCost: number;
  marketValue: number;
  spread: number;
};

type LotStatusBadge = {
  label: string;
  tone: "open" | "sold" | "profit" | "loss" | "neutral";
};

const LOT_HISTORY_FILTER_OPTIONS: {
  label: string;
  value: LotHistoryFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Fully sold", value: "sold" },
  { label: "Profitable", value: "profitable" },
  { label: "At loss", value: "loss" }
];

const LOT_HISTORY_SORT_OPTIONS: {
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

const EMPTY_SEARCH_PAGINATION: SearchPagination = {
  page: DEFAULT_SEARCH_PAGE,
  pageSize: SEARCH_PAGE_SIZE,
  count: 0,
  totalCount: 0
};

export default function Home() {
  const supabaseClient = useMemo(() => getSupabaseBrowserClient(), []);
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
  const [pagination, setPagination] = useState<SearchPagination>(
    EMPTY_SEARCH_PAGINATION
  );
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
  const [lotHistoryQuery, setLotHistoryQuery] = useState("");
  const [lotHistoryFilter, setLotHistoryFilter] =
    useState<LotHistoryFilter>("all");
  const [lotHistorySort, setLotHistorySort] =
    useState<LotHistorySort>("newest");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>("unsold");
  const [inventorySort, setInventorySort] = useState<InventorySort>("value");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [globalBuyPercent, setGlobalBuyPercent] =
    useState(DEFAULT_BUY_PERCENT);
  const [hasHydrated, setHasHydrated] = useState(false);
  const resultListRef = useRef<HTMLDivElement>(null);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

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
    const rawDeal = window.localStorage.getItem(STORAGE_KEY);
    const rawRecentBuys = window.localStorage.getItem(RECENT_BUYS_STORAGE_KEY);
    let storedDeal: StoredDeal = {};
    let storedRecentBuys: DealLot[] = [];

    if (rawDeal) {
      try {
        storedDeal = JSON.parse(rawDeal) as StoredDeal;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (rawRecentBuys) {
      try {
        const parsedRecentBuys = JSON.parse(rawRecentBuys) as unknown;
        if (Array.isArray(parsedRecentBuys)) {
          storedRecentBuys = parsedRecentBuys as DealLot[];
        }
      } catch {
        window.localStorage.removeItem(RECENT_BUYS_STORAGE_KEY);
      }
    }

    const frame = window.requestAnimationFrame(() => {
      if (Array.isArray(storedDeal.cart)) {
        setCart(storedDeal.cart);
      }
      setRecentBuys(storedRecentBuys);
      setSelectedLotId(storedRecentBuys[0]?.id ?? null);
      if (isValidPercent(storedDeal.globalBuyPercent)) {
        setGlobalBuyPercent(storedDeal.globalBuyPercent);
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
      JSON.stringify({ cart, globalBuyPercent })
    );
  }, [cart, globalBuyPercent, hasHydrated, session]);

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

        if (!cloudDeal.importedLocalData) {
          const localDeal = readStoredDeal();
          const localLots = readStoredRecentBuys();
          const shouldImportCart =
            Array.isArray(localDeal.cart) &&
            localDeal.cart.length > 0 &&
            cloudDeal.cart.length === 0;
          const shouldImportLots = localLots.length > 0;

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

          clearLocalDealStorage();
          cloudDeal = await loadCloudDealState(
            supabaseClient,
            session.user.id,
            DEFAULT_BUY_PERCENT
          );
          cloudLots = await loadCloudLots(supabaseClient, session.user.id);

          setCloudMessage(
            shouldImportCart || shouldImportLots
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

  const totals = useMemo(() => {
    return cart.reduce(
      (summary, item) => {
        const marketTotal = effectiveMarketPrice(item) * item.quantity;
        summary.marketValue += marketTotal;
        summary.payout += totalPayout(item);
        summary.quantity += item.quantity;
        return summary;
      },
      { marketValue: 0, payout: 0, quantity: 0 }
    );
  }, [cart]);
  const portfolioSummary = useMemo(() => {
    return portfolioTotals(recentBuys);
  }, [recentBuys]);
  const lotPerformance = useMemo(() => {
    return recentBuys
      .map<LotPerformance>((lot) => {
        const totals = lotTotals(lot);
        const lotNet = lotNetProfit(lot);

        return {
          lot,
          totals,
          lotNet,
          portfolioRoi: roiPercent(lotNet, totals.buyCost)
        };
      })
      .sort((first, second) => second.lotNet - first.lotNet);
  }, [recentBuys]);
  const visibleLots = useMemo(() => {
    const query = lotHistoryQuery.trim().toLowerCase();

    return recentBuys
      .filter((lot) => {
        const totals = lotTotals(lot);
        const lotNet = lotNetProfit(lot);

        switch (lotHistoryFilter) {
          case "open":
            return totals.remainingQuantity > 0;
          case "sold":
            return totals.quantity > 0 && totals.remainingQuantity === 0;
          case "profitable":
            return lotNet > 0;
          case "loss":
            return (
              lotNet < 0 &&
              (totals.soldRevenue > 0 || totals.remainingQuantity === 0)
            );
          case "all":
          default:
            return true;
        }
      })
      .filter((lot) => {
        if (!query) {
          return true;
        }

        return [
          lot.label,
          formatDateTime(lot.checkedOutAt),
          ...lot.items.flatMap((item) => [
            item.name,
            item.setName,
            item.cardNumber,
            item.rarity,
            item.condition,
            item.variantLabel
          ])
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((first, second) => {
        const firstTotals = lotTotals(first);
        const secondTotals = lotTotals(second);
        const firstNet = lotNetProfit(first);
        const secondNet = lotNetProfit(second);

        switch (lotHistorySort) {
          case "oldest":
            return (
              new Date(first.checkedOutAt).getTime() -
              new Date(second.checkedOutAt).getTime()
            );
          case "profit":
            return secondNet - firstNet;
          case "roi":
            return (
              roiPercent(secondNet, secondTotals.buyCost) -
              roiPercent(firstNet, firstTotals.buyCost)
            );
          case "remaining":
            return secondTotals.remainingQuantity - firstTotals.remainingQuantity;
          case "buy-cost":
            return secondTotals.buyCost - firstTotals.buyCost;
          case "newest":
          default:
            return (
              new Date(second.checkedOutAt).getTime() -
              new Date(first.checkedOutAt).getTime()
            );
        }
      });
  }, [lotHistoryFilter, lotHistoryQuery, lotHistorySort, recentBuys]);
  const historySelectedLot = useMemo(() => {
    return (
      visibleLots.find((lot) => lot.id === selectedLotId) ??
      visibleLots[0] ??
      null
    );
  }, [selectedLotId, visibleLots]);
  const historySelectedLotTotals = useMemo(() => {
    return historySelectedLot ? lotTotals(historySelectedLot) : null;
  }, [historySelectedLot]);
  const monthlyProfit = useMemo(() => {
    const months = new Map<string, MonthlyProfit>();

    recentBuys.forEach((lot) => {
      lot.items.forEach((item) => {
        item.sales.forEach((sale) => {
          const soldAt = new Date(sale.soldAt);
          const key = Number.isNaN(soldAt.getTime())
            ? "unknown"
            : `${soldAt.getFullYear()}-${String(soldAt.getMonth() + 1).padStart(2, "0")}`;
          const label =
            key === "unknown"
              ? "Unknown"
              : soldAt.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric"
                });
          const current = months.get(key) ?? {
            key,
            label,
            revenue: 0,
            cost: 0,
            profit: 0,
            quantity: 0
          };

          current.revenue += sale.saleTotal;
          current.cost += item.buyUnitPrice * sale.quantity;
          current.quantity += sale.quantity;
          current.profit = current.revenue - current.cost;
          months.set(key, current);
        });
      });
    });

    return [...months.values()]
      .map((month) => ({
        ...month,
        revenue: roundCurrency(month.revenue),
        cost: roundCurrency(month.cost),
        profit: roundCurrency(month.profit)
      }))
      .sort((first, second) => first.key.localeCompare(second.key));
  }, [recentBuys]);
  const maxMonthlyProfit = useMemo(() => {
    return Math.max(1, ...monthlyProfit.map((month) => Math.abs(month.profit)));
  }, [monthlyProfit]);
  const inventoryRows = useMemo(() => {
    const query = inventoryQuery.trim().toLowerCase();

    return recentBuys
      .flatMap<InventoryRow>((lot) =>
        lot.items.map((item) => ({
          id: `${lot.id}|${item.id}`,
          lotId: lot.id,
          lotLabel: lot.label,
          checkedOutAt: lot.checkedOutAt,
          item,
          remaining: remainingQuantity(item),
          buyCost: remainingCost(item),
          marketValue: remainingMarketValue(item),
          spread: remainingSpread(item)
        }))
      )
      .filter((row) => inventoryMode === "all" || row.remaining > 0)
      .filter((row) => {
        if (!query) {
          return true;
        }

        return [
          row.item.name,
          row.item.setName,
          row.item.cardNumber,
          row.item.rarity,
          row.item.condition,
          row.item.variantLabel,
          row.lotLabel
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((first, second) => {
        switch (inventorySort) {
          case "cost":
            return second.buyCost - first.buyCost;
          case "name":
            return first.item.name.localeCompare(second.item.name);
          case "spread":
            return second.spread - first.spread;
          case "value":
            return second.marketValue - first.marketValue;
          case "newest":
          default:
            return (
              new Date(second.checkedOutAt).getTime() -
              new Date(first.checkedOutAt).getTime()
            );
        }
      });
  }, [inventoryMode, inventoryQuery, inventorySort, recentBuys]);
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

    const soldQuantity = Math.min(quantity, remainingQuantity(item));
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

  function viewLot(lotId: string) {
    setLotHistoryQuery("");
    setLotHistoryFilter("all");
    setSelectedLotId(lotId);
    setActiveTab("recent");
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
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Vendor buy tool</p>
          <h1>OfferTCG</h1>
          <p className="header-copy">
            Search Pokemon cards, add the right version, and price a buy offer
            at your target percentage.
          </p>
        </div>
        <div className="header-side">
          <div className="profile-menu" ref={profilePopoverRef}>
            <button
              aria-expanded={isProfileOpen}
              aria-haspopup="dialog"
              aria-label="Open account menu"
              className="profile-button"
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
            >
              <CircleUserRound size={23} />
              {session ? <span className="profile-status" /> : null}
            </button>

            {isProfileOpen ? (
              <section
                className="profile-popover"
                role="dialog"
                aria-label="Account sync"
              >
                <div>
                  <p className="eyebrow">Account</p>
                  {session ? (
                    <strong>{session.user.email}</strong>
                  ) : (
                    <strong>{supabaseClient ? "Cloud sync" : "Local mode"}</strong>
                  )}
                </div>

                {!isAuthReady ? (
                  <p className="auth-message">Checking account...</p>
                ) : session ? (
                  <div className="auth-row">
                    <span>{isCloudLoading ? "Syncing..." : cloudMessage}</span>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => void signOut()}
                      disabled={isAuthSubmitting}
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                ) : supabaseClient ? (
                  <form className="auth-form" onSubmit={handleAuthSubmit}>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder="Email"
                      autoComplete="email"
                    />
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="Password"
                      autoComplete="current-password"
                    />
                    <div className="auth-actions">
                      <button
                        className="secondary-button"
                        type="submit"
                        disabled={isAuthSubmitting}
                      >
                        <LogIn size={16} />
                        Log in
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => void submitAuth("signup")}
                        disabled={isAuthSubmitting}
                      >
                        Sign up
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="auth-message">
                    Add Supabase env vars to enable account sync.
                  </p>
                )}

                {authMessage ? (
                  <p className="auth-message">{authMessage}</p>
                ) : null}
              </section>
            ) : null}
          </div>

          <div className="summary-grid" aria-label="Current deal totals">
            <SummaryMetric label="Market value" value={formatCurrency(totals.marketValue)} />
            <SummaryMetric label="Suggested payout" value={formatCurrency(totals.payout)} strong />
            <SummaryMetric label="Cards" value={totals.quantity.toString()} />
          </div>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Workspace views">
        <button
          className={activeTab === "current" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("current")}
        >
          <ShoppingCart size={17} />
          Current Deal
        </button>
        <button
          className={activeTab === "recent" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("recent")}
        >
          <History size={17} />
          Recent Buys
          {recentBuys.length > 0 ? (
            <span className="tab-count">{recentBuys.length}</span>
          ) : null}
        </button>
        <button
          className={activeTab === "analytics" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={17} />
          Analytics
        </button>
        <button
          className={activeTab === "inventory" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("inventory")}
        >
          <Boxes size={17} />
          Inventory
          {portfolioSummary.remainingQuantity > 0 ? (
            <span className="tab-count">
              {portfolioSummary.remainingQuantity}
            </span>
          ) : null}
        </button>
      </nav>

      {activeTab === "current" ? (
        <>
      <section className="search-panel">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-main">
            <label htmlFor="card-search">Card search</label>
            <div className="search-input-wrap">
              <Search aria-hidden="true" size={22} />
              <input
                id="card-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Charizard ex, Pikachu, Umbreon VMAX..."
                autoComplete="off"
              />
              {query ? (
                <button
                  aria-label="Clear search"
                  className="icon-button"
                  type="button"
                  onClick={() => setQuery("")}
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="filter-grid">
            <label>
              Set name
              <input
                value={setName}
                onChange={(event) => setSetName(event.target.value)}
                placeholder="Obsidian Flames"
              />
            </label>
            <label>
              Card number
              <input
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                placeholder="125/197"
              />
            </label>
            <label>
              Rarity
              <input
                value={rarity}
                onChange={(event) => setRarity(event.target.value)}
                placeholder="Special Illustration Rare"
              />
            </label>
            <label>
              Add condition
              <select
                value={addCondition}
                onChange={(event) =>
                  setAddCondition(event.target.value as CardCondition)
                }
              >
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <Search size={18} />
            )}
            Search prices
          </button>
        </form>

        {searchError ? <p className="status-message error">{searchError}</p> : null}
        {providerNotice ? (
          <p className="status-message warning">{providerNotice}</p>
        ) : null}
      </section>

      <section className="workspace-grid">
        <section className="panel results-panel" aria-labelledby="results-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Search results</p>
              <h2 id="results-heading">Select the exact card</h2>
            </div>
            <span className="count-pill">
              {hasSearched ? pagination.totalCount : 0} results
            </span>
          </div>

          {isSearching ? (
            <div className="empty-state">
              <Loader2 className="spin" size={24} />
              <span>Looking up current prices...</span>
            </div>
          ) : null}

          {!isSearching && hasSearched && results.length === 0 && !searchError ? (
            <div className="empty-state">
              <span>No matching cards found. Try a shorter name or clear filters.</span>
            </div>
          ) : null}

          {!isSearching && !hasSearched ? (
            <div className="empty-state">
              <span>Search by card name to start a deal.</span>
            </div>
          ) : null}

          <div className="result-list" ref={resultListRef}>
            {results.map((card) => {
              const selectedVariant = getSelectedVariant(
                card,
                selectedVariants[card.id]
              );

              return (
                <article className="result-card" key={card.id}>
                  <CardThumb card={card} />
                  <div className="result-details">
                    <div>
                      <h3>{card.name}</h3>
                      <p>
                        {card.setName} #{card.cardNumber}
                      </p>
                      <p className="muted">
                        {card.rarity} · Source: {sourceLabel(card.priceSource)}
                      </p>
                    </div>
                    <div className="result-controls">
                      <label>
                        Version
                        <select
                          value={selectedVariant?.id ?? ""}
                          onChange={(event) =>
                            setSelectedVariants((current) => ({
                              ...current,
                              [card.id]: event.target.value
                            }))
                          }
                        >
                          {card.variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.label} ·{" "}
                              {variant.marketPrice === null
                                ? "No market"
                                : formatCurrency(variant.marketPrice)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="result-price">
                        <span>Market</span>
                        <strong>
                          {selectedVariant?.marketPrice === null ||
                          selectedVariant === undefined
                            ? "Manual"
                            : formatCurrency(selectedVariant.marketPrice)}
                        </strong>
                      </div>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => addCardToCart(card)}
                      >
                        <Plus size={17} />
                        Add
                      </button>
                    </div>
                    <div className="result-meta">
                      <span>Updated {formatDate(card.lastUpdated)}</span>
                      {card.externalUrl ? (
                        <a href={card.externalUrl} target="_blank" rel="noreferrer">
                          View source
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {hasPagedResults ? (
            <div className="pagination-bar">
              <span aria-live="polite">
                Showing {resultStart}-{resultEnd} of {pagination.totalCount}
              </span>
              <div className="pagination-controls">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => goToSearchPage(pagination.page - 1)}
                  disabled={!canGoPrevious || isSearching}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => goToSearchPage(pagination.page + 1)}
                  disabled={!canGoNext || isSearching}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel cart-panel" aria-labelledby="cart-heading">
          <div className="panel-heading cart-heading">
            <div>
              <p className="eyebrow">Deal cart</p>
              <h2 id="cart-heading">Suggested payout</h2>
            </div>
            <div className="cart-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={checkoutCart}
                disabled={cart.length === 0}
              >
                <CheckCircle size={17} />
                Checkout
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={exportCsv}
                disabled={cart.length === 0}
              >
                <Download size={17} />
                CSV
              </button>
              <button
                className="ghost-button danger"
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                <Trash2 size={17} />
                Clear
              </button>
            </div>
          </div>

          <div className="percent-toolbar" aria-label="Buy percentage controls">
            <label>
              Global buy %
              <input
                className="percent-input"
                type="number"
                min="1"
                max="100"
                step="1"
                value={globalBuyPercent}
                onChange={(event) =>
                  applyGlobalPercent(Number(event.target.value))
                }
              />
            </label>
            <div className="quick-buttons">
              {QUICK_PERCENTAGES.map((percent) => (
                <button
                  className={percent === globalBuyPercent ? "active" : ""}
                  key={percent}
                  type="button"
                  onClick={() => applyGlobalPercent(percent)}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Condition</th>
                  <th>Market</th>
                  <th>Buy %</th>
                  <th>Qty</th>
                  <th>Each</th>
                  <th>Total</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td className="empty-row" colSpan={8}>
                      Add cards from search results to price a deal.
                    </td>
                  </tr>
                ) : null}
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td className="deal-card-cell">
                      <CardThumb card={item} compact />
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.setName} #{item.cardNumber}
                        </span>
                        <span className="muted">
                          {item.variantLabel} · {item.rarity}
                        </span>
                        <input
                          className="notes-input"
                          value={item.notes}
                          onChange={(event) =>
                            updateCartItem(item.id, (current) => ({
                              ...current,
                              notes: event.target.value
                            }))
                          }
                          placeholder="Notes"
                        />
                      </div>
                    </td>
                    <td>
                      <select
                        value={item.condition}
                        onChange={(event) =>
                          updateCartItem(item.id, (current) => ({
                            ...current,
                            condition: event.target.value as CardCondition
                          }))
                        }
                      >
                        {CONDITIONS.map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="price-stack">
                        <strong>{formatCurrency(effectiveMarketPrice(item))}</strong>
                        <span>
                          {item.marketPriceMissing
                            ? "No market"
                            : `Market ${formatCurrency(item.marketPrice)}`}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.manualMarketPrice ?? ""}
                          onChange={(event) =>
                            updateCartItem(item.id, (current) => ({
                              ...current,
                              manualMarketPrice:
                                event.target.value === ""
                                  ? undefined
                                  : roundCurrency(Number(event.target.value))
                            }))
                          }
                          placeholder="Override"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        className="small-number"
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={item.buyPercent}
                        onChange={(event) =>
                          updateCartItem(item.id, (current) => ({
                            ...current,
                            buyPercent: clampPercent(Number(event.target.value))
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="small-number"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateCartItem(item.id, (current) => ({
                            ...current,
                            quantity: Math.max(1, Math.floor(Number(event.target.value) || 1))
                          }))
                        }
                      />
                    </td>
                    <td>{formatCurrency(suggestedBuyPrice(item))}</td>
                    <td>
                      <strong>{formatCurrency(totalPayout(item))}</strong>
                    </td>
                    <td>
                      <button
                        aria-label={`Remove ${item.name}`}
                        className="icon-button danger"
                        type="button"
                        onClick={() => removeCartItem(item.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Totals</td>
                  <td>{totals.quantity}</td>
                  <td>{formatCurrency(totals.marketValue)}</td>
                  <td>{formatCurrency(totals.payout)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {cart.length > 0 ? (
            <button
              className="reset-button"
              type="button"
              onClick={() => applyGlobalPercent(DEFAULT_BUY_PERCENT)}
            >
              <RotateCcw size={16} />
              Reset all cards to {DEFAULT_BUY_PERCENT}%
            </button>
          ) : null}
        </section>
      </section>
        </>
      ) : activeTab === "recent" ? (
        <section className="recent-buys-view">
          <div className="summary-grid recent-summary" aria-label="Recent buy totals">
            <SummaryMetric
              label="Total buy cost"
              value={formatCurrency(portfolioSummary.buyCost)}
            />
            <SummaryMetric
              label="Sold revenue"
              value={formatCurrency(portfolioSummary.soldRevenue)}
            />
            <SummaryMetric
              label="Gross profit"
              value={formatCurrency(portfolioSummary.realizedProfit)}
              strong
            />
          </div>

          {recentBuys.length > 0 ? (
            <div className="history-toolbar">
              <label>
                Search lots
                <input
                  value={lotHistoryQuery}
                  onChange={(event) => setLotHistoryQuery(event.target.value)}
                  placeholder="Lot, card, set, condition..."
                />
              </label>
              <label>
                Sort by
                <select
                  value={lotHistorySort}
                  onChange={(event) =>
                    setLotHistorySort(event.target.value as LotHistorySort)
                  }
                >
                  {LOT_HISTORY_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="history-filters" aria-label="Lot history filter">
                {LOT_HISTORY_FILTER_OPTIONS.map((option) => (
                  <button
                    className={
                      lotHistoryFilter === option.value ? "active" : ""
                    }
                    key={option.value}
                    type="button"
                    onClick={() => setLotHistoryFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {recentBuys.length === 0 ? (
            <section className="panel">
              <div className="empty-state">
                <span>Checkout a deal cart to start tracking recent buys.</span>
              </div>
            </section>
          ) : visibleLots.length === 0 ? (
            <section className="panel">
              <div className="empty-state">
                <span>No lots match the current history filters.</span>
              </div>
            </section>
          ) : (
            <section className="recent-grid">
              <aside className="panel lot-list-panel" aria-label="Recent buy lots">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Recent buys</p>
                    <h2>Lots</h2>
                  </div>
                </div>
                <div className="lot-list">
                  {visibleLots.map((lot) => {
                    const totals = lotTotals(lot);
                    const lotNet = lotNetProfit(lot);
                    const badges = lotStatusBadges(lot);

                    return (
                      <button
                        className={
                          historySelectedLot?.id === lot.id
                            ? "lot-list-item active"
                            : "lot-list-item"
                        }
                        key={lot.id}
                        type="button"
                        onClick={() => setSelectedLotId(lot.id)}
                      >
                        <span>
                          <strong>{lot.label}</strong>
                          <small>{formatDateTime(lot.checkedOutAt)}</small>
                        </span>
                        <span className="status-badges">
                          {badges.map((badge) => (
                            <span
                              className={`status-badge ${badge.tone}`}
                              key={badge.label}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </span>
                        <span>
                          {totals.remainingQuantity} left ·{" "}
                          {formatCurrency(lotNet)} net ·{" "}
                          {formatPercent(roiPercent(lotNet, totals.buyCost))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {historySelectedLot && historySelectedLotTotals ? (
                <section className="panel lot-detail-panel">
                  <div className="panel-heading lot-detail-heading">
                    <div>
                      <p className="eyebrow">Lot detail</p>
                      <h2>{historySelectedLot.label}</h2>
                      <p className="muted">
                        Checked out{" "}
                        {formatDateTime(historySelectedLot.checkedOutAt)}
                      </p>
                    </div>
                    <div className="lot-metrics" aria-label="Selected lot totals">
                      <SummaryMetric
                        label="Buy cost"
                        value={formatCurrency(historySelectedLotTotals.buyCost)}
                      />
                      <SummaryMetric
                        label="Sold"
                        value={formatCurrency(
                          historySelectedLotTotals.soldRevenue
                        )}
                      />
                      <SummaryMetric
                        label="Lot net"
                        value={formatCurrency(lotNetProfit(historySelectedLot))}
                        strong
                      />
                      <SummaryMetric
                        label="Sold profit"
                        value={formatCurrency(
                          historySelectedLotTotals.grossProfit
                        )}
                      />
                    </div>
                  </div>

                  <div className="lot-items">
                    {historySelectedLot.items.map((item) => {
                      const key = saleDraftKey(historySelectedLot.id, item.id);
                      const draft = saleDrafts[key] ?? {
                        quantity: "",
                        saleTotal: ""
                      };
                      const remaining = remainingQuantity(item);
                      const draftQuantity = Number(draft.quantity);
                      const draftSaleTotal = Number(draft.saleTotal);
                      const canRecordSale =
                        remaining > 0 &&
                        Number.isFinite(draftQuantity) &&
                        draftQuantity >= 1 &&
                        Number.isFinite(draftSaleTotal) &&
                        draftSaleTotal > 0;

                      return (
                        <article className="lot-item" key={item.id}>
                          <div className="lot-item-main">
                            <CardThumb card={item} compact />
                            <div>
                              <h3>{item.name}</h3>
                              <p>
                                {item.setName} #{item.cardNumber}
                              </p>
                              <p className="muted">
                                {item.variantLabel} · {item.condition}
                              </p>
                            </div>
                          </div>

                          <div className="lot-item-stats">
                            <MetricStack label="Bought" value={item.quantity.toString()} />
                            <MetricStack
                              label="Remaining"
                              value={remaining.toString()}
                            />
                            <MetricStack
                              label="Buy cost"
                              value={formatCurrency(item.buyTotal)}
                            />
                            <MetricStack
                              label="Sold"
                              value={formatCurrency(soldRevenue(item))}
                            />
                            <MetricStack
                              label="Sold profit"
                              value={formatCurrency(grossProfit(item))}
                            />
                          </div>

                          <div className="sale-form" aria-label={`Mark ${item.name} sold`}>
                            <label>
                              Qty sold
                              <input
                                type="number"
                                min="1"
                                max={remaining}
                                step="1"
                                value={draft.quantity}
                                onChange={(event) =>
                                  updateSaleDraft(key, {
                                    ...draft,
                                    quantity: clampQuantityInput(
                                      event.target.value,
                                      remaining
                                    )
                                  })
                                }
                                disabled={remaining === 0}
                              />
                            </label>
                            <label>
                              Sale total
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.saleTotal}
                                onChange={(event) =>
                                  updateSaleDraft(key, {
                                    ...draft,
                                    saleTotal: event.target.value
                                  })
                                }
                                placeholder="0.00"
                                disabled={remaining === 0}
                              />
                            </label>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() =>
                                markItemSold(historySelectedLot.id, item.id)
                              }
                              disabled={!canRecordSale}
                            >
                              <CheckCircle size={17} />
                              Mark sold
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </section>
          )}
        </section>
      ) : activeTab === "analytics" ? (
        <section className="analytics-view">
          {recentBuys.length === 0 ? (
            <section className="panel">
              <div className="empty-state">
                <span>Checkout a deal cart to unlock portfolio analytics.</span>
              </div>
            </section>
          ) : (
            <>
              <div className="analytics-summary" aria-label="Portfolio analytics">
                <SummaryMetric
                  label="Total spent"
                  value={formatCurrency(portfolioSummary.buyCost)}
                />
                <SummaryMetric
                  label="Sold revenue"
                  value={formatCurrency(portfolioSummary.soldRevenue)}
                />
                <SummaryMetric
                  label="Realized profit"
                  value={formatCurrency(portfolioSummary.realizedProfit)}
                  strong
                />
                <SummaryMetric
                  label="Lot net"
                  value={formatCurrency(portfolioSummary.lotNet)}
                />
                <SummaryMetric
                  label="Realized ROI"
                  value={formatPercent(portfolioSummary.realizedRoi)}
                />
                <SummaryMetric
                  label="Sell-through"
                  value={formatPercent(portfolioSummary.sellThroughRate)}
                />
                <SummaryMetric
                  label="Inventory value"
                  value={formatCurrency(portfolioSummary.remainingMarketValue)}
                />
                <SummaryMetric
                  label="Inventory spread"
                  value={formatCurrency(portfolioSummary.remainingSpread)}
                />
              </div>

              <section className="analytics-grid">
                <section className="panel analytics-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Trend</p>
                      <h2>Monthly profit</h2>
                    </div>
                    <span className="count-pill">{monthlyProfit.length} months</span>
                  </div>

                  {monthlyProfit.length === 0 ? (
                    <div className="empty-state compact">
                      <span>Record a sale to start the monthly profit chart.</span>
                    </div>
                  ) : (
                    <div className="profit-bars">
                      {monthlyProfit.slice(-8).map((month) => {
                        const width = Math.max(
                          4,
                          (Math.abs(month.profit) / maxMonthlyProfit) * 100
                        );

                        return (
                          <div className="profit-bar-row" key={month.key}>
                            <span>{month.label}</span>
                            <div className="profit-bar-track">
                              <span
                                className={
                                  month.profit >= 0
                                    ? "profit-bar positive"
                                    : "profit-bar negative"
                                }
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <strong>{formatCurrency(month.profit)}</strong>
                            <small>
                              {month.quantity} sold ·{" "}
                              {formatCurrency(month.revenue)}
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="panel analytics-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Lots</p>
                      <h2>Performance</h2>
                    </div>
                  </div>
                  <div className="performance-grid">
                    <LotPerformanceCard
                      title="Best lot"
                      performance={lotPerformance[0]}
                      onViewLot={viewLot}
                    />
                    <LotPerformanceCard
                      title="Weakest lot"
                      performance={lotPerformance[lotPerformance.length - 1]}
                      onViewLot={viewLot}
                    />
                  </div>
                </section>
              </section>
            </>
          )}
        </section>
      ) : (
        <section className="inventory-view">
          <section className="panel inventory-panel">
            <div className="panel-heading inventory-heading">
              <div>
                <p className="eyebrow">Inventory</p>
                <h2>Cards on hand</h2>
              </div>
              <span className="count-pill">{inventoryRows.length} rows</span>
            </div>

            <div className="inventory-toolbar">
              <label>
                Search inventory
                <input
                  value={inventoryQuery}
                  onChange={(event) => setInventoryQuery(event.target.value)}
                  placeholder="Card, set, lot, condition..."
                />
              </label>
              <label>
                Sort by
                <select
                  value={inventorySort}
                  onChange={(event) =>
                    setInventorySort(event.target.value as InventorySort)
                  }
                >
                  <option value="value">Market value</option>
                  <option value="cost">Remaining cost</option>
                  <option value="spread">Potential spread</option>
                  <option value="newest">Newest lot</option>
                  <option value="name">Card name</option>
                </select>
              </label>
              <div className="segmented-control" aria-label="Inventory mode">
                <button
                  className={inventoryMode === "unsold" ? "active" : ""}
                  type="button"
                  onClick={() => setInventoryMode("unsold")}
                >
                  Unsold
                </button>
                <button
                  className={inventoryMode === "all" ? "active" : ""}
                  type="button"
                  onClick={() => setInventoryMode("all")}
                >
                  All
                </button>
              </div>
            </div>

            {recentBuys.length === 0 ? (
              <div className="empty-state">
                <span>Checkout a deal cart to start building inventory.</span>
              </div>
            ) : inventoryRows.length === 0 ? (
              <div className="empty-state">
                <span>No inventory rows match the current filters.</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Card</th>
                      <th>Lot</th>
                      <th>Bought / Left</th>
                      <th>Remaining cost</th>
                      <th>Market value</th>
                      <th>Spread</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryRows.map((row) => (
                      <tr key={row.id}>
                        <td className="deal-card-cell">
                          <CardThumb card={row.item} compact />
                          <div>
                            <strong>{row.item.name}</strong>
                            <span>
                              {row.item.setName} #{row.item.cardNumber}
                            </span>
                            <span className="muted">
                              {row.item.variantLabel} · {row.item.condition}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="price-stack">
                            <strong>{row.lotLabel}</strong>
                            <span>{formatDateTime(row.checkedOutAt)}</span>
                          </div>
                        </td>
                        <td>
                          {row.item.quantity} / <strong>{row.remaining}</strong>
                        </td>
                        <td>{formatCurrency(row.buyCost)}</td>
                        <td>{formatCurrency(row.marketValue)}</td>
                        <td>
                          <strong
                            className={
                              row.spread >= 0 ? "positive-value" : "negative-value"
                            }
                          >
                            {formatCurrency(row.spread)}
                          </strong>
                        </td>
                        <td>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => viewLot(row.lotId)}
                          >
                            View lot
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}

function SummaryMetric({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "summary-card strong" : "summary-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricStack({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="metric-stack">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LotPerformanceCard({
  title,
  performance,
  onViewLot
}: {
  title: string;
  performance?: LotPerformance;
  onViewLot: (lotId: string) => void;
}) {
  if (!performance) {
    return null;
  }

  return (
    <article className="performance-card">
      <div>
        <span>{title}</span>
        <h3>{performance.lot.label}</h3>
        <p>{formatDateTime(performance.lot.checkedOutAt)}</p>
      </div>
      <div className="performance-metrics">
        <MetricStack label="Lot net" value={formatCurrency(performance.lotNet)} />
        <MetricStack
          label="Realized"
          value={formatCurrency(performance.totals.grossProfit)}
        />
        <MetricStack label="ROI" value={formatPercent(performance.portfolioRoi)} />
        <MetricStack
          label="Left"
          value={performance.totals.remainingQuantity.toString()}
        />
      </div>
      <button
        className="ghost-button"
        type="button"
        onClick={() => onViewLot(performance.lot.id)}
      >
        View lot
      </button>
    </article>
  );
}

function lotStatusBadges(lot: DealLot): LotStatusBadge[] {
  const totals = lotTotals(lot);
  const lotNet = lotNetProfit(lot);
  const badges: LotStatusBadge[] = [
    totals.remainingQuantity === 0
      ? { label: "Sold out", tone: "sold" }
      : { label: "Open", tone: "open" }
  ];

  if (lotNet > 0) {
    badges.push({ label: "Profit", tone: "profit" });
  } else if (
    lotNet < 0 &&
    (totals.soldRevenue > 0 || totals.remainingQuantity === 0)
  ) {
    badges.push({ label: "Loss", tone: "loss" });
  } else if (totals.soldRevenue > 0) {
    badges.push({ label: "Break even", tone: "neutral" });
  }

  return badges;
}

function readStoredDeal(): StoredDeal {
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

function readStoredRecentBuys(): DealLot[] {
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

function clearLocalDealStorage() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(RECENT_BUYS_STORAGE_KEY);
}

function CardThumb({
  card,
  compact = false
}: {
  card: Pick<CardSearchResult, "name" | "imageUrl"> | Pick<DealItem, "name" | "imageUrl">;
  compact?: boolean;
}) {
  const sizeClass = compact ? "card-thumb compact" : "card-thumb";

  if (!card.imageUrl) {
    return <div className={`${sizeClass} placeholder`}>{card.name.slice(0, 2)}</div>;
  }

  return (
    <Image
      className={sizeClass}
      src={card.imageUrl}
      alt={`${card.name} card image`}
      width={compact ? 42 : 72}
      height={compact ? 58 : 100}
    />
  );
}

function createDealLotItem(item: DealItem): DealLotItem {
  const buyUnitPrice = suggestedBuyPrice(item);

  return {
    ...item,
    buyUnitPrice,
    buyTotal: roundCurrency(buyUnitPrice * item.quantity),
    soldQuantity: 0,
    sales: []
  };
}

function getSelectedVariant(card: CardSearchResult, selectedId?: string) {
  return (
    card.variants.find((variant) => variant.id === selectedId) ??
    card.variants[0]
  );
}

function saleDraftKey(lotId: string, itemId: string) {
  return `${lotId}|${itemId}`;
}

function toSearchFilters(
  query: string,
  setName: string,
  cardNumber: string,
  rarity: string
): SearchFilters {
  return {
    query: query.trim(),
    setName: setName.trim(),
    cardNumber: cardNumber.trim(),
    rarity: rarity.trim()
  };
}

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string
) {
  const trimmed = value.trim();
  if (trimmed) {
    params.set(key, trimmed);
  }
}

function formatCurrency(value: number) {
  return currencyFormatter.format(roundCurrency(value));
}

function formatPercent(value: number) {
  return `${percentFormatter.format(roundCurrency(value))}%`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function sourceLabel(source: CardSearchResult["priceSource"]) {
  if (source === "pokemon-tcg-api") {
    return "Pokemon TCG API";
  }

  if (source === "tcgplayer") {
    return "TCGplayer";
  }

  return "Mock";
}

function isValidPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_BUY_PERCENT;
  }

  return Math.min(100, Math.max(1, Math.round(value)));
}

function clampQuantityInput(value: string, maxQuantity: number) {
  if (value === "" || maxQuantity < 1) {
    return "";
  }

  const quantity = Math.floor(Number(value));
  if (!Number.isFinite(quantity)) {
    return "";
  }

  return Math.min(maxQuantity, Math.max(1, quantity)).toString();
}

function formatLotLabel(checkedOutAt: string) {
  return `Lot ${formatDateTime(checkedOutAt)}`;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
