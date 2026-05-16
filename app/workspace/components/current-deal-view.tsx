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
  totalPayout,
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
import { CardThumb } from "./primitives";

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
      <section className="search-panel">
        <form className="search-form" onSubmit={onSearch}>
          <div className="search-main">
            <label htmlFor="card-search">Card search</label>
            <div className="search-input-wrap">
              <Search aria-hidden="true" size={22} />
              <input
                id="card-search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Charizard ex, Pikachu, Umbreon VMAX..."
                autoComplete="off"
              />
              {query ? (
                <button
                  aria-label="Clear search"
                  className="icon-button"
                  type="button"
                  onClick={() => onQueryChange("")}
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
                onChange={(event) => onSetNameChange(event.target.value)}
                placeholder="Obsidian Flames"
              />
            </label>
            <label>
              Card number
              <input
                value={cardNumber}
                onChange={(event) => onCardNumberChange(event.target.value)}
                placeholder="125/197"
              />
            </label>
            <label>
              Rarity
              <input
                value={rarity}
                onChange={(event) => onRarityChange(event.target.value)}
                placeholder="Special Illustration Rare"
              />
            </label>
            <label>
              Add condition
              <select
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

        <div className="search-options" aria-label="Search result options">
          <label className="toggle-option">
            <input
              type="checkbox"
              checked={pushNoMarketCardsDown}
              onChange={(event) =>
                onPushNoMarketCardsDownChange(event.target.checked)
              }
            />
            <span>Push no-market cards down</span>
          </label>
        </div>

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

          {!isSearching && hasSearched && displayedResults.length === 0 && !searchError ? (
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
            {displayedResults.map((card) => {
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
                        onClick={() => onAddCard(card)}
                      >
                        <Plus size={17} />
                        Add
                      </button>
                    </div>
                    <div className="result-meta">
                      <span>{formatPriceDate(card.lastUpdated)}</span>
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
                  onClick={() => onGoToSearchPage(pagination.page - 1)}
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
                  onClick={() => onGoToSearchPage(pagination.page + 1)}
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
                onClick={onCheckoutCart}
                disabled={cart.length === 0}
              >
                <CheckCircle size={17} />
                Checkout
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={onExportCsv}
                disabled={cart.length === 0}
              >
                <Download size={17} />
                CSV
              </button>
              <button
                className="ghost-button danger"
                type="button"
                onClick={onClearCart}
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
                  onApplyGlobalPercent(Number(event.target.value))
                }
              />
            </label>
            <div className="quick-buttons">
              {QUICK_PERCENTAGES.map((percent) => (
                <button
                  className={percent === globalBuyPercent ? "active" : ""}
                  key={percent}
                  type="button"
                  onClick={() => onApplyGlobalPercent(percent)}
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
                            onUpdateCartItem(item.id, (current) => ({
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
                          onUpdateCartItem(item.id, (current) => ({
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
                          onUpdateCartItem(item.id, (current) => ({
                            ...current,
                            quantity: Math.max(
                              1,
                              Math.floor(Number(event.target.value) || 1)
                            )
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
                        onClick={() => onRemoveCartItem(item.id)}
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
              onClick={() => onApplyGlobalPercent(DEFAULT_BUY_PERCENT)}
            >
              <RotateCcw size={16} />
              Reset all cards to {DEFAULT_BUY_PERCENT}%
            </button>
          ) : null}
        </section>
      </section>
    </>
  );
}
