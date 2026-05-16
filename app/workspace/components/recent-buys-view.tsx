import type { FormEvent } from "react";
import { CheckCircle, Pencil, Trash2, X } from "lucide-react";
import {
  grossProfit,
  lotNetProfit,
  lotTotals,
  portfolioTotals,
  remainingQuantity,
  roiPercent,
  soldRevenue,
  type DealLot
} from "@/lib/deals";
import {
  LOT_HISTORY_FILTER_OPTIONS,
  LOT_HISTORY_SORT_OPTIONS,
  MAX_LOT_LABEL_LENGTH
} from "../constants";
import {
  clampQuantityInput,
  saleDraftKey
} from "../deal-helpers";
import { lotStatusBadges } from "../analytics";
import {
  formatCurrency,
  formatDateTime,
  formatPercent
} from "../formatters";
import type {
  LotHistoryFilter,
  LotHistorySort,
  SaleDraft
} from "../types";
import { CardThumb, MetricStack, SummaryMetric } from "./primitives";

export function RecentBuysView({
  recentBuys,
  portfolioSummary,
  visibleLots,
  historySelectedLot,
  historySelectedLotTotals,
  saleDrafts,
  editingLotId,
  lotNameDraft,
  lotRenameError,
  isRenamingLot,
  lotHistoryQuery,
  lotHistoryFilter,
  lotHistorySort,
  onLotHistoryQueryChange,
  onLotHistoryFilterChange,
  onLotHistorySortChange,
  onSelectLot,
  onStartRenamingLot,
  onCancelRenamingLot,
  onSaveLotRename,
  onLotNameDraftChange,
  onDeleteLot,
  onUpdateSaleDraft,
  onMarkItemSold
}: {
  recentBuys: DealLot[];
  portfolioSummary: ReturnType<typeof portfolioTotals>;
  visibleLots: DealLot[];
  historySelectedLot: DealLot | null;
  historySelectedLotTotals: ReturnType<typeof lotTotals> | null;
  saleDrafts: Record<string, SaleDraft>;
  editingLotId: string | null;
  lotNameDraft: string;
  lotRenameError: string;
  isRenamingLot: boolean;
  lotHistoryQuery: string;
  lotHistoryFilter: LotHistoryFilter;
  lotHistorySort: LotHistorySort;
  onLotHistoryQueryChange: (value: string) => void;
  onLotHistoryFilterChange: (value: LotHistoryFilter) => void;
  onLotHistorySortChange: (value: LotHistorySort) => void;
  onSelectLot: (lotId: string) => void;
  onStartRenamingLot: (lot: DealLot) => void;
  onCancelRenamingLot: () => void;
  onSaveLotRename: (event: FormEvent<HTMLFormElement>, lotId: string) => void;
  onLotNameDraftChange: (value: string) => void;
  onDeleteLot: (lotId: string) => void;
  onUpdateSaleDraft: (key: string, draft: SaleDraft) => void;
  onMarkItemSold: (lotId: string, itemId: string) => void;
}) {
  return (
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
              onChange={(event) => onLotHistoryQueryChange(event.target.value)}
              placeholder="Lot, card, set, condition..."
            />
          </label>
          <label>
            Sort by
            <select
              value={lotHistorySort}
              onChange={(event) =>
                onLotHistorySortChange(event.target.value as LotHistorySort)
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
                className={lotHistoryFilter === option.value ? "active" : ""}
                key={option.value}
                type="button"
                onClick={() => onLotHistoryFilterChange(option.value)}
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
                    onClick={() => onSelectLot(lot.id)}
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
                <div className="lot-detail-title">
                  {editingLotId === historySelectedLot.id ? (
                    <form
                      className="lot-rename-form"
                      onSubmit={(event) =>
                        onSaveLotRename(event, historySelectedLot.id)
                      }
                    >
                      <p className="eyebrow">Lot detail</p>
                      <label htmlFor={`lot-name-${historySelectedLot.id}`}>
                        Lot name
                      </label>
                      <div className="lot-rename-controls">
                        <input
                          id={`lot-name-${historySelectedLot.id}`}
                          maxLength={MAX_LOT_LABEL_LENGTH}
                          value={lotNameDraft}
                          onChange={(event) =>
                            onLotNameDraftChange(event.target.value)
                          }
                          autoFocus
                          disabled={isRenamingLot}
                        />
                        <button
                          className="secondary-button"
                          type="submit"
                          disabled={
                            isRenamingLot || lotNameDraft.trim().length === 0
                          }
                        >
                          <CheckCircle size={17} />
                          Save
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={onCancelRenamingLot}
                          disabled={isRenamingLot}
                        >
                          <X size={17} />
                          Cancel
                        </button>
                      </div>
                      {lotRenameError ? (
                        <p className="input-error">{lotRenameError}</p>
                      ) : null}
                      <p className="muted">
                        Checked out {formatDateTime(historySelectedLot.checkedOutAt)}
                      </p>
                    </form>
                  ) : (
                    <div>
                      <p className="eyebrow">Lot detail</p>
                      <h2>{historySelectedLot.label}</h2>
                      <p className="muted">
                        Checked out {formatDateTime(historySelectedLot.checkedOutAt)}
                      </p>
                    </div>
                  )}
                  {editingLotId === historySelectedLot.id ? null : (
                    <div className="lot-title-actions">
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => onStartRenamingLot(historySelectedLot)}
                      >
                        <Pencil size={17} />
                        Rename
                      </button>
                      <button
                        className="ghost-button danger"
                        type="button"
                        onClick={() => onDeleteLot(historySelectedLot.id)}
                      >
                        <Trash2 size={17} />
                        Delete lot
                      </button>
                    </div>
                  )}
                </div>
                <div className="lot-metrics" aria-label="Selected lot totals">
                  <SummaryMetric
                    label="Buy cost"
                    value={formatCurrency(historySelectedLotTotals.buyCost)}
                  />
                  <SummaryMetric
                    label="Sold"
                    value={formatCurrency(historySelectedLotTotals.soldRevenue)}
                  />
                  <SummaryMetric
                    label="Lot net"
                    value={formatCurrency(lotNetProfit(historySelectedLot))}
                    strong
                  />
                  <SummaryMetric
                    label="Sold profit"
                    value={formatCurrency(historySelectedLotTotals.grossProfit)}
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
                        <MetricStack label="Remaining" value={remaining.toString()} />
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
                              onUpdateSaleDraft(key, {
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
                              onUpdateSaleDraft(key, {
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
                          onClick={() => onMarkItemSold(historySelectedLot.id, item.id)}
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
  );
}
