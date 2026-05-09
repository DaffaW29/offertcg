export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      current_deals: {
        Row: {
          user_id: string;
          cart: Json;
          global_buy_percent: number;
          imported_local_data: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          cart?: Json;
          global_buy_percent: number;
          imported_local_data?: boolean;
          updated_at?: string;
        };
        Update: {
          cart?: Json;
          global_buy_percent?: number;
          imported_local_data?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      deal_lots: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          checked_out_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          label: string;
          checked_out_at: string;
          created_at?: string;
        };
        Update: {
          label?: string;
          checked_out_at?: string;
        };
        Relationships: [];
      };
      deal_lot_items: {
        Row: {
          id: string;
          lot_id: string;
          user_id: string;
          item_key: string;
          provider_card_id: string;
          variant_id: string;
          variant_label: string;
          name: string;
          set_name: string;
          card_number: string;
          rarity: string;
          condition: string;
          market_price: number;
          manual_market_price: number | null;
          buy_percent: number;
          quantity: number;
          price_source: string;
          last_updated: string;
          image_url: string | null;
          external_url: string | null;
          notes: string;
          market_price_missing: boolean;
          buy_unit_price: number;
          buy_total: number;
          sold_quantity: number;
          created_at: string;
        };
        Insert: {
          id: string;
          lot_id: string;
          user_id: string;
          item_key: string;
          provider_card_id: string;
          variant_id: string;
          variant_label: string;
          name: string;
          set_name: string;
          card_number: string;
          rarity: string;
          condition: string;
          market_price: number;
          manual_market_price?: number | null;
          buy_percent: number;
          quantity: number;
          price_source: string;
          last_updated: string;
          image_url?: string | null;
          external_url?: string | null;
          notes: string;
          market_price_missing: boolean;
          buy_unit_price: number;
          buy_total: number;
          sold_quantity?: number;
          created_at?: string;
        };
        Update: {
          sold_quantity?: number;
          notes?: string;
        };
        Relationships: [];
      };
      sale_records: {
        Row: {
          id: string;
          lot_id: string;
          lot_item_id: string;
          user_id: string;
          sold_at: string;
          quantity: number;
          sale_total: number;
          created_at: string;
        };
        Insert: {
          id: string;
          lot_id: string;
          lot_item_id: string;
          user_id: string;
          sold_at: string;
          quantity: number;
          sale_total: number;
          created_at?: string;
        };
        Update: {
          sold_at?: string;
          quantity?: number;
          sale_total?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
