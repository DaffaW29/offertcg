import type { DealLot } from "@/lib/deals";
import type {
  InventoryMode,
  InventoryRow,
  InventorySort
} from "../types";
import {
  formatCurrency,
  formatDateTime
} from "../formatters";
import {
  CardThumb,
  KPICard,
  RarityDot,
  ScreenBanner,
  SectionHeader,
  SpreadIndicator
} from "./primitives";

export function InventoryView({
  recentBuys,
  inventoryRows,
  inventoryQuery,
  inventoryMode,
  inventorySort,
  onInventoryQueryChange,
  onInventoryModeChange,
  onInventorySortChange,
  onViewLot
}: {
  recentBuys: DealLot[];
  inventoryRows: InventoryRow[];
  inventoryQuery: string;
  inventoryMode: InventoryMode;
  inventorySort: InventorySort;
  onInventoryQueryChange: (value: string) => void;
  onInventoryModeChange: (mode: InventoryMode) => void;
  onInventorySortChange: (sort: InventorySort) => void;
  onViewLot: (lotId: string) => void;
}) {
  const totalMarketValue = inventoryRows.reduce((sum, r) => sum + r.marketValue, 0);
  const totalCost = inventoryRows.reduce((sum, r) => sum + r.buyCost, 0);
  const totalSpread = inventoryRows.reduce((sum, r) => sum + r.spread, 0);
  const maxMarketValue = Math.max(...inventoryRows.map((r) => r.marketValue), 1);

  return (
    <>
      <ScreenBanner
        eyebrow="Inventory"
        title="Your living card"
        titleAccent="portfolio."
        subtitle="Every card you own, its current market value, and the spread you're sitting on."
        kpis={
          <>
            <KPICard label="Cards on hand" value={inventoryRows.length.toString()} sub="Unique line items" />
            <KPICard label="Market value" value={formatCurrency(totalMarketValue)} sub="At current prices" accent />
            <KPICard label="Total spread" value={formatCurrency(totalSpread)} sub={`Cost: ${formatCurrency(totalCost)}`} />
          </>
        }
      />

      <div className="surface" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "end" }}>
          <div>
            <label className="field-label">Search inventory</label>
            <input
              className="input"
              value={inventoryQuery}
              onChange={(event) => onInventoryQueryChange(event.target.value)}
              placeholder="Card, set, lot, condition..."
            />
          </div>
          <div>
            <label className="field-label">Sort by</label>
            <select
              className="select"
              value={inventorySort}
              onChange={(event) =>
                onInventorySortChange(event.target.value as InventorySort)
              }
            >
              <option value="value">Market value</option>
              <option value="cost">Remaining cost</option>
              <option value="spread">Potential spread</option>
              <option value="newest">Newest lot</option>
              <option value="name">Card name</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className={`percent-chip${inventoryMode === "unsold" ? " active" : ""}`}
              type="button"
              onClick={() => onInventoryModeChange("unsold")}
            >
              Unsold
            </button>
            <button
              className={`percent-chip${inventoryMode === "all" ? " active" : ""}`}
              type="button"
              onClick={() => onInventoryModeChange("all")}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <section className="surface" style={{ padding: 20 }}>
        <SectionHeader
          title="Cards on hand"
          right={<span className="chip">{inventoryRows.length} rows</span>}
        />

        {recentBuys.length === 0 ? (
          <div className="empty" style={{ padding: 48 }}>
            <span>Checkout a deal cart to start building inventory.</span>
          </div>
        ) : inventoryRows.length === 0 ? (
          <div className="empty" style={{ padding: 48 }}>
            <span>No inventory rows match the current filters.</span>
          </div>
        ) : (
          <>
            <div className="inventory-grid-header">
              <div>Card</div>
              <div>Lot</div>
              <div>Left</div>
              <div>Cost basis</div>
              <div>Market</div>
              <div>Spread</div>
              <div />
            </div>
            {inventoryRows.map((row) => (
              <div key={row.id} className="inventory-grid-row">
                <div className="deal-card-cell">
                  <CardThumb card={row.item} compact />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.item.name}
                    </div>
                    <div className="text-xs text-3">
                      {row.item.setName} #{row.item.cardNumber}
                    </div>
                    <RarityDot rarity={row.item.rarity} />
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{row.lotLabel}</div>
                  <div className="text-xs text-3">{formatDateTime(row.checkedOutAt)}</div>
                </div>
                <div>
                  <span className="mono" style={{ fontWeight: 700 }}>
                    {row.remaining}
                  </span>
                  <span className="text-xs text-3"> / {row.item.quantity}</span>
                </div>
                <div className="mono" style={{ fontSize: 13 }}>{formatCurrency(row.buyCost)}</div>
                <div>
                  <SpreadIndicator value={row.marketValue} maxValue={maxMarketValue} />
                </div>
                <div>
                  <span
                    className="mono"
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: row.spread >= 0 ? "var(--pos)" : "var(--neg)"
                    }}
                  >
                    {formatCurrency(row.spread)}
                  </span>
                </div>
                <div>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => onViewLot(row.lotId)}
                  >
                    View lot
                  </button>
                </div>
              </div>
            ))}
            <div className="inventory-grid-totals">
              <div style={{ fontWeight: 800, fontSize: 14 }}>Totals</div>
              <div />
              <div className="mono" style={{ fontWeight: 700 }}>
                {inventoryRows.reduce((sum, r) => sum + r.remaining, 0)}
              </div>
              <div className="mono" style={{ fontWeight: 700 }}>{formatCurrency(totalCost)}</div>
              <div className="mono" style={{ fontWeight: 700 }}>{formatCurrency(totalMarketValue)}</div>
              <div className="mono" style={{ fontWeight: 800, color: totalSpread >= 0 ? "var(--pos)" : "var(--neg)" }}>
                {formatCurrency(totalSpread)}
              </div>
              <div />
            </div>
          </>
        )}
      </section>
    </>
  );
}
