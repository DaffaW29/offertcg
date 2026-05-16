import Image from "next/image";
import type { ReactNode } from "react";
import type { DealItem } from "@/lib/deals";
import type { CardSearchResult } from "@/lib/pricing/types";
import type { LotPerformance } from "../types";
import {
  formatCurrency,
  formatDateTime,
  formatPercent
} from "../formatters";

// ─── Legacy components (preserved) ────────────────────────────

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

// ─── New design system components ─────────────────────────────

export function ScreenBanner({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  kpis
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  kpis?: ReactNode;
}) {
  return (
    <div className="banner">
      <div>
        <div className="eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>
        <h1 className="banner-title">
          {title}
          {titleAccent ? (
            <>
              <br />
              <span style={{ color: "var(--accent)" }}>{titleAccent}</span>
            </>
          ) : null}
        </h1>
        {subtitle ? <p className="banner-sub">{subtitle}</p> : null}
      </div>
      {kpis ? <div className="kpi-strip">{kpis}</div> : null}
    </div>
  );
}

export function KPICard({
  label,
  value,
  sub,
  accent = false
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`kpi-card${accent ? " accent" : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-foot">{sub}</div> : null}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  right
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div style={{ minWidth: 0 }}>
        {eyebrow ? <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div> : null}
        <h3>{title}</h3>
      </div>
      {right}
    </div>
  );
}

export function Sparkline({
  data,
  width = 64,
  height = 22,
  color = "currentColor",
  fill = true,
  strokeWidth = 1.5
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 2) + 1;
      const y = height - 2 - ((v - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = fill
    ? `M ${pts.split(" ")[0]} L ${pts} L ${width - 1},${height - 1} L 1,${height - 1} Z`
    : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {area ? <path d={area} fill={color} opacity="0.12" /> : null}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SpreadBar({
  market,
  buyPct
}: {
  market: number;
  buyPct: number;
}) {
  const payoutFraction = buyPct / 100;
  return (
    <div
      style={{
        marginTop: 6,
        height: 4,
        background: "var(--bg-muted)",
        borderRadius: 999,
        position: "relative",
        overflow: "visible"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${Math.min(100, payoutFraction * 100)}%`,
          background: "var(--accent)",
          borderRadius: 999
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -2,
          top: -3,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--accent-2)",
          border: "2px solid var(--bg-surface)"
        }}
        title={`Market $${market.toFixed(2)}`}
      />
    </div>
  );
}

export function SpreadIndicator({
  value,
  maxValue
}: {
  value: number;
  maxValue: number;
}) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "var(--bg-muted)",
          borderRadius: 999,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--accent)",
            borderRadius: 999,
            transition: "width .2s"
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: 12,
          fontWeight: 600,
          minWidth: 52,
          textAlign: "right"
        }}
      >
        ${value.toFixed(2)}
      </span>
    </div>
  );
}

const RARITY_MAP: Record<string, { color: string; label: string }> = {
  "Special Illustration Rare": { color: "oklch(0.7 0.18 320)", label: "SIR" },
  "Rare Rainbow": { color: "oklch(0.7 0.18 30)", label: "RBW" },
  "Rare Holo VMAX": { color: "oklch(0.6 0.18 280)", label: "VMX" },
  "Rare Holo EX": { color: "oklch(0.6 0.18 60)", label: "EX" },
  "Rare Holo": { color: "oklch(0.65 0.15 130)", label: "HR" },
  "Illustration Rare": { color: "oklch(0.7 0.17 200)", label: "IR" },
  "Promo Holo": { color: "oklch(0.7 0.14 60)", label: "PRO" },
  "Rare Secret": { color: "oklch(0.6 0.18 350)", label: "SR" }
};

export function RarityDot({ rarity }: { rarity?: string }) {
  if (!rarity) return null;
  const r = RARITY_MAP[rarity] || { color: "var(--text-3)", label: rarity.slice(0, 3).toUpperCase() };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: r.color
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: r.color,
          boxShadow: `0 0 0 2px color-mix(in oklch, ${r.color} 15%, transparent)`
        }}
      />
      {r.label}
    </span>
  );
}

export function StatusBadge({
  status,
  profit
}: {
  status: "open" | "soldout";
  profit?: boolean;
}) {
  if (status === "open") return <span className="chip chip-accent">Open</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <span className="chip">Sold out</span>
      {profit !== undefined ? (
        profit ? (
          <span className="chip chip-pos">Profit</span>
        ) : (
          <span className="chip chip-neg">Loss</span>
        )
      ) : null}
    </span>
  );
}

export function TCGCardThumb({
  card,
  width = 64,
  height = 90,
  foil = false
}: {
  card: Pick<CardSearchResult, "name" | "imageUrl" | "rarity"> | Pick<DealItem, "name" | "imageUrl">;
  width?: number;
  height?: number;
  foil?: boolean;
}) {
  const isPremium = foil || ("rarity" in card && (
    card.rarity === "Special Illustration Rare" ||
    card.rarity === "Illustration Rare" ||
    card.rarity === "Rare Secret"
  ));

  if (!card.imageUrl) {
    return (
      <div
        className="card-thumb placeholder"
        style={{ width, height }}
      >
        {card.name.slice(0, 2)}
      </div>
    );
  }

  return (
    <div className="tcg-card" style={{ width, height, position: "relative", borderRadius: 8, overflow: "hidden" }}>
      <Image
        src={card.imageUrl}
        alt={card.name}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {isPremium ? <span className="foil" aria-hidden="true" /> : null}
    </div>
  );
}
