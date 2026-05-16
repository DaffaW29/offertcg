import {
  BarChart3,
  Boxes,
  History,
  Map,
  ShoppingCart,
  WalletCards
} from "lucide-react";
import type { ActiveTab } from "../types";

export function WorkspaceTabs({
  activeTab,
  recentBuysCount,
  remainingQuantity,
  portfolioCount,
  onChangeTab
}: {
  activeTab: ActiveTab;
  recentBuysCount: number;
  remainingQuantity: number;
  portfolioCount: number;
  onChangeTab: (tab: ActiveTab) => void;
}) {
  return (
    <nav className="tab-bar" aria-label="Workspace views">
      <button
        className={activeTab === "current" ? "active" : ""}
        type="button"
        onClick={() => onChangeTab("current")}
      >
        <ShoppingCart size={17} />
        Current Deal
      </button>
      <button
        className={activeTab === "portfolio" ? "active" : ""}
        type="button"
        onClick={() => onChangeTab("portfolio")}
      >
        <WalletCards size={17} />
        Portfolio
        {portfolioCount > 0 ? (
          <span className="tab-count">{portfolioCount}</span>
        ) : null}
      </button>
      <button
        className={activeTab === "nearby" ? "active" : ""}
        type="button"
        onClick={() => onChangeTab("nearby")}
      >
        <Map size={17} />
        Nearby
      </button>
      <button
        className={activeTab === "recent" ? "active" : ""}
        type="button"
        onClick={() => onChangeTab("recent")}
      >
        <History size={17} />
        Recent Buys
        {recentBuysCount > 0 ? (
          <span className="tab-count">{recentBuysCount}</span>
        ) : null}
      </button>
      <button
        className={activeTab === "analytics" ? "active" : ""}
        type="button"
        onClick={() => onChangeTab("analytics")}
      >
        <BarChart3 size={17} />
        Analytics
      </button>
      <button
        className={activeTab === "inventory" ? "active" : ""}
        type="button"
        onClick={() => onChangeTab("inventory")}
      >
        <Boxes size={17} />
        Inventory
        {remainingQuantity > 0 ? (
          <span className="tab-count">{remainingQuantity}</span>
        ) : null}
      </button>
    </nav>
  );
}
