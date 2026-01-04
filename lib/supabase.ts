import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (to be expanded)
export type Database = {
  public: {
    Tables: {
      products: any;
      brands: any;
      fabric_types: any;
      orders: any;
      order_items: any;
      newsletter_subscribers: any;
    };
  };
};
