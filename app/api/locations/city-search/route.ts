import { NextResponse } from "next/server";
import type { CityLocation } from "@/lib/portfolio/types";

export const dynamic = "force-dynamic";

const MAPBOX_GEOCODING_URL =
  "https://api.mapbox.com/search/geocode/v6/forward";
const REQUEST_TIMEOUT_MS = 8000;

const fallbackCities: CityLocation[] = [
  {
    city: "Los Angeles",
    region: "CA",
    country: "US",
    latitude: 34.0522,
    longitude: -118.2437,
    placeName: "Los Angeles, CA, United States"
  },
  {
    city: "San Diego",
    region: "CA",
    country: "US",
    latitude: 32.7157,
    longitude: -117.1611,
    placeName: "San Diego, CA, United States"
  },
  {
    city: "San Francisco",
    region: "CA",
    country: "US",
    latitude: 37.7749,
    longitude: -122.4194,
    placeName: "San Francisco, CA, United States"
  },
  {
    city: "New York",
    region: "NY",
    country: "US",
    latitude: 40.7128,
    longitude: -74.006,
    placeName: "New York, NY, United States"
  },
  {
    city: "Dallas",
    region: "TX",
    country: "US",
    latitude: 32.7767,
    longitude: -96.797,
    placeName: "Dallas, TX, United States"
  }
];

type MapboxFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: {
      place?: { name?: string };
      region?: { name?: string; region_code?: string };
      country?: { name?: string; country_code?: string };
    };
  };
};

type MapboxResponse = {
  features?: MapboxFeature[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Enter at least 2 characters to search cities." },
      { status: 400 }
    );
  }

  if (query.length > 80) {
    return NextResponse.json(
      { error: "City search is too long. Keep it under 80 characters." },
      { status: 400 }
    );
  }

  const token =
    process.env.MAPBOX_TOKEN?.trim() ??
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

  if (!token) {
    return NextResponse.json({
      cities: searchFallbackCities(query),
      message: "Using bundled city results until MAPBOX_TOKEN is configured."
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(MAPBOX_GEOCODING_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("types", "place");
    url.searchParams.set("limit", "6");
    url.searchParams.set("country", "US");
    url.searchParams.set("access_token", token);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Mapbox returned ${response.status}.`);
    }

    const payload = (await response.json()) as MapboxResponse;
    return NextResponse.json({
      cities: (payload.features ?? []).map(mapFeature).filter(Boolean)
    });
  } catch (error) {
    return NextResponse.json({
      cities: searchFallbackCities(query),
      message:
        error instanceof Error
          ? `City provider unavailable: ${error.message}`
          : "City provider unavailable."
    });
  } finally {
    clearTimeout(timeout);
  }
}

function searchFallbackCities(query: string) {
  const normalizedQuery = query.toLowerCase();
  return fallbackCities.filter((city) =>
    city.placeName.toLowerCase().includes(normalizedQuery)
  );
}

function mapFeature(feature: MapboxFeature): CityLocation | null {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates) {
    return null;
  }

  const context = feature.properties?.context;
  const city = context?.place?.name ?? feature.properties?.name;
  const region = context?.region?.region_code ?? context?.region?.name;
  const country = context?.country?.country_code ?? "US";

  if (!city || !region) {
    return null;
  }

  return {
    city,
    region,
    country,
    latitude: coordinates[1],
    longitude: coordinates[0],
    placeName:
      feature.properties?.full_address ??
      `${city}, ${region}, ${context?.country?.name ?? country}`
  };
}
