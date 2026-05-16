import type { DealLot, portfolioTotals } from "@/lib/deals";
import type { LotPerformance, MonthlyProfit } from "../types";
import { formatCurrency, formatPercent } from "../formatters";
import { LotPerformanceCard, SummaryMetric } from "./primitives";

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
    <section className="analytics-view">
      {recentBuys.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            <span>Checkout a deal cart to unlock portfolio analytics.</span>
          </div>
        </section>
      ) : (
        <>
          <div className="analytics-summary" aria-label="Portfolio analytics">
            <SummaryMetric
              label="Total spent"
              value={formatCurrency(portfolioSummary.buyCost)}
            />
            <SummaryMetric
              label="Sold revenue"
              value={formatCurrency(portfolioSummary.soldRevenue)}
            />
            <SummaryMetric
              label="Realized profit"
              value={formatCurrency(portfolioSummary.realizedProfit)}
              strong
            />
            <SummaryMetric
              label="Lot net"
              value={formatCurrency(portfolioSummary.lotNet)}
            />
            <SummaryMetric
              label="Realized ROI"
              value={formatPercent(portfolioSummary.realizedRoi)}
            />
            <SummaryMetric
              label="Sell-through"
              value={formatPercent(portfolioSummary.sellThroughRate)}
            />
            <SummaryMetric
              label="Inventory value"
              value={formatCurrency(portfolioSummary.remainingMarketValue)}
            />
            <SummaryMetric
              label="Inventory spread"
              value={formatCurrency(portfolioSummary.remainingSpread)}
            />
          </div>

          <section className="analytics-grid">
            <section className="panel analytics-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Trend</p>
                  <h2>Monthly profit</h2>
                </div>
                <span className="count-pill">{monthlyProfit.length} months</span>
              </div>

              {monthlyProfit.length === 0 ? (
                <div className="empty-state compact">
                  <span>Record a sale to start the monthly profit chart.</span>
                </div>
              ) : (
                <div className="profit-bars">
                  {monthlyProfit.slice(-8).map((month) => {
                    const width = Math.max(
                      4,
                      (Math.abs(month.profit) / maxMonthlyProfit) * 100
                    );

                    return (
                      <div className="profit-bar-row" key={month.key}>
                        <span>{month.label}</span>
                        <div className="profit-bar-track">
                          <span
                            className={
                              month.profit >= 0
                                ? "profit-bar positive"
                                : "profit-bar negative"
                            }
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <strong>{formatCurrency(month.profit)}</strong>
                        <small>
                          {month.quantity} sold · {formatCurrency(month.revenue)}
                        </small>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="panel analytics-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Lots</p>
                  <h2>Performance</h2>
                </div>
              </div>
              <div className="performance-grid">
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
            </section>
          </section>
        </>
      )}
    </section>
  );
}
