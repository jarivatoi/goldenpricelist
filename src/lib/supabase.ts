import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Use environment variables or fallback values
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim() || 'https://cpzxnbhpzsssyhpuhsgh.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenhuYmhwenNzc3locHVoc2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjExMDMsImV4cCI6MjA2ODY5NzEwM30.xB3KJ6FYeS5U08We1JqgSajutrdJ3vIvbRZVHmxUACc';

// Initialize Supabase client with error handling
let supabase: any = null;

try {
  // Validate configuration
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        // Longer timeout for mobile networks
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
          // Mobile Safari specific headers
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).finally(() => {
          clearTimeout(timeoutId);
        }).catch(error => {
          console.error('🌐 Network error (Mobile Safari):', error);
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection and try again');
          }
          throw error;
        });
      },
    },
  });
  console.log('✅ Supabase client initialized for mobile');
} catch (error) {
  console.error('Failed to initialize Supabase client (Mobile):', error);
  supabase = null;
}

export { supabase };


// Database types for Golden Price List app
export type Database = {
  public: {
    Tables: {
      price_items: {
        Row: {
          id: string;
          name: string;
          price: number;
          gross_price: number;
          created_at: string;
          last_edited_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          gross_price?: number;
          created_at?: string;
          last_edited_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          gross_price?: number;
          created_at?: string;
          last_edited_at?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          created_at: string | null;
          is_completed: boolean | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string | null;
          is_completed?: boolean | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string | null;
          is_completed?: boolean | null;
          completed_at?: string | null;
        };
      };
      order_categories: {
        Row: {
          id: string;
          name: string;
          vat_percentage: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          vat_percentage?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          vat_percentage?: number | null;
          created_at?: string | null;
        };
      };
      order_item_templates: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          unit_price: number;
          is_vat_nil: boolean | null;
          vat_percentage: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          unit_price: number;
          is_vat_nil?: boolean | null;
          vat_percentage?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          unit_price?: number;
          is_vat_nil?: boolean | null;
          vat_percentage?: number | null;
          created_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          category_id: string | null;
          order_date: string | null;
          total_cost: number | null;
          created_at: string | null;
          last_edited_at: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          order_date?: string | null;
          total_cost?: number | null;
          created_at?: string | null;
          last_edited_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          order_date?: string | null;
          total_cost?: number | null;
          created_at?: string | null;
          last_edited_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          template_id: string | null;
          quantity: number;
          unit_price: number;
          is_vat_nil: boolean | null;
          vat_amount: number | null;
          total_price: number;
          is_available: boolean | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          template_id?: string | null;
          quantity: number;
          unit_price: number;
          is_vat_nil?: boolean | null;
          vat_amount?: number | null;
          total_price: number;
          is_available?: boolean | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          template_id?: string | null;
          quantity?: number;
          unit_price?: number;
          is_vat_nil?: boolean | null;
          vat_amount?: number | null;
          total_price?: number;
          is_available?: boolean | null;
        };
      };
    };
    credit_clients: {
      Row: {
        id: string;
        name: string;
        total_debt: number;
        bottles_owed: string | null;
        created_at: string;
        last_transaction_at: string;
      };
      Insert: {
        id: string;
        name: string;
        total_debt?: number;
        bottles_owed?: string | null;
        created_at?: string;
        last_transaction_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        total_debt?: number;
        bottles_owed?: string | null;
        created_at?: string;
        last_transaction_at?: string;
      };
    };
    credit_transactions: {
      Row: {
        id: string;
        client_id: string;
        description: string;
        amount: number;
        date: string;
        type: string;
      };
      Insert: {
        id?: string;
        client_id: string;
        description: string;
        amount: number;
        date?: string;
        type?: string;
      };
      Update: {
        id?: string;
        client_id?: string;
        description?: string;
        amount?: number;
        date?: string;
        type?: string;
      };
    };
    credit_payments: {
      Row: {
        id: string;
        client_id: string;
        amount: number;
        date: string;
        type: string;
      };
      Insert: {
        id?: string;
        client_id: string;
        amount: number;
        date?: string;
        type?: string;
      };
      Update: {
        id?: string;
        client_id?: string;
        amount?: number;
        date?: string;
        type?: string;
      };
    };
  };
};