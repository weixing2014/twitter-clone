import { createClient } from '@supabase/supabase-js';

// Using the provided Supabase URL and key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error(
    'Missing Supabase anon key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

if (!supabaseUrl) {
  console.error('Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local');
}

console.log('Supabase URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
