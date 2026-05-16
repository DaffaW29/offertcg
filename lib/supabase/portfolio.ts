import type { SupabaseClient } from "@supabase/supabase-js";
import {
  estimatePortfolioWorth,
  estimatedUnitValue
} from "@/lib/portfolio/valuation";
import type {
  CityLocation,
  GradingCompany,
  PortfolioItem,
  PortfolioOwnershipType,
  PortfolioPriceSource,
  PublicPortfolioCard,
  PublicPortfolioPin
} from "@/lib/portfolio/types";
import type { CardCondition } from "@/lib/deals";
import type { Database, Json } from "./types";

export type PortfolioProfile = {
  displayName: string;
  portfolioPublic: boolean;
  location: CityLocation | null;
};

type Supabase = SupabaseClient<Database>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PortfolioItemRow = Database["public"]["Tables"]["portfolio_items"]["Row"];
type PublicPortfolioRow =
  Database["public"]["Functions"]["search_public_portfolios"]["Returns"][number];

export async function loadCloudPortfolioProfile(
  supabase: Supabase,
  userId: string
): Promise<PortfolioProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data) : defaultPortfolioProfile();
}

export async function saveCloudPortfolioProfile(
  supabase: Supabase,
  userId: string,
  profile: PortfolioProfile
) {
  const { error } = await supabase.from("profiles").upsert({
    user_id: userId,
    display_name: profile.displayName.trim() || "Collector",
    city: profile.location?.city ?? null,
    region: profile.location?.region ?? null,
    country: profile.location?.country ?? "US",
    latitude: profile.location?.latitude ?? null,
    longitude: profile.location?.longitude ?? null,
    place_name: profile.location?.placeName ?? null,
    portfolio_public: profile.portfolioPublic,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }
}

export async function loadCloudPortfolioItems(
  supabase: Supabase,
  userId: string
): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPortfolioItemRow);
}

export async function saveCloudPortfolioItem(
  supabase: Supabase,
  userId: string,
  item: PortfolioItem
) {
  const { error } = await supabase
    .from("portfolio_items")
    .upsert(mapPortfolioItemToRow(userId, item));

  if (error) {
    throw error;
  }
}

export async function deleteCloudPortfolioItem(
  supabase: Supabase,
  userId: string,
  itemId: string
) {
  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function loadPublicPortfolioPins(
  supabase: Supabase
): Promise<PublicPortfolioPin[]> {
  const { data, error } = await supabase.rpc("search_public_portfolios");

  if (error) {
    throw error;
  }

  return mapPublicPortfolioRows(data ?? []);
}

export function defaultPortfolioProfile(): PortfolioProfile {
  return {
    displayName: "Collector",
    portfolioPublic: false,
    location: null
  };
}

function mapProfileRow(row: ProfileRow): PortfolioProfile {
  return {
    displayName: row.display_name,
    portfolioPublic: row.portfolio_public,
    location:
      row.city && row.region && row.latitude !== null && row.longitude !== null
        ? {
            city: row.city,
            region: row.region,
            country: row.country,
            latitude: row.latitude,
            longitude: row.longitude,
            placeName: row.place_name ?? `${row.city}, ${row.region}`
          }
        : null
  };
}

function mapPortfolioItemRow(row: PortfolioItemRow): PortfolioItem {
  const item = {
    id: row.id,
    providerCardId: row.provider_card_id,
    variantId: row.variant_id,
    variantLabel: row.variant_label,
    name: row.name,
    setName: row.set_name,
    cardNumber: row.card_number,
    rarity: row.rarity,
    imageUrl: row.image_url ?? undefined,
    externalUrl: row.external_url ?? undefined,
    ownershipType: row.ownership_type as PortfolioOwnershipType,
    condition: row.condition ? (row.condition as CardCondition) : undefined,
    grader: row.grader ? (row.grader as GradingCompany) : undefined,
    grade: row.grade ?? undefined,
    certNumber: row.cert_number ?? undefined,
    quantity: row.quantity,
    estimatedUnitValue: row.estimated_unit_value,
    priceUpdatedAt: row.price_updated_at,
    priceSources: Array.isArray(row.price_sources)
      ? (row.price_sources as PortfolioPriceSource[])
      : [],
    isPublic: row.is_public,
    notes: row.notes
  };

  return {
    ...item,
    estimatedUnitValue: estimatedUnitValue(item)
  };
}

function mapPortfolioItemToRow(
  userId: string,
  item: PortfolioItem
): Database["public"]["Tables"]["portfolio_items"]["Insert"] {
  return {
    id: item.id,
    user_id: userId,
    provider_card_id: item.providerCardId,
    variant_id: item.variantId,
    variant_label: item.variantLabel,
    name: item.name,
    set_name: item.setName,
    card_number: item.cardNumber,
    rarity: item.rarity,
    image_url: item.imageUrl ?? null,
    external_url: item.externalUrl ?? null,
    ownership_type: item.ownershipType,
    condition: item.condition ?? null,
    grader: item.grader ?? null,
    grade: item.grade ?? null,
    cert_number: item.certNumber ?? null,
    quantity: item.quantity,
    estimated_unit_value: item.estimatedUnitValue,
    price_updated_at: item.priceUpdatedAt,
    price_sources: (item.priceSources ?? []) as unknown as Json,
    is_public: item.isPublic,
    notes: item.notes,
    updated_at: new Date().toISOString()
  };
}

function mapPublicPortfolioRows(rows: PublicPortfolioRow[]) {
  const pinsByUser = new Map<string, PublicPortfolioPin>();

  rows.forEach((row) => {
    if (
      !row.city ||
      !row.region ||
      row.latitude === null ||
      row.longitude === null
    ) {
      return;
    }

    const card = mapPublicCard(row.portfolio_item);
    if (!card) {
      return;
    }

    const current = pinsByUser.get(row.user_id) ?? {
      userId: row.user_id,
      displayName: row.display_name,
      city: row.city,
      region: row.region,
      latitude: row.latitude,
      longitude: row.longitude,
      portfolioValue: 0,
      itemCount: 0,
      isPublic: true,
      cards: []
    };

    current.cards.push(card);
    const worth = estimatePortfolioWorth(
      current.cards.map((item) => ({
        item: {
          ...item,
          notes: ""
        }
      }))
    );
    current.portfolioValue = worth.totalValue;
    current.itemCount = worth.itemCount;
    pinsByUser.set(row.user_id, current);
  });

  return [...pinsByUser.values()];
}

function mapPublicCard(value: Json): PublicPortfolioCard | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const card = value as Record<string, Json>;
  if (typeof card.id !== "string" || typeof card.name !== "string") {
    return null;
  }

  return {
    id: card.id,
    providerCardId: asString(card.providerCardId),
    variantId: asString(card.variantId),
    variantLabel: asString(card.variantLabel),
    name: card.name,
    setName: asString(card.setName),
    cardNumber: asString(card.cardNumber),
    rarity: asString(card.rarity),
    imageUrl: asOptionalString(card.imageUrl),
    externalUrl: asOptionalString(card.externalUrl),
    ownershipType: asString(card.ownershipType) as PortfolioOwnershipType,
    condition: asOptionalString(card.condition) as CardCondition | undefined,
    grader: asOptionalString(card.grader) as GradingCompany | undefined,
    grade: asOptionalString(card.grade),
    quantity: asNumber(card.quantity, 1),
    estimatedUnitValue: asNumber(card.estimatedUnitValue, 0),
    priceUpdatedAt: asString(card.priceUpdatedAt),
    priceSources: Array.isArray(card.priceSources)
      ? (card.priceSources as PortfolioPriceSource[])
      : [],
    isPublic: card.isPublic === true
  };
}

function asString(value: Json) {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: Json) {
  return typeof value === "string" && value ? value : undefined;
}

function asNumber(value: Json, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
