import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing! Check your .env file.');
}

console.log('Supabase Client Initializing with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
