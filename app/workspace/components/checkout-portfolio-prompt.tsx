import { Eye, EyeOff, X } from "lucide-react";
import type { DealLot } from "@/lib/deals";
import { CardThumb } from "./primitives";

export type CheckoutItemSelection = Record<string, boolean>;
export type CheckoutItemVisibility = Record<string, boolean>;

export function CheckoutPortfolioPrompt({
  lot,
  selection,
  visibility,
  onToggleSelection,
  onToggleVisibility,
  onSelectAll,
  onDeselectAll,
  onAddAll,
  onAddSelected,
  onSkip
}: {
  lot: DealLot;
  selection: CheckoutItemSelection;
  visibility: CheckoutItemVisibility;
  onToggleSelection: (itemId: string) => void;
  onToggleVisibility: (itemId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAddAll: () => void;
  onAddSelected: () => void;
  onSkip: () => void;
}) {
  const selectedCount = lot.items.filter((item) => selection[item.id] !== false).length;
  const allSelected = selectedCount === lot.items.length;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Post-Checkout</div>
            <h2 style={{ fontFamily: "var(--font-display-family)", fontWeight: 700, fontSize: 22, margin: 0 }}>
              Add to Portfolio
            </h2>
            <p className="text-sm text-2" style={{ marginTop: 4 }}>
              {lot.label} · {lot.items.length} card{lot.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <button className="topbar-icon-btn" type="button" onClick={onSkip} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-toolbar">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          <span className="text-xs text-3">{selectedCount} of {lot.items.length} selected</span>
        </div>

        <div className="modal-body">
          {lot.items.map((item) => {
            const isSelected = selection[item.id] !== false;
            const isVisible = visibility[item.id] !== false;

            return (
              <div
                key={item.id}
                className={`checkout-item${isSelected ? " selected" : ""}`}
              >
                <label className="checkout-item-check">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(item.id)}
                  />
                </label>
                <CardThumb card={item} compact />
                <div className="checkout-item-info">
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                  <div className="text-xs text-3">
                    {item.setName} #{item.cardNumber} · {item.variantLabel} · {item.condition}
                  </div>
                </div>
                <button
                  className={`visibility-toggle${isVisible ? " public" : ""}`}
                  type="button"
                  onClick={() => onToggleVisibility(item.id)}
                  aria-label={isVisible ? "Visible to others" : "Hidden from others"}
                  title={isVisible ? "Public — visible to others" : "Private — hidden from others"}
                >
                  {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span className="text-xs">{isVisible ? "Public" : "Private"}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" type="button" onClick={onAddAll}>
            Add All ({lot.items.length})
          </button>
          <button
            className="btn btn-soft"
            type="button"
            onClick={onAddSelected}
            disabled={selectedCount === 0}
          >
            Add Selected ({selectedCount})
          </button>
          <button className="btn btn-ghost" type="button" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
