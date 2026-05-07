"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CONDITIONS,
  type CardCondition,
  type DealItem,
  effectiveMarketPrice,
  roundCurrency,
  suggestedBuyPrice,
  totalPayout
} from "@/lib/deals";
import {
  DEFAULT_SEARCH_PAGE,
  SEARCH_PAGE_SIZE,
  type CardSearchResult,
  type ProviderSearchResponse
} from "@/lib/pricing/types";

const QUICK_PERCENTAGES = [70, 75, 80, 85, 90, 95, 100];
const STORAGE_KEY = "offertcg-current-deal-v1";
const DEFAULT_BUY_PERCENT = QUICK_PERCENTAGES[0];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

type StoredDeal = {
  cart?: DealItem[];
  globalBuyPercent?: number;
};

type ApiErrorResponse = {
  error?: string;
};

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

const EMPTY_SEARCH_PAGINATION: SearchPagination = {
  page: DEFAULT_SEARCH_PAGE,
  pageSize: SEARCH_PAGE_SIZE,
  count: 0,
  totalCount: 0
};

export default function Home() {
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
  const [globalBuyPercent, setGlobalBuyPercent] =
    useState(DEFAULT_BUY_PERCENT);
  const [hasHydrated, setHasHydrated] = useState(false);
  const resultListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rawDeal = window.localStorage.getItem(STORAGE_KEY);
    let storedDeal: StoredDeal = {};

    if (rawDeal) {
      try {
        storedDeal = JSON.parse(rawDeal) as StoredDeal;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const frame = window.requestAnimationFrame(() => {
      if (Array.isArray(storedDeal.cart)) {
        setCart(storedDeal.cart);
      }
      if (isValidPercent(storedDeal.globalBuyPercent)) {
        setGlobalBuyPercent(storedDeal.globalBuyPercent);
      }
      setHasHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cart, globalBuyPercent })
    );
  }, [cart, globalBuyPercent, hasHydrated]);

  useEffect(() => {
    resultListRef.current?.scrollTo({ top: 0 });
  }, [results]);

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
        <div className="summary-grid" aria-label="Current deal totals">
          <SummaryMetric label="Market value" value={formatCurrency(totals.marketValue)} />
          <SummaryMetric label="Suggested payout" value={formatCurrency(totals.payout)} strong />
          <SummaryMetric label="Cards" value={totals.quantity.toString()} />
        </div>
      </header>

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

function getSelectedVariant(card: CardSearchResult, selectedId?: string) {
  return (
    card.variants.find((variant) => variant.id === selectedId) ??
    card.variants[0]
  );
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

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
