import Image from "next/image";
import type { DealItem } from "@/lib/deals";
import type { CardSearchResult } from "@/lib/pricing/types";
import type { LotPerformance } from "../types";
import {
  formatCurrency,
  formatDateTime,
  formatPercent
} from "../formatters";

export function SummaryMetric({
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

export function MetricStack({
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

export function LotPerformanceCard({
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

export function CardThumb({
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
