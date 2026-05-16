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
      profiles: {
        Row: {
          user_id: string;
          display_name: string;
          city: string | null;
          region: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          place_name: string | null;
          portfolio_public: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string;
          city?: string | null;
          region?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          place_name?: string | null;
          portfolio_public?: boolean;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          city?: string | null;
          region?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          place_name?: string | null;
          portfolio_public?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      portfolio_items: {
        Row: {
          id: string;
          user_id: string;
          provider_card_id: string;
          variant_id: string;
          variant_label: string;
          name: string;
          set_name: string;
          card_number: string;
          rarity: string;
          image_url: string | null;
          external_url: string | null;
          ownership_type: string;
          condition: string | null;
          grader: string | null;
          grade: string | null;
          cert_number: string | null;
          quantity: number;
          estimated_unit_value: number;
          price_updated_at: string;
          price_sources: Json;
          is_public: boolean;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          provider_card_id: string;
          variant_id: string;
          variant_label: string;
          name: string;
          set_name: string;
          card_number: string;
          rarity: string;
          image_url?: string | null;
          external_url?: string | null;
          ownership_type: string;
          condition?: string | null;
          grader?: string | null;
          grade?: string | null;
          cert_number?: string | null;
          quantity: number;
          estimated_unit_value?: number;
          price_updated_at?: string;
          price_sources?: Json;
          is_public?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          variant_label?: string;
          image_url?: string | null;
          external_url?: string | null;
          condition?: string | null;
          grader?: string | null;
          grade?: string | null;
          cert_number?: string | null;
          quantity?: number;
          estimated_unit_value?: number;
          price_updated_at?: string;
          price_sources?: Json;
          is_public?: boolean;
          notes?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_public_portfolios: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          display_name: string;
          city: string | null;
          region: string | null;
          latitude: number | null;
          longitude: number | null;
          portfolio_item: Json;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
