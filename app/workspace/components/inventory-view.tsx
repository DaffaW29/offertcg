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
import { CardThumb } from "./primitives";

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
  return (
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
              onChange={(event) => onInventoryQueryChange(event.target.value)}
              placeholder="Card, set, lot, condition..."
            />
          </label>
          <label>
            Sort by
            <select
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
          </label>
          <div className="segmented-control" aria-label="Inventory mode">
            <button
              className={inventoryMode === "unsold" ? "active" : ""}
              type="button"
              onClick={() => onInventoryModeChange("unsold")}
            >
              Unsold
            </button>
            <button
              className={inventoryMode === "all" ? "active" : ""}
              type="button"
              onClick={() => onInventoryModeChange("all")}
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
                        onClick={() => onViewLot(row.lotId)}
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
  );
}
