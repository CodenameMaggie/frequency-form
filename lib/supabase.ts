import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Legacy export for backward compatibility (lazy initialization)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string, unknown>)[prop as string];
  }
});

// Database types for Frequency & Form
export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          brand_partner_id: string | null;
          fabric_type: string | null;
          frequency_tier: 'healing' | 'foundation' | null;
          frequency_hz: number | null;
          status: 'pending' | 'approved' | 'rejected';
          stripe_product_id: string | null;
          stripe_price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      brands: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['brands']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['brands']['Insert']>;
      };
      brand_partners: {
        Row: {
          id: string;
          auth_user_id: string;
          business_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          website: string | null;
          status: 'pending' | 'approved' | 'rejected';
          commission_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['brand_partners']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['brand_partners']['Insert']>;
      };
      fabric_types: {
        Row: {
          id: string;
          name: string;
          frequency_hz: number;
          frequency_tier: 'healing' | 'foundation';
          description: string | null;
          properties: string[] | null;
        };
        Insert: Omit<Database['public']['Tables']['fabric_types']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['fabric_types']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_email: string;
          customer_name: string | null;
          total_amount: number;
          subtotal: number;
          tax_amount: number | null;
          shipping_amount: number | null;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          stripe_payment_intent_id: string | null;
          shipping_address: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          brand_partner_id: string;
          sale_amount: number;
          commission_amount: number;
          brand_payout_amount: number;
          quantity: number;
          status: 'pending' | 'completed' | 'refunded';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
          source: string | null;
        };
        Insert: Omit<Database['public']['Tables']['newsletter_subscribers']['Row'], 'id' | 'subscribed_at'>;
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>;
      };
      ff_body_measurements: {
        Row: {
          id: string;
          user_id: string;
          measurements: Record<string, number>;
          body_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ff_body_measurements']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ff_body_measurements']['Insert']>;
      };
      ff_color_profiles: {
        Row: {
          id: string;
          user_id: string;
          season: 'spring' | 'summer' | 'autumn' | 'winter';
          undertone: 'warm' | 'cool' | 'neutral';
          best_colors: string[];
          avoid_colors: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ff_color_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ff_color_profiles']['Insert']>;
      };
      ff_custom_designs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          design_data: Record<string, unknown>;
          fabric_type: string | null;
          status: 'draft' | 'submitted' | 'in_production' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ff_custom_designs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ff_custom_designs']['Insert']>;
      };
      ff_closet: {
        Row: {
          id: string;
          user_id: string;
          items: Record<string, unknown>[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ff_closet']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ff_closet']['Insert']>;
      };
      ff_fabrics: {
        Row: {
          id: string;
          type: string;
          name: string;
          frequency_hz: number;
          frequency_tier: 'healing' | 'foundation';
          description: string | null;
          properties: string[];
          in_stock: boolean;
          active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['ff_fabrics']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['ff_fabrics']['Insert']>;
      };
      partner_applications: {
        Row: {
          id: string;
          business_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          website: string | null;
          product_types: string[];
          message: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['partner_applications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['partner_applications']['Insert']>;
      };
      annie_conversations: {
        Row: {
          id: string;
          user_identifier: string;
          messages: Record<string, unknown>[];
          context: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['annie_conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['annie_conversations']['Insert']>;
      };
    };
  };
};
