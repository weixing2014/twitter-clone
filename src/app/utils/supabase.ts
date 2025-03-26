import { createClient } from '@supabase/supabase-js';

// Using the provided Supabase URL and key
const supabaseUrl = 'https://yhodhaexvxuwrtjsgizz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error(
    'Missing Supabase anon key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
