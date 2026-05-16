import type {
  Dispatch,
  FormEvent,
  RefObject,
  SetStateAction
} from "react";
import {
  CheckCircle,
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
import {
  CONDITIONS,
  effectiveMarketPrice,
  roundCurrency,
  suggestedBuyPrice,
  type CardCondition,
  type DealItem
} from "@/lib/deals";
import type { CardSearchResult } from "@/lib/pricing/types";
import {
  DEFAULT_BUY_PERCENT,
  QUICK_PERCENTAGES
} from "../constants";
import { clampPercent } from "../deal-helpers";
import {
  formatCurrency,
  formatPriceDate,
  sourceLabel
} from "../formatters";
import { getSelectedVariant } from "../search";
import type { DealCartTotals, SearchPagination } from "../types";
import {
  CardThumb,
  KPICard,
  RarityDot,
  ScreenBanner,
  SectionHeader,
  SpreadBar
} from "./primitives";

export function CurrentDealView({
  query,
  setName,
  cardNumber,
  rarity,
  addCondition,
  pushNoMarketCardsDown,
  searchError,
  providerNotice,
  isSearching,
  hasSearched,
  pagination,
  displayedResults,
  selectedVariants,
  totalPages,
  hasPagedResults,
  resultStart,
  resultEnd,
  canGoPrevious,
  canGoNext,
  resultListRef,
  cart,
  totals,
  globalBuyPercent,
  onQueryChange,
  onSetNameChange,
  onCardNumberChange,
  onRarityChange,
  onAddConditionChange,
  onPushNoMarketCardsDownChange,
  onSearch,
  onSelectedVariantsChange,
  onAddCard,
  onGoToSearchPage,
  onCheckoutCart,
  onExportCsv,
  onClearCart,
  onApplyGlobalPercent,
  onUpdateCartItem,
  onRemoveCartItem
}: {
  query: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  addCondition: CardCondition;
  pushNoMarketCardsDown: boolean;
  searchError: string;
  providerNotice: string;
  isSearching: boolean;
  hasSearched: boolean;
  pagination: SearchPagination;
  displayedResults: CardSearchResult[];
  selectedVariants: Record<string, string>;
  totalPages: number;
  hasPagedResults: boolean;
  resultStart: number;
  resultEnd: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  resultListRef: RefObject<HTMLDivElement | null>;
  cart: DealItem[];
  totals: DealCartTotals;
  globalBuyPercent: number;
  onQueryChange: (value: string) => void;
  onSetNameChange: (value: string) => void;
  onCardNumberChange: (value: string) => void;
  onRarityChange: (value: string) => void;
  onAddConditionChange: (value: CardCondition) => void;
  onPushNoMarketCardsDownChange: (value: boolean) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSelectedVariantsChange: Dispatch<SetStateAction<Record<string, string>>>;
  onAddCard: (card: CardSearchResult) => void;
  onGoToSearchPage: (page: number) => void;
  onCheckoutCart: () => void;
  onExportCsv: () => void;
  onClearCart: () => void;
  onApplyGlobalPercent: (percent: number) => void;
  onUpdateCartItem: (id: string, updater: (item: DealItem) => DealItem) => void;
  onRemoveCartItem: (id: string) => void;
}) {
  return (
    <>
      <ScreenBanner
        eyebrow="Vendor Buy Tool"
        title="Price the buy."
        titleAccent="Pay the right spread."
        subtitle="Search the live catalog, pick the exact print, dial in your global buy %, and watch the deal cart price itself in real time."
        kpis={
          <>
            <KPICard label="Market value" value={formatCurrency(totals.marketValue)} sub="Sum of selected cards" />
            <KPICard label="Suggested payout" value={formatCurrency(totals.payout)} sub={`At ${globalBuyPercent}% global`} accent />
            <KPICard label="Cards" value={totals.quantity.toString()} sub="In current deal" />
          </>
        }
      />

      <form className="surface" style={{ padding: 18, marginBottom: 18 }} onSubmit={onSearch}>
        <div className="search-grid">
          <div>
            <label className="field-label" htmlFor="card-search">Card search</label>
            <div className="search-input-wrap">
              <Search aria-hidden="true" size={16} />
              <input
                id="card-search"
                className="input input-search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Charizard ex, Pikachu, Umbreon VMAX..."
                autoComplete="off"
              />
              {query ? (
                <button
                  aria-label="Clear search"
                  className="input-clear"
                  type="button"
                  onClick={() => onQueryChange("")}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>
          <div>
            <label className="field-label">Set</label>
            <input
              className="input"
              value={setName}
              onChange={(event) => onSetNameChange(event.target.value)}
              placeholder="Obsidian Flames"
            />
          </div>
          <div>
            <label className="field-label">Number</label>
            <input
              className="input"
              value={cardNumber}
              onChange={(event) => onCardNumberChange(event.target.value)}
              placeholder="125/197"
            />
          </div>
          <div>
            <label className="field-label">Rarity</label>
            <input
              className="input"
              value={rarity}
              onChange={(event) => onRarityChange(event.target.value)}
              placeholder="Special Illustration Rare"
            />
          </div>
          <div>
            <label className="field-label">Condition</label>
            <select
              className="select"
              value={addCondition}
              onChange={(event) =>
                onAddConditionChange(event.target.value as CardCondition)
              }
            >
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSearching} style={{ alignSelf: "end", height: 40 }}>
            {isSearching ? <Loader2 className="spin" size={14} /> : <Search size={14} />}
            Search prices
          </button>
        </div>
        <label className="toggle-option" style={{ marginTop: 14 }}>
          <input
            type="checkbox"
            checked={pushNoMarketCardsDown}
            onChange={(event) =>
              onPushNoMarketCardsDownChange(event.target.checked)
            }
          />
          <span>Push no-market cards down the list</span>
        </label>
      </form>

      {searchError ? <p className="status-message error">{searchError}</p> : null}
      {providerNotice ? <p className="status-message warning">{providerNotice}</p> : null}

      <div className="workspace-grid">
        <section className="surface" style={{ padding: 20 }} aria-labelledby="results-heading">
          <SectionHeader
            eyebrow="Search Results"
            title="Select the exact card"
            right={
              <span className="chip">
                {hasSearched ? pagination.totalCount : 0} results
              </span>
            }
          />

          {isSearching ? (
            <div className="empty">
              <Loader2 className="spin" size={24} />
              <span style={{ marginTop: 8 }}>Looking up current prices...</span>
            </div>
          ) : null}

          {!isSearching && hasSearched && displayedResults.length === 0 && !searchError ? (
            <div className="empty">
              <span>No matching cards found. Try a shorter name or clear filters.</span>
            </div>
          ) : null}

          {!isSearching && !hasSearched ? (
            <div className="empty">
              <span>Search by card name to start a deal.</span>
            </div>
          ) : null}

          <div className="result-list" ref={resultListRef}>
            {displayedResults.map((card) => {
              const selectedVariant = getSelectedVariant(
                card,
                selectedVariants[card.id]
              );
              const inCart = cart.some((item) => item.providerCardId === card.id);

              return (
                <article className="result-card" key={card.id}>
                  <CardThumb card={card} />
                  <div className="result-details">
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{card.name}</h3>
                      <RarityDot rarity={card.rarity} />
                    </div>
                    <p className="text-sm text-2" style={{ marginBottom: 8 }}>
                      {card.setName} #{card.cardNumber} · <span className="text-3">{sourceLabel(card.priceSource)}</span>
                    </p>
                    <div className="result-controls">
                      <select
                        className="select"
                        style={{ height: 34, fontSize: 12 }}
                        value={selectedVariant?.id ?? ""}
                        onChange={(event) =>
                          onSelectedVariantsChange((current) => ({
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
                      <div style={{ textAlign: "right" }}>
                        <div className="text-xs text-3" style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Market</div>
                        <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>
                          {selectedVariant?.marketPrice === null || selectedVariant === undefined
                            ? "Manual"
                            : formatCurrency(selectedVariant.marketPrice)}
                        </div>
                      </div>
                      <button
                        className="btn btn-soft btn-sm"
                        type="button"
                        onClick={() => onAddCard(card)}
                        disabled={inCart}
                      >
                        <Plus size={12} />
                        {inCart ? "Added" : "Add"}
                      </button>
                    </div>
                    <div className="result-meta">
                      <span>{formatPriceDate(card.lastUpdated)}</span>
                      {card.externalUrl ? (
                        <a href={card.externalUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                          View source →
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
              <span className="text-xs text-3">
                Showing {resultStart}-{resultEnd} of {pagination.totalCount}
              </span>
              <div className="pagination-controls">
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => onGoToSearchPage(pagination.page - 1)}
                  disabled={!canGoPrevious || isSearching}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <span className="chip">
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => onGoToSearchPage(pagination.page + 1)}
                  disabled={!canGoNext || isSearching}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="surface" style={{ padding: 20 }} aria-labelledby="cart-heading">
          <SectionHeader
            eyebrow="Deal Cart"
            title="Suggested payout"
            right={
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-soft btn-sm"
                  type="button"
                  onClick={onCheckoutCart}
                  disabled={cart.length === 0}
                >
                  <CheckCircle size={12} /> Checkout
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={onExportCsv}
                  disabled={cart.length === 0}
                >
                  <Download size={12} /> CSV
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  type="button"
                  onClick={onClearCart}
                  disabled={cart.length === 0}
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            }
          />

          <div style={{ marginBottom: 18 }}>
            <div className="field-label" style={{ marginBottom: 8 }}>Global buy %</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {QUICK_PERCENTAGES.map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => onApplyGlobalPercent(percent)}
                  className={`percent-chip${percent === globalBuyPercent ? " active" : ""}`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          <div className="deal-table">
            <div className="deal-table-header">
              <div>Card</div>
              <div>Condition</div>
              <div>Market</div>
              <div style={{ textAlign: "right" }}>Buy %</div>
              <div style={{ textAlign: "right" }}>Qty</div>
              <div style={{ textAlign: "right" }}>Each</div>
            </div>

            {cart.length === 0 ? (
              <div className="empty" style={{ padding: "32px 0" }}>
                <span>Add cards from search results to price a deal.</span>
              </div>
            ) : null}

            {cart.map((item) => {
              const each = suggestedBuyPrice(item);
              const market = effectiveMarketPrice(item);
              return (
                <div key={item.id} className="deal-table-row">
                  <div className="deal-card-cell">
                    <CardThumb card={item} compact />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                      <div className="text-xs text-3" style={{ marginBottom: 4 }}>{item.setName} #{item.cardNumber}</div>
                      <RarityDot rarity={item.rarity} />
                    </div>
                  </div>
                  <div>
                    <select
                      className="select"
                      style={{ height: 30, fontSize: 12 }}
                      value={item.condition}
                      onChange={(event) =>
                        onUpdateCartItem(item.id, (current) => ({
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
                  </div>
                  <div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{formatCurrency(market)}</div>
                    <div className="text-xs text-3">
                      {item.marketPriceMissing ? "No market" : `Market ${formatCurrency(item.marketPrice)}`}
                    </div>
                    <SpreadBar market={market} buyPct={item.buyPercent} />
                    <input
                      className="input mono"
                      type="number"
                      min="0"
                      step="0.01"
                      style={{ height: 26, padding: "0 6px", fontSize: 11, marginTop: 4, width: "100%" }}
                      value={item.manualMarketPrice ?? ""}
                      onChange={(event) =>
                        onUpdateCartItem(item.id, (current) => ({
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
                  <div>
                    <input
                      className="input mono"
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      style={{ height: 30, padding: "0 8px", textAlign: "right", fontSize: 12, width: 64 }}
                      value={item.buyPercent}
                      onChange={(event) =>
                        onUpdateCartItem(item.id, (current) => ({
                          ...current,
                          buyPercent: clampPercent(Number(event.target.value))
                        }))
                      }
                    />
                  </div>
                  <div>
                    <input
                      className="input mono"
                      type="number"
                      min="1"
                      step="1"
                      style={{ height: 30, padding: "0 8px", textAlign: "right", fontSize: 12, width: 56 }}
                      value={item.quantity}
                      onChange={(event) =>
                        onUpdateCartItem(item.id, (current) => ({
                          ...current,
                          quantity: Math.max(1, Math.floor(Number(event.target.value) || 1))
                        }))
                      }
                    />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>
                      {formatCurrency(each)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCartItem(item.id)}
                      style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginTop: 2 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {cart.length > 0 ? (
              <div className="deal-table-totals">
                <div style={{ fontWeight: 800, fontSize: 16 }}>Totals</div>
                <div />
                <div />
                <div />
                <div className="mono" style={{ textAlign: "right", fontWeight: 700, fontSize: 14 }}>
                  {totals.quantity}
                </div>
                <div className="mono" style={{ textAlign: "right", fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>
                  {formatCurrency(totals.payout)}
                </div>
              </div>
            ) : null}
          </div>

          {cart.length > 0 ? (
            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => onApplyGlobalPercent(DEFAULT_BUY_PERCENT)}
              >
                <RotateCcw size={12} />
                Reset all to {DEFAULT_BUY_PERCENT}%
              </button>
              <div className="text-xs text-3">
                Spread captured:{" "}
                <span className="mono" style={{ fontWeight: 700, color: "var(--pos)" }}>
                  {formatCurrency(totals.marketValue - totals.payout)}
                </span>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
