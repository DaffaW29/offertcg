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
import {
  CardThumb,
  KPICard,
  ScreenBanner,
  SectionHeader
} from "./primitives";

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
    <>
      <ScreenBanner
        eyebrow="Recent Buys"
        title="Every lot, tracked"
        titleAccent="end-to-end."
        subtitle="See what you bought, what you sold, and what's still sitting. Track each lot from checkout to profit."
        kpis={
          <>
            <KPICard label="Total buy cost" value={formatCurrency(portfolioSummary.buyCost)} sub="All lots combined" />
            <KPICard label="Sold revenue" value={formatCurrency(portfolioSummary.soldRevenue)} sub="Total realized" />
            <KPICard label="Gross profit" value={formatCurrency(portfolioSummary.realizedProfit)} sub="Revenue − cost" accent />
          </>
        }
      />

      {recentBuys.length > 0 ? (
        <div className="surface" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "end" }}>
            <div>
              <label className="field-label">Search lots</label>
              <input
                className="input"
                value={lotHistoryQuery}
                onChange={(event) => onLotHistoryQueryChange(event.target.value)}
                placeholder="Lot, card, set, condition..."
              />
            </div>
            <div>
              <label className="field-label">Sort by</label>
              <select
                className="select"
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
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LOT_HISTORY_FILTER_OPTIONS.map((option) => (
                <button
                  className={`percent-chip${lotHistoryFilter === option.value ? " active" : ""}`}
                  key={option.value}
                  type="button"
                  onClick={() => onLotHistoryFilterChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {recentBuys.length === 0 ? (
        <div className="surface empty" style={{ padding: 48 }}>
          <span>Checkout a deal cart to start tracking recent buys.</span>
        </div>
      ) : visibleLots.length === 0 ? (
        <div className="surface empty" style={{ padding: 48 }}>
          <span>No lots match the current history filters.</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 18 }}>
          <aside className="surface" style={{ padding: 20 }}>
            <SectionHeader eyebrow="Recent Buys" title="Lots" />
            <div className="lot-list">
              {visibleLots.map((lot) => {
                const totals = lotTotals(lot);
                const lotNet = lotNetProfit(lot);
                const badges = lotStatusBadges(lot);
                const isActive = historySelectedLot?.id === lot.id;

                return (
                  <button
                    className={`lot-list-item${isActive ? " active" : ""}`}
                    key={lot.id}
                    type="button"
                    onClick={() => onSelectLot(lot.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: 14 }}>{lot.label}</strong>
                        <div className="text-xs text-3">{formatDateTime(lot.checkedOutAt)}</div>
                      </div>
                      <span className="status-badges">
                        {badges.map((badge) => (
                          <span
                            className={`chip chip-${badge.tone === "profit" ? "pos" : badge.tone === "loss" ? "neg" : "accent"}`}
                            key={badge.label}
                            style={{ fontSize: 10 }}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="text-xs text-3" style={{ marginTop: 6 }}>
                      {totals.remainingQuantity} left · {formatCurrency(lotNet)} net · {formatPercent(roiPercent(lotNet, totals.buyCost))}
                    </div>
                    <div className="lot-progress-bar">
                      <div
                        style={{
                          width: `${totals.quantity > 0 ? ((totals.quantity - totals.remainingQuantity) / totals.quantity) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {historySelectedLot && historySelectedLotTotals ? (
            <section className="surface" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  {editingLotId === historySelectedLot.id ? (
                    <form
                      onSubmit={(event) =>
                        onSaveLotRename(event, historySelectedLot.id)
                      }
                    >
                      <div className="eyebrow" style={{ marginBottom: 4 }}>Lot detail</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          className="input"
                          style={{ maxWidth: 300 }}
                          maxLength={MAX_LOT_LABEL_LENGTH}
                          value={lotNameDraft}
                          onChange={(event) =>
                            onLotNameDraftChange(event.target.value)
                          }
                          autoFocus
                          disabled={isRenamingLot}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          type="submit"
                          disabled={isRenamingLot || lotNameDraft.trim().length === 0}
                        >
                          <CheckCircle size={12} /> Save
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={onCancelRenamingLot}
                          disabled={isRenamingLot}
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                      {lotRenameError ? (
                        <p className="text-xs" style={{ color: "var(--neg)", marginTop: 4 }}>{lotRenameError}</p>
                      ) : null}
                    </form>
                  ) : (
                    <div>
                      <div className="eyebrow" style={{ marginBottom: 4 }}>Lot detail</div>
                      <h2 style={{ fontFamily: "var(--font-display-family)", fontWeight: 700, fontSize: 22, margin: 0 }}>
                        {historySelectedLot.label}
                      </h2>
                      <div className="text-xs text-3" style={{ marginTop: 4 }}>
                        Checked out {formatDateTime(historySelectedLot.checkedOutAt)}
                      </div>
                    </div>
                  )}
                </div>
                {editingLotId !== historySelectedLot.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => onStartRenamingLot(historySelectedLot)}
                    >
                      <Pencil size={12} /> Rename
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={() => onDeleteLot(historySelectedLot.id)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="kpi-strip" style={{ marginBottom: 18 }}>
                <KPICard label="Buy cost" value={formatCurrency(historySelectedLotTotals.buyCost)} />
                <KPICard label="Sold" value={formatCurrency(historySelectedLotTotals.soldRevenue)} />
                <KPICard label="Lot net" value={formatCurrency(lotNetProfit(historySelectedLot))} accent />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {historySelectedLot.items.map((item) => {
                  const key = saleDraftKey(historySelectedLot.id, item.id);
                  const draft = saleDrafts[key] ?? { quantity: "", saleTotal: "" };
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
                    <article
                      key={item.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: 14,
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 14,
                        alignItems: "center"
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <CardThumb card={item} compact />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                          <div className="text-xs text-3">
                            {item.setName} #{item.cardNumber} · {item.variantLabel} · {item.condition}
                          </div>
                          <div className="text-xs" style={{ marginTop: 4, display: "flex", gap: 12 }}>
                            <span>Bought: <strong>{item.quantity}</strong></span>
                            <span>Left: <strong>{remaining}</strong></span>
                            <span>Cost: <strong>{formatCurrency(item.buyTotal)}</strong></span>
                            <span>Sold: <strong>{formatCurrency(soldRevenue(item))}</strong></span>
                            <span style={{ color: grossProfit(item) >= 0 ? "var(--pos)" : "var(--neg)" }}>
                              Profit: <strong>{formatCurrency(grossProfit(item))}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                        <div>
                          <label className="field-label">Qty</label>
                          <input
                            className="input mono"
                            type="number"
                            min="1"
                            max={remaining}
                            step="1"
                            style={{ width: 60, height: 32, fontSize: 12, textAlign: "right" }}
                            value={draft.quantity}
                            onChange={(event) =>
                              onUpdateSaleDraft(key, {
                                ...draft,
                                quantity: clampQuantityInput(event.target.value, remaining)
                              })
                            }
                            disabled={remaining === 0}
                          />
                        </div>
                        <div>
                          <label className="field-label">Sale $</label>
                          <input
                            className="input mono"
                            type="number"
                            min="0"
                            step="0.01"
                            style={{ width: 80, height: 32, fontSize: 12, textAlign: "right" }}
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
                        </div>
                        <button
                          className="btn btn-soft btn-sm"
                          type="button"
                          onClick={() => onMarkItemSold(historySelectedLot.id, item.id)}
                          disabled={!canRecordSale}
                        >
                          <CheckCircle size={12} /> Mark sold
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
