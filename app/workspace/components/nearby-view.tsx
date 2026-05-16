import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { filterPublicPortfolioPins } from "@/lib/portfolio/location";
import type {
  PublicPortfolioPin,
  PublicPortfolioResult
} from "@/lib/portfolio/types";
import type { PortfolioProfile } from "@/lib/supabase/portfolio";
import { formatCurrency } from "../formatters";
import type { NearbySort } from "../types";
import { CardThumb } from "./primitives";

type MapboxMap = {
  addControl: (control: unknown, position?: string) => void;
  flyTo: (options: { center: [number, number]; zoom?: number }) => void;
  remove: () => void;
};

type MapboxMarker = {
  setLngLat: (lngLat: [number, number]) => MapboxMarker;
  addTo: (map: MapboxMap) => MapboxMarker;
  remove: () => void;
};

type MapboxNamespace = {
  accessToken: string;
  Map: new (options: {
    container: HTMLDivElement;
    style: string;
    center: [number, number];
    zoom: number;
    attributionControl?: boolean;
  }) => MapboxMap;
  Marker: new (options: { element: HTMLElement }) => MapboxMarker;
  NavigationControl: new () => unknown;
  AttributionControl: new (options?: { compact?: boolean }) => unknown;
};

declare global {
  interface Window {
    mapboxgl?: MapboxNamespace;
  }
}

export function NearbyView({
  sessionActive,
  profile,
  publicPins,
  isLoading,
  message,
  cardQuery,
  maxDistanceMiles,
  nearbySort,
  mapboxToken,
  onCardQueryChange,
  onMaxDistanceChange,
  onNearbySortChange,
  onRefresh
}: {
  sessionActive: boolean;
  profile: PortfolioProfile;
  publicPins: PublicPortfolioPin[];
  isLoading: boolean;
  message: string;
  cardQuery: string;
  maxDistanceMiles: string;
  nearbySort: NearbySort;
  mapboxToken: string;
  onCardQueryChange: (value: string) => void;
  onMaxDistanceChange: (value: string) => void;
  onNearbySortChange: (value: NearbySort) => void;
  onRefresh: () => void;
}) {
  const visiblePins = useMemo(() => {
    return filterPublicPortfolioPins(publicPins, {
      origin: profile.location ?? undefined,
      maxDistanceMiles: Number(maxDistanceMiles) || undefined,
      cardQuery,
      sort: nearbySort
    });
  }, [cardQuery, maxDistanceMiles, nearbySort, profile.location, publicPins]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedPin =
    visiblePins.find((pin) => pin.userId === selectedUserId) ?? visiblePins[0];

  return (
    <section className="nearby-view">
      <section className="panel nearby-control-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Nearby discovery</p>
            <h2>City-level portfolio map</h2>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={onRefresh}
            disabled={!sessionActive || isLoading}
          >
            {isLoading ? <Loader2 className="spin" size={15} /> : null}
            Refresh
          </button>
        </div>

        <div className="nearby-toolbar">
          <label>
            Card filter
            <div className="search-input-wrap compact">
              <Search size={17} />
              <input
                value={cardQuery}
                onChange={(event) => onCardQueryChange(event.target.value)}
                placeholder="Charizard, PSA 10, Near Mint..."
              />
            </div>
          </label>
          <label>
            Distance
            <select
              value={maxDistanceMiles}
              onChange={(event) => onMaxDistanceChange(event.target.value)}
            >
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
              <option value="100">100 miles</option>
              <option value="250">250 miles</option>
              <option value="">Any distance</option>
            </select>
          </label>
          <label>
            Sort
            <select
              value={nearbySort}
              onChange={(event) =>
                onNearbySortChange(event.target.value as NearbySort)
              }
            >
              <option value="distance">Distance</option>
              <option value="value">Portfolio value</option>
              <option value="cards">Card count</option>
              <option value="updated">Recently priced</option>
            </select>
          </label>
        </div>

        {!sessionActive ? (
          <p className="status-message warning">
            Sign in to browse nearby revealed portfolios.
          </p>
        ) : !profile.location ? (
          <p className="status-message warning">
            Choose your city in Portfolio before sorting nearby portfolios.
          </p>
        ) : null}
        {message ? <p className="status-message">{message}</p> : null}
      </section>

      <section className="nearby-grid">
        <section className="panel map-panel">
          <DiscoveryMap
            pins={visiblePins}
            selectedUserId={selectedPin?.userId ?? null}
            origin={profile.location}
            mapboxToken={mapboxToken}
            onSelectPin={setSelectedUserId}
          />
        </section>

        <section className="panel nearby-results-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Revealed portfolios</p>
              <h2>{visiblePins.length} city matches</h2>
            </div>
          </div>

          {visiblePins.length === 0 ? (
            <div className="empty-state">
              <span>No revealed portfolios match the current filters.</span>
            </div>
          ) : (
            <div className="nearby-result-list">
              {visiblePins.map((pin) => (
                <button
                  key={pin.userId}
                  className={
                    selectedPin?.userId === pin.userId
                      ? "nearby-result-card active"
                      : "nearby-result-card"
                  }
                  type="button"
                  onClick={() => setSelectedUserId(pin.userId)}
                >
                  <span>
                    <strong>{pin.displayName}</strong>
                    <small>
                      {pin.city}, {pin.region}
                      {Number.isFinite(pin.distanceMiles)
                        ? ` · ${pin.distanceMiles.toFixed(1)} mi`
                        : ""}
                    </small>
                  </span>
                  <span>
                    <strong>{formatCurrency(pin.portfolioValue)}</strong>
                    <small>{pin.itemCount} cards</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedPin ? <PortfolioPreview pin={selectedPin} /> : null}
        </section>
      </section>
    </section>
  );
}

function DiscoveryMap({
  pins,
  selectedUserId,
  origin,
  mapboxToken,
  onSelectPin
}: {
  pins: PublicPortfolioResult[];
  selectedUserId: string | null;
  origin: PortfolioProfile["location"];
  mapboxToken: string;
  onSelectPin: (userId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const center = useMemo(() => {
    return origin
      ? ([origin.longitude, origin.latitude] as [number, number])
      : ([-98.5795, 39.8283] as [number, number]);
  }, [origin]);

  useEffect(() => {
    if (!mapboxToken || !containerRef.current || mapRef.current) {
      return;
    }

    let isCancelled = false;
    loadMapbox().then((mapbox) => {
      if (isCancelled || !containerRef.current) {
        return;
      }

      mapbox.accessToken = mapboxToken;
      const map = new mapbox.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center,
        zoom: origin ? 7 : 3,
        attributionControl: false
      });
      map.addControl(new mapbox.NavigationControl(), "top-right");
      map.addControl(
        new mapbox.AttributionControl({ compact: true }),
        "bottom-right"
      );
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      isCancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [center, mapboxToken, origin]);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = window.mapboxgl;
    if (!map || !mapbox || !mapReady) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = pins.map((pin) => {
      const markerElement = document.createElement("button");
      markerElement.className =
        pin.userId === selectedUserId ? "mapbox-pin active" : "mapbox-pin";
      markerElement.type = "button";
      markerElement.textContent = pin.itemCount.toString();
      markerElement.addEventListener("click", () => onSelectPin(pin.userId));
      return new mapbox.Marker({ element: markerElement })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);
    });
  }, [mapReady, onSelectPin, pins, selectedUserId]);

  useEffect(() => {
    const selectedPin = pins.find((pin) => pin.userId === selectedUserId);
    if (selectedPin && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedPin.longitude, selectedPin.latitude],
        zoom: 8
      });
    }
  }, [pins, selectedUserId]);

  if (!mapboxToken) {
    return (
      <FallbackMap
        pins={pins}
        selectedUserId={selectedUserId}
        origin={origin}
        onSelectPin={onSelectPin}
      />
    );
  }

  return <div className="mapbox-container" ref={containerRef} />;
}

function FallbackMap({
  pins,
  selectedUserId,
  origin,
  onSelectPin
}: {
  pins: PublicPortfolioResult[];
  selectedUserId: string | null;
  origin: PortfolioProfile["location"];
  onSelectPin: (userId: string) => void;
}) {
  const bounds = useMemo(() => mapBounds(pins, origin), [origin, pins]);

  return (
    <div className="fallback-map" aria-label="City-level portfolio map">
      <div className="fallback-map-grid" />
      {origin ? (
        <span
          className="fallback-origin"
          style={projectPoint(origin.latitude, origin.longitude, bounds)}
        >
          You
        </span>
      ) : null}
      {pins.map((pin) => (
        <button
          key={pin.userId}
          className={
            pin.userId === selectedUserId
              ? "fallback-city-pin active"
              : "fallback-city-pin"
          }
          style={projectPoint(pin.latitude, pin.longitude, bounds)}
          type="button"
          onClick={() => onSelectPin(pin.userId)}
        >
          <MapPin size={15} />
          {pin.itemCount}
        </button>
      ))}
    </div>
  );
}

function PortfolioPreview({ pin }: { pin: PublicPortfolioResult }) {
  return (
    <section className="portfolio-preview">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">
            {pin.city}, {pin.region}
          </p>
          <h3>{pin.displayName}</h3>
        </div>
        <strong>{formatCurrency(pin.portfolioValue)}</strong>
      </div>
      <div className="portfolio-preview-list">
        {pin.cards.slice(0, 8).map((card) => (
          <article className="portfolio-preview-card" key={card.id}>
            <CardThumb card={card} compact />
            <div>
              <strong>{card.name}</strong>
              <span>
                {card.setName} #{card.cardNumber}
              </span>
              <span className="muted">
                {card.ownershipType === "graded"
                  ? `${card.grader} ${card.grade}`
                  : card.condition}{" "}
                · Qty {card.quantity}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

async function loadMapbox() {
  if (window.mapboxgl) {
    return window.mapboxgl;
  }

  await Promise.all([
    loadStylesheet("https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.css"),
    loadScript("https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.js")
  ]);

  if (!window.mapboxgl) {
    throw new Error("Mapbox GL failed to load.");
  }

  return window.mapboxgl;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)));
    document.head.appendChild(script);
  });
}

function loadStylesheet(href: string) {
  return new Promise<void>((resolve) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", () => resolve());
    document.head.appendChild(link);
    window.setTimeout(resolve, 1500);
  });
}

function mapBounds(
  pins: PublicPortfolioResult[],
  origin: PortfolioProfile["location"]
) {
  const coordinates = [
    ...pins.map((pin) => ({ latitude: pin.latitude, longitude: pin.longitude })),
    ...(origin ? [{ latitude: origin.latitude, longitude: origin.longitude }] : [])
  ];

  if (coordinates.length === 0) {
    return {
      minLat: 24,
      maxLat: 50,
      minLon: -125,
      maxLon: -66
    };
  }

  return {
    minLat: Math.min(...coordinates.map((point) => point.latitude)) - 0.8,
    maxLat: Math.max(...coordinates.map((point) => point.latitude)) + 0.8,
    minLon: Math.min(...coordinates.map((point) => point.longitude)) - 0.8,
    maxLon: Math.max(...coordinates.map((point) => point.longitude)) + 0.8
  };
}

function projectPoint(
  latitude: number,
  longitude: number,
  bounds: ReturnType<typeof mapBounds>
) {
  const lonRange = Math.max(0.1, bounds.maxLon - bounds.minLon);
  const latRange = Math.max(0.1, bounds.maxLat - bounds.minLat);

  return {
    left: `${((longitude - bounds.minLon) / lonRange) * 100}%`,
    top: `${(1 - (latitude - bounds.minLat) / latRange) * 100}%`
  };
}
