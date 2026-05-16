import Image from "next/image";
import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { LANDING_CARDS, type LandingCardItem } from "../constants";

export function landingCardsForOffset(offset: number) {
  return Array.from({ length: 4 }, (_unused, index) => {
    return LANDING_CARDS[(offset + index) % LANDING_CARDS.length];
  });
}

export function LandingHero({
  visibleLandingCards,
  previousLandingCards,
  previousLandingOffset,
  visibleLandingOffset,
  onLaunch,
  onViewAnalytics
}: {
  visibleLandingCards: LandingCardItem[];
  previousLandingCards: LandingCardItem[] | null;
  previousLandingOffset: number | null;
  visibleLandingOffset: number;
  onLaunch: () => void;
  onViewAnalytics: () => void;
}) {
  return (
    <AuroraBackground
      className="landing-hero dark"
      aria-label="OfferTCG landing page"
    >
      <div className="landing-card-scene" aria-hidden="true">
        {previousLandingCards ? (
          <div
            className="landing-card-layer exiting"
            key={`previous-${previousLandingOffset}`}
          >
            {previousLandingCards.map((card, index) => (
              <LandingCard card={card} index={index} key={card.id} />
            ))}
          </div>
        ) : null}

        <div
          className="landing-card-layer entering"
          key={`current-${visibleLandingOffset}`}
        >
          {visibleLandingCards.map((card, index) => (
            <LandingCard
              card={card}
              index={index}
              key={card.id}
              priority={visibleLandingOffset === 0 && index < 2}
            />
          ))}
        </div>
      </div>

      <div className="landing-content">
        <p className="landing-eyebrow">
          <Sparkles size={17} />
          Pokemon vendor deal desk
        </p>
        <h1>OfferTCG</h1>
        <p>
          Price card lots, check out buys, track inventory, and measure profit
          from one focused trading card workflow.
        </p>
        <div className="landing-actions">
          <button className="landing-primary" type="button" onClick={onLaunch}>
            Launch app
            <ArrowRight size={18} />
          </button>
          <button
            className="landing-secondary"
            type="button"
            onClick={onViewAnalytics}
          >
            View analytics
            <BarChart3 size={18} />
          </button>
        </div>
        <div className="landing-proof" aria-label="Product highlights">
          <span>Live price search</span>
          <span>Supabase sync</span>
          <span>Profit dashboard</span>
        </div>
      </div>
    </AuroraBackground>
  );
}

function LandingCard({
  card,
  index,
  priority = false
}: {
  card: LandingCardItem;
  index: number;
  priority?: boolean;
}) {
  return (
    <div className={`floating-card card-${index + 1}`}>
      <Image
        src={card.imageUrl}
        alt=""
        width={220}
        height={307}
        priority={priority}
      />
      <span>
        {card.name}
        <small>{card.meta}</small>
      </span>
    </div>
  );
}
