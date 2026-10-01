import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL || ''
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

export const SUPABASE_CONFIGURED = Boolean(
  supabaseUrl && supabaseAnonKey,
);

const configurationError = new Error(
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.',
);

const unavailableAuth = {
  async getSession() {
    return {
      data: {
        session: null,
      },
      error: configurationError,
    };
  },

  async signInWithOAuth() {
    return {
      data: null,
      error: configurationError,
    };
  },
};

export const supabase = SUPABASE_CONFIGURED
  ? createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  : {
      auth: unavailableAuth,
    };