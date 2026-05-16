import type { DealLot, portfolioTotals } from "@/lib/deals";
import type { LotPerformance, MonthlyProfit } from "../types";
import { formatCurrency, formatPercent } from "../formatters";
import {
  KPICard,
  LotPerformanceCard,
  ScreenBanner,
  SectionHeader
} from "./primitives";

export function AnalyticsView({
  recentBuys,
  portfolioSummary,
  monthlyProfit,
  maxMonthlyProfit,
  lotPerformance,
  onViewLot
}: {
  recentBuys: DealLot[];
  portfolioSummary: ReturnType<typeof portfolioTotals>;
  monthlyProfit: MonthlyProfit[];
  maxMonthlyProfit: number;
  lotPerformance: LotPerformance[];
  onViewLot: (lotId: string) => void;
}) {
  return (
    <>
      <ScreenBanner
        eyebrow="Analytics"
        title="Where the money"
        titleAccent="actually is."
        subtitle="Portfolio-level P&L, monthly trends, and lot-by-lot performance at a glance."
        kpis={
          <>
            <KPICard label="Total spent" value={formatCurrency(portfolioSummary.buyCost)} sub="All lots" />
            <KPICard label="Realized profit" value={formatCurrency(portfolioSummary.realizedProfit)} sub={`${formatPercent(portfolioSummary.realizedRoi)} ROI`} accent />
            <KPICard label="Inventory value" value={formatCurrency(portfolioSummary.remainingMarketValue)} sub={`${formatCurrency(portfolioSummary.remainingSpread)} spread`} />
          </>
        }
      />

      {recentBuys.length === 0 ? (
        <div className="surface empty" style={{ padding: 48 }}>
          <span>Checkout a deal cart to unlock portfolio analytics.</span>
        </div>
      ) : (
        <>
          <div className="kpi-strip" style={{ marginBottom: 24 }}>
            <KPICard label="Sold revenue" value={formatCurrency(portfolioSummary.soldRevenue)} />
            <KPICard label="Lot net" value={formatCurrency(portfolioSummary.lotNet)} />
            <KPICard label="Realized ROI" value={formatPercent(portfolioSummary.realizedRoi)} />
            <div className="kpi-card">
              <div className="kpi-label">Sell-through</div>
              <div className="kpi-value">{formatPercent(portfolioSummary.sellThroughRate)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <section className="surface" style={{ padding: 20 }}>
              <SectionHeader
                eyebrow="Trend"
                title="Monthly profit"
                right={<span className="chip">{monthlyProfit.length} months</span>}
              />

              {monthlyProfit.length === 0 ? (
                <div className="empty" style={{ padding: 32 }}>
                  <span>Record a sale to start the monthly profit chart.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {monthlyProfit.slice(-8).map((month) => {
                    const width = Math.max(
                      4,
                      (Math.abs(month.profit) / maxMonthlyProfit) * 100
                    );
                    const isPositive = month.profit >= 0;

                    return (
                      <div key={month.key} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 10, alignItems: "center" }}>
                        <span className="text-xs text-3" style={{ fontWeight: 600 }}>{month.label}</span>
                        <div style={{ height: 8, background: "var(--bg-muted)", borderRadius: 999, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${width}%`,
                              borderRadius: 999,
                              background: isPositive
                                ? "linear-gradient(90deg, var(--accent), var(--pos))"
                                : "linear-gradient(90deg, var(--neg), var(--neg-soft))"
                            }}
                          />
                        </div>
                        <div style={{ textAlign: "right", minWidth: 80 }}>
                          <div className="mono" style={{ fontWeight: 700, fontSize: 13, color: isPositive ? "var(--pos)" : "var(--neg)" }}>
                            {formatCurrency(month.profit)}
                          </div>
                          <div className="text-xs text-3">
                            {month.quantity} sold · {formatCurrency(month.revenue)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="surface" style={{ padding: 20 }}>
              <SectionHeader eyebrow="Lots" title="Performance" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <LotPerformanceCard
                  title="Best lot"
                  performance={lotPerformance[0]}
                  onViewLot={onViewLot}
                />
                <LotPerformanceCard
                  title="Weakest lot"
                  performance={lotPerformance[lotPerformance.length - 1]}
                  onViewLot={onViewLot}
                />
              </div>

              {lotPerformance.length > 2 ? (
                <div style={{ marginTop: 18 }}>
                  <SectionHeader title="Lot scatter" />
                  <LotScatterPlot lots={lotPerformance} />
                </div>
              ) : null}
            </section>
          </div>

          <section className="surface" style={{ padding: 20, marginTop: 18 }}>
            <SectionHeader eyebrow="Position" title="Portfolio breakdown" />
            <PositionDial
              soldRevenue={portfolioSummary.soldRevenue}
              inventoryValue={portfolioSummary.remainingMarketValue}
              buyCost={portfolioSummary.buyCost}
            />
          </section>
        </>
      )}
    </>
  );
}

function PositionDial({
  soldRevenue,
  inventoryValue,
  buyCost
}: {
  soldRevenue: number;
  inventoryValue: number;
  buyCost: number;
}) {
  const total = soldRevenue + inventoryValue + buyCost;
  if (total === 0) return null;

  const segments = [
    { label: "Sold revenue", value: soldRevenue, color: "var(--pos)" },
    { label: "Inventory value", value: inventoryValue, color: "var(--accent)" },
    { label: "Buy cost", value: buyCost, color: "var(--accent-2)" }
  ];

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 75;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dashLen = pct * circumference;
    const dashOffset = -offset;
    offset += dashLen;
    return { ...seg, dashLen, dashOffset, pct };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-1)" fontFamily="var(--font-mono-family)" fontSize="18" fontWeight="700">
          {formatCurrency(soldRevenue - buyCost)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-3)" fontSize="10" fontWeight="600">
          NET POSITION
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {arcs.map((arc) => (
          <div key={arc.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: arc.color, flexShrink: 0 }} />
            <span className="text-sm" style={{ flex: 1 }}>{arc.label}</span>
            <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(arc.value)}</span>
            <span className="text-xs text-3">{(arc.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LotScatterPlot({ lots }: { lots: LotPerformance[] }) {
  const width = 320;
  const height = 180;
  const pad = 30;

  if (lots.length === 0) return null;

  const rois = lots.map((l) => l.portfolioRoi);
  const nets = lots.map((l) => l.lotNet);
  const costs = lots.map((l) => l.totals.buyCost);

  const minRoi = Math.min(...rois);
  const maxRoi = Math.max(...rois);
  const minNet = Math.min(...nets);
  const maxNet = Math.max(...nets);
  const maxCost = Math.max(...costs);

  const roiRange = maxRoi - minRoi || 1;
  const netRange = maxNet - minNet || 1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--border)" strokeWidth="1" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--border)" strokeWidth="1" />
      <text x={width / 2} y={height - 5} textAnchor="middle" fill="var(--text-3)" fontSize="9">ROI %</text>
      <text x={5} y={height / 2} textAnchor="middle" fill="var(--text-3)" fontSize="9" transform={`rotate(-90 5 ${height / 2})`}>Net $</text>
      {lots.map((lot, i) => {
        const x = pad + ((rois[i] - minRoi) / roiRange) * (width - 2 * pad);
        const y = (height - pad) - ((nets[i] - minNet) / netRange) * (height - 2 * pad);
        const radius = 4 + (costs[i] / maxCost) * 12;
        const isPositive = nets[i] >= 0;
        return (
          <circle
            key={lot.lot.id}
            cx={x}
            cy={y}
            r={radius}
            fill={isPositive ? "var(--pos)" : "var(--neg)"}
            opacity="0.6"
          >
            <title>{lot.lot.label}: {formatCurrency(lot.lotNet)} net, {formatPercent(lot.portfolioRoi)} ROI</title>
          </circle>
        );
      })}
    </svg>
  );
}
