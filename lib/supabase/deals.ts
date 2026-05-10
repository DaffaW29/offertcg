import type { SupabaseClient } from "@supabase/supabase-js";
import type { DealLot, DealLotItem, DealItem, SaleRecord } from "@/lib/deals";
import type { CardCondition } from "@/lib/deals";
import type { PriceProviderName } from "@/lib/pricing/types";
import type { Database, Json } from "./types";

export type CloudDealState = {
  cart: DealItem[];
  globalBuyPercent: number;
  importedLocalData: boolean;
};

type Supabase = SupabaseClient<Database>;
type DealLotRow = Database["public"]["Tables"]["deal_lots"]["Row"];
type DealLotItemRow = Database["public"]["Tables"]["deal_lot_items"]["Row"];
type SaleRecordRow = Database["public"]["Tables"]["sale_records"]["Row"];

export async function loadCloudDealState(
  supabase: Supabase,
  userId: string,
  defaultBuyPercent: number
): Promise<CloudDealState> {
  const { data, error } = await supabase
    .from("current_deals")
    .select("cart, global_buy_percent, imported_local_data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    cart: Array.isArray(data?.cart) ? (data.cart as DealItem[]) : [],
    globalBuyPercent:
      typeof data?.global_buy_percent === "number"
        ? data.global_buy_percent
        : defaultBuyPercent,
    importedLocalData: data?.imported_local_data ?? false
  };
}

export async function saveCloudDealState(
  supabase: Supabase,
  userId: string,
  cart: DealItem[],
  globalBuyPercent: number,
  importedLocalData = true
) {
  const { error } = await supabase.from("current_deals").upsert({
    user_id: userId,
    cart: cart as unknown as Json,
    global_buy_percent: globalBuyPercent,
    imported_local_data: importedLocalData,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }
}

export async function loadCloudLots(
  supabase: Supabase,
  userId: string
): Promise<DealLot[]> {
  const { data: lotRows, error: lotsError } = await supabase
    .from("deal_lots")
    .select("*")
    .eq("user_id", userId)
    .order("checked_out_at", { ascending: false });

  if (lotsError) {
    throw lotsError;
  }

  const lotIds = (lotRows ?? []).map((lot) => lot.id);
  if (lotIds.length === 0) {
    return [];
  }

  const [{ data: itemRows, error: itemsError }, { data: saleRows, error: salesError }] =
    await Promise.all([
      supabase
        .from("deal_lot_items")
        .select("*")
        .eq("user_id", userId)
        .in("lot_id", lotIds),
      supabase
        .from("sale_records")
        .select("*")
        .eq("user_id", userId)
        .in("lot_id", lotIds)
        .order("sold_at", { ascending: true })
    ]);

  if (itemsError) {
    throw itemsError;
  }

  if (salesError) {
    throw salesError;
  }

  return mapLotRows(lotRows ?? [], itemRows ?? [], saleRows ?? []);
}

export async function saveCloudLot(
  supabase: Supabase,
  userId: string,
  lot: DealLot
) {
  const { error: lotError } = await supabase.from("deal_lots").upsert({
    id: lot.id,
    user_id: userId,
    label: lot.label,
    checked_out_at: lot.checkedOutAt
  });

  if (lotError) {
    throw lotError;
  }

  const itemRows = lot.items.map((item) => mapLotItemToRow(userId, lot.id, item));
  if (itemRows.length > 0) {
    const { error: itemsError } = await supabase
      .from("deal_lot_items")
      .upsert(itemRows);

    if (itemsError) {
      throw itemsError;
    }
  }

  const saleRows = lot.items.flatMap((item) =>
    item.sales.map((sale) => mapSaleToRow(userId, lot.id, item.id, sale))
  );

  if (saleRows.length > 0) {
    const { error: salesError } = await supabase
      .from("sale_records")
      .upsert(saleRows);

    if (salesError) {
      throw salesError;
    }
  }
}

export async function saveCloudLots(
  supabase: Supabase,
  userId: string,
  lots: DealLot[]
) {
  for (const lot of lots) {
    await saveCloudLot(supabase, userId, lot);
  }
}

export async function deleteCloudLot(
  supabase: Supabase,
  userId: string,
  lotId: string
) {
  const { error } = await supabase
    .from("deal_lots")
    .delete()
    .eq("id", lotId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function renameCloudLot(
  supabase: Supabase,
  userId: string,
  lotId: string,
  label: string
) {
  const { error } = await supabase
    .from("deal_lots")
    .update({ label })
    .eq("id", lotId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function saveCloudSale(
  supabase: Supabase,
  userId: string,
  lotId: string,
  itemId: string,
  soldQuantity: number,
  nextSoldQuantity: number,
  sale: SaleRecord
) {
  const lotItemId = lotItemRowId(lotId, itemId);
  const { error: saleError } = await supabase.from("sale_records").insert({
    id: sale.id,
    lot_id: lotId,
    lot_item_id: lotItemId,
    user_id: userId,
    sold_at: sale.soldAt,
    quantity: soldQuantity,
    sale_total: sale.saleTotal
  });

  if (saleError) {
    throw saleError;
  }

  const { error: itemError } = await supabase
    .from("deal_lot_items")
    .update({ sold_quantity: nextSoldQuantity })
    .eq("id", lotItemId)
    .eq("user_id", userId);

  if (itemError) {
    throw itemError;
  }
}

export function lotItemRowId(lotId: string, itemId: string) {
  return `${lotId}|${itemId}`;
}

function mapLotRows(
  lots: DealLotRow[],
  items: DealLotItemRow[],
  sales: SaleRecordRow[]
): DealLot[] {
  const salesByItem = new Map<string, SaleRecord[]>();
  sales.forEach((sale) => {
    const current = salesByItem.get(sale.lot_item_id) ?? [];
    current.push(mapSaleRow(sale));
    salesByItem.set(sale.lot_item_id, current);
  });

  const itemsByLot = new Map<string, DealLotItem[]>();
  items.forEach((item) => {
    const current = itemsByLot.get(item.lot_id) ?? [];
    current.push(mapLotItemRow(item, salesByItem.get(item.id) ?? []));
    itemsByLot.set(item.lot_id, current);
  });

  return lots.map((lot) => ({
    id: lot.id,
    label: lot.label,
    checkedOutAt: lot.checked_out_at,
    items: itemsByLot.get(lot.id) ?? []
  }));
}

function mapLotItemRow(row: DealLotItemRow, sales: SaleRecord[]): DealLotItem {
  const saleQuantity = sales.reduce((total, sale) => total + sale.quantity, 0);

  return {
    id: row.item_key,
    providerCardId: row.provider_card_id,
    variantId: row.variant_id,
    variantLabel: row.variant_label,
    name: row.name,
    setName: row.set_name,
    cardNumber: row.card_number,
    rarity: row.rarity,
    condition: row.condition as CardCondition,
    marketPrice: row.market_price,
    manualMarketPrice: row.manual_market_price ?? undefined,
    buyPercent: row.buy_percent,
    quantity: row.quantity,
    priceSource: row.price_source as PriceProviderName,
    lastUpdated: row.last_updated,
    imageUrl: row.image_url ?? undefined,
    externalUrl: row.external_url ?? undefined,
    notes: row.notes,
    marketPriceMissing: row.market_price_missing,
    buyUnitPrice: row.buy_unit_price,
    buyTotal: row.buy_total,
    soldQuantity: Math.max(row.sold_quantity, saleQuantity),
    sales
  };
}

function mapSaleRow(row: SaleRecordRow): SaleRecord {
  return {
    id: row.id,
    soldAt: row.sold_at,
    quantity: row.quantity,
    saleTotal: row.sale_total
  };
}

function mapLotItemToRow(
  userId: string,
  lotId: string,
  item: DealLotItem
): Database["public"]["Tables"]["deal_lot_items"]["Insert"] {
  return {
    id: lotItemRowId(lotId, item.id),
    lot_id: lotId,
    user_id: userId,
    item_key: item.id,
    provider_card_id: item.providerCardId,
    variant_id: item.variantId,
    variant_label: item.variantLabel,
    name: item.name,
    set_name: item.setName,
    card_number: item.cardNumber,
    rarity: item.rarity,
    condition: item.condition,
    market_price: item.marketPrice,
    manual_market_price: item.manualMarketPrice ?? null,
    buy_percent: item.buyPercent,
    quantity: item.quantity,
    price_source: item.priceSource,
    last_updated: item.lastUpdated,
    image_url: item.imageUrl ?? null,
    external_url: item.externalUrl ?? null,
    notes: item.notes,
    market_price_missing: item.marketPriceMissing,
    buy_unit_price: item.buyUnitPrice,
    buy_total: item.buyTotal,
    sold_quantity: item.soldQuantity
  };
}

function mapSaleToRow(
  userId: string,
  lotId: string,
  itemId: string,
  sale: SaleRecord
): Database["public"]["Tables"]["sale_records"]["Insert"] {
  return {
    id: sale.id,
    lot_id: lotId,
    lot_item_id: lotItemRowId(lotId, itemId),
    user_id: userId,
    sold_at: sale.soldAt,
    quantity: sale.quantity,
    sale_total: sale.saleTotal
  };
}
