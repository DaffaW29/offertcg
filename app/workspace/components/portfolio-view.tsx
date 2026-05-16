import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react";
import { CONDITIONS } from "@/lib/deals";
import {
  GRADING_COMPANIES,
  type CityLocation,
  type PortfolioItem,
  type PortfolioOwnershipType,
  type PortfolioWorth
} from "@/lib/portfolio/types";
import { portfolioItemTier } from "@/lib/portfolio/valuation";
import type { CardSearchResult } from "@/lib/pricing/types";
import type { PortfolioProfile } from "@/lib/supabase/portfolio";
import {
  formatCurrency,
  formatPriceDate
} from "../formatters";
import { getSelectedVariant } from "../search";
import type { SearchPagination } from "../types";
import { CardThumb, MetricStack } from "./primitives";

export function PortfolioView({
  sessionActive,
  profile,
  profileMessage,
  cityQuery,
  cityResults,
  cityMessage,
  isCitySearching,
  portfolioItems,
  portfolioWorth,
  searchQuery,
  searchSetName,
  searchCardNumber,
  searchError,
  providerNotice,
  isSearching,
  hasSearched,
  pagination,
  searchResults,
  selectedVariants,
  ownershipType,
  addCondition,
  addGrader,
  addGrade,
  addQuantity,
  addCertNumber,
  addNotes,
  addItemPublic,
  refreshingItemId,
  onProfileChange,
  onSaveProfile,
  onCityQueryChange,
  onSearchCities,
  onSelectCity,
  onClearCity,
  onSearchQueryChange,
  onSearchSetNameChange,
  onSearchCardNumberChange,
  onSearch,
  onSelectedVariantsChange,
  onOwnershipTypeChange,
  onAddConditionChange,
  onAddGraderChange,
  onAddGradeChange,
  onAddQuantityChange,
  onAddCertNumberChange,
  onAddNotesChange,
  onAddItemPublicChange,
  onAddCard,
  onRefreshItemPrice,
  onDeleteItem,
  onUpdateItem
}: {
  sessionActive: boolean;
  profile: PortfolioProfile;
  profileMessage: string;
  cityQuery: string;
  cityResults: CityLocation[];
  cityMessage: string;
  isCitySearching: boolean;
  portfolioItems: PortfolioItem[];
  portfolioWorth: PortfolioWorth;
  searchQuery: string;
  searchSetName: string;
  searchCardNumber: string;
  searchError: string;
  providerNotice: string;
  isSearching: boolean;
  hasSearched: boolean;
  pagination: SearchPagination;
  searchResults: CardSearchResult[];
  selectedVariants: Record<string, string>;
  ownershipType: PortfolioOwnershipType;
  addCondition: PortfolioItem["condition"];
  addGrader: NonNullable<PortfolioItem["grader"]>;
  addGrade: string;
  addQuantity: string;
  addCertNumber: string;
  addNotes: string;
  addItemPublic: boolean;
  refreshingItemId: string;
  onProfileChange: (profile: PortfolioProfile) => void;
  onSaveProfile: () => void;
  onCityQueryChange: (value: string) => void;
  onSearchCities: (event: FormEvent<HTMLFormElement>) => void;
  onSelectCity: (city: CityLocation) => void;
  onClearCity: () => void;
  onSearchQueryChange: (value: string) => void;
  onSearchSetNameChange: (value: string) => void;
  onSearchCardNumberChange: (value: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSelectedVariantsChange: Dispatch<SetStateAction<Record<string, string>>>;
  onOwnershipTypeChange: (value: PortfolioOwnershipType) => void;
  onAddConditionChange: (value: PortfolioItem["condition"]) => void;
  onAddGraderChange: (value: NonNullable<PortfolioItem["grader"]>) => void;
  onAddGradeChange: (value: string) => void;
  onAddQuantityChange: (value: string) => void;
  onAddCertNumberChange: (value: string) => void;
  onAddNotesChange: (value: string) => void;
  onAddItemPublicChange: (value: boolean) => void;
  onAddCard: (card: CardSearchResult) => void;
  onRefreshItemPrice: (item: PortfolioItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem: (
    itemId: string,
    updater: (item: PortfolioItem) => PortfolioItem
  ) => void;
}) {
  return (
    <section className="portfolio-view">
      <section className="panel portfolio-settings-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Privacy</p>
            <h2>Portfolio reveal settings</h2>
          </div>
          <span className="count-pill">
            {profile.portfolioPublic ? "Revealed" : "Private"}
          </span>
        </div>

        <div className="portfolio-settings-grid">
          <label>
            Display name
            <input
              value={profile.displayName}
              maxLength={48}
              onChange={(event) =>
                onProfileChange({
                  ...profile,
                  displayName: event.target.value
                })
              }
            />
          </label>

          <form className="city-search-form" onSubmit={onSearchCities}>
            <label>
              City
              <div className="search-input-wrap compact">
                <MapPin size={17} />
                <input
                  value={cityQuery}
                  onChange={(event) => onCityQueryChange(event.target.value)}
                  placeholder="Los Angeles, CA"
                />
              </div>
            </label>
            <button
              className="ghost-button"
              type="submit"
              disabled={isCitySearching}
            >
              {isCitySearching ? <Loader2 className="spin" size={15} /> : null}
              Find
            </button>
          </form>

          <label className="toggle-option portfolio-toggle">
            <input
              type="checkbox"
              checked={profile.portfolioPublic}
              disabled={!sessionActive}
              onChange={(event) =>
                onProfileChange({
                  ...profile,
                  portfolioPublic: event.target.checked
                })
              }
            />
            <span>
              {profile.portfolioPublic ? <Eye size={16} /> : <EyeOff size={16} />}
              Reveal city-level portfolio
            </span>
          </label>

          <button
            className="secondary-button"
            type="button"
            onClick={onSaveProfile}
          >
            Save settings
          </button>
        </div>

        {profile.location ? (
          <p className="status-message">
            Public discovery uses {profile.location.placeName}. Exact addresses
            are never stored.
            <button className="inline-link" type="button" onClick={onClearCity}>
              Clear city
            </button>
          </p>
        ) : (
          <p className="status-message warning">
            Choose a city before revealing your portfolio nearby.
          </p>
        )}
        {!sessionActive ? (
          <p className="status-message warning">
            Sign in to reveal or browse public portfolios.
          </p>
        ) : null}
        {profileMessage ? <p className="status-message">{profileMessage}</p> : null}
        {cityMessage ? <p className="status-message warning">{cityMessage}</p> : null}

        {cityResults.length > 0 ? (
          <div className="city-result-list">
            {cityResults.map((city) => (
              <button
                key={`${city.city}-${city.region}-${city.latitude}`}
                className="ghost-button"
                type="button"
                onClick={() => onSelectCity(city)}
              >
                {city.placeName}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="portfolio-content-grid">
        <section className="panel portfolio-add-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Add cards</p>
              <h2>Raw and graded entries</h2>
            </div>
            <span className="count-pill">{pagination.totalCount} matches</span>
          </div>

          <form className="portfolio-card-search" onSubmit={onSearch}>
            <label>
              Card search
              <div className="search-input-wrap compact">
                <Search size={17} />
                <input
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  placeholder="Charizard, Pikachu..."
                />
              </div>
            </label>
            <label>
              Set
              <input
                value={searchSetName}
                onChange={(event) => onSearchSetNameChange(event.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              Number
              <input
                value={searchCardNumber}
                onChange={(event) => onSearchCardNumberChange(event.target.value)}
                placeholder="Optional"
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="spin" size={17} /> : <Search size={17} />}
              Search
            </button>
          </form>

          <div className="portfolio-entry-controls">
            <div className="segmented-control" aria-label="Card ownership type">
              <button
                className={ownershipType === "raw" ? "active" : ""}
                type="button"
                onClick={() => onOwnershipTypeChange("raw")}
              >
                Raw
              </button>
              <button
                className={ownershipType === "graded" ? "active" : ""}
                type="button"
                onClick={() => onOwnershipTypeChange("graded")}
              >
                Graded
              </button>
            </div>

            {ownershipType === "raw" ? (
              <label>
                Raw condition
                <select
                  value={addCondition}
                  onChange={(event) =>
                    onAddConditionChange(event.target.value as PortfolioItem["condition"])
                  }
                >
                  {CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label>
                  Grader
                  <select
                    value={addGrader}
                    onChange={(event) =>
                      onAddGraderChange(
                        event.target.value as NonNullable<PortfolioItem["grader"]>
                      )
                    }
                  >
                    {GRADING_COMPANIES.map((grader) => (
                      <option key={grader} value={grader}>
                        {grader}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Grade
                  <input
                    value={addGrade}
                    onChange={(event) => onAddGradeChange(event.target.value)}
                    placeholder="10, 9.5, 8"
                  />
                </label>
                <label>
                  Cert number
                  <input
                    value={addCertNumber}
                    onChange={(event) => onAddCertNumberChange(event.target.value)}
                    placeholder="Private"
                  />
                </label>
              </>
            )}

            <label>
              Quantity
              <input
                min="1"
                type="number"
                value={addQuantity}
                onChange={(event) => onAddQuantityChange(event.target.value)}
              />
            </label>
            <label>
              Notes
              <input
                value={addNotes}
                onChange={(event) => onAddNotesChange(event.target.value)}
                placeholder="Private notes"
              />
            </label>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={addItemPublic}
                onChange={(event) => onAddItemPublicChange(event.target.checked)}
              />
              <span>Show this card if portfolio is revealed</span>
            </label>
          </div>

          {searchError ? <p className="status-message error">{searchError}</p> : null}
          {providerNotice ? (
            <p className="status-message warning">{providerNotice}</p>
          ) : null}

          <div className="portfolio-result-list">
            {!hasSearched && !isSearching ? (
              <div className="empty-state">
                <span>Search for a card, then add it as raw or graded.</span>
              </div>
            ) : null}
            {searchResults.map((card) => {
              const selectedVariant = getSelectedVariant(
                card,
                selectedVariants[card.id]
              );

              return (
                <article className="result-card compact" key={card.id}>
                  <CardThumb card={card} compact />
                  <div className="result-details">
                    <h3>{card.name}</h3>
                    <p>
                      {card.setName} #{card.cardNumber}
                    </p>
                    <label>
                      Version
                      <select
                        value={selectedVariant?.id ?? ""}
                        onChange={(event) =>
                          onSelectedVariantsChange((current) => ({
                            ...current,
                            [card.id]: event.target.value
                          }))
                        }
                      >
                        {card.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.label} ·{" "}
                            {variant.marketPrice === null
                              ? "No market"
                              : formatCurrency(variant.marketPrice)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => onAddCard(card)}
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel portfolio-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Stored portfolio</p>
              <h2>Cards and valuation</h2>
            </div>
            <div className="portfolio-metrics">
              <MetricStack
                label="Worth"
                value={formatCurrency(portfolioWorth.totalValue)}
              />
              <MetricStack label="Cards" value={portfolioWorth.itemCount.toString()} />
            </div>
          </div>

          {portfolioItems.length === 0 ? (
            <div className="empty-state">
              <span>Add cards to start tracking your portfolio.</span>
            </div>
          ) : (
            <div className="portfolio-item-list">
              {portfolioItems.map((item) => (
                <article className="portfolio-item-card" key={item.id}>
                  <CardThumb card={item} compact />
                  <div className="portfolio-item-main">
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {item.setName} #{item.cardNumber} · {item.variantLabel}
                      </p>
                      <p className="muted">
                        {item.ownershipType === "graded"
                          ? `${item.grader} ${item.grade}`
                          : item.condition}{" "}
                        · Tier {portfolioItemTier(item)}
                      </p>
                    </div>
                    <div className="portfolio-price-sources">
                      {(item.priceSources ?? []).slice(0, 3).map((source) => (
                        <div key={`${item.id}-${source.source}`}>
                          <span>
                            {source.source}:{" "}
                            {source.averageLastFive !== null
                              ? `${formatCurrency(source.averageLastFive)} avg`
                              : source.marketPrice !== null
                                ? formatCurrency(source.marketPrice)
                                : "No comps"}
                          </span>
                          {source.transactions.length > 0 ? (
                            <ol>
                              {source.transactions.slice(0, 5).map((transaction) => (
                                <li key={transaction.id}>
                                  {formatCurrency(transaction.price)} ·{" "}
                                  {formatPriceDate(transaction.soldAt)}
                                </li>
                              ))}
                            </ol>
                          ) : source.message ? (
                            <small>{source.message}</small>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <p className="muted">
                      Updated {formatPriceDate(item.priceUpdatedAt)}
                    </p>
                  </div>
                  <div className="portfolio-item-actions">
                    <strong>{formatCurrency(item.estimatedUnitValue)}</strong>
                    <label>
                      Qty
                      <input
                        min="1"
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            quantity: Math.max(1, Math.floor(Number(event.target.value)))
                          }))
                        }
                      />
                    </label>
                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={item.isPublic}
                        onChange={(event) =>
                          onUpdateItem(item.id, (current) => ({
                            ...current,
                            isPublic: event.target.checked
                          }))
                        }
                      />
                      <span>Public card</span>
                    </label>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => onRefreshItemPrice(item)}
                      disabled={refreshingItemId === item.id}
                    >
                      {refreshingItemId === item.id ? (
                        <Loader2 className="spin" size={15} />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                      Refresh
                    </button>
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {portfolioWorth.incompleteCount > 0 ? (
            <p className="status-message warning">
              {portfolioWorth.incompleteCount} item has incomplete valuation.
            </p>
          ) : null}
          <p className="status-message">
            Price research shows each source separately. Recent transaction
            averages use the latest five returned comps when the provider
            supplies them.
          </p>
        </section>
      </section>
    </section>
  );
}
