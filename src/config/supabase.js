import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured (not using placeholder values)
const isSupabaseConfigured = supabaseUrl && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key-here' &&
  !supabaseAnonKey.includes('placeholder');

if (!isSupabaseConfigured) {
  // Only log warning once in production to reduce console noise
  if (import.meta.env.DEV || !window.supabaseWarningShown) {
    console.warn('⚠️ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel environment variables');
    console.warn('   Announcements, profile comments, and user tags will not work until Supabase is configured.');
    if (!import.meta.env.DEV) {
      window.supabaseWarningShown = true;
    }
  }
}

// Create client with empty strings if not configured (prevents errors)
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

// Export the configuration status and URL for use in components
export const isSupabaseReady = isSupabaseConfigured;
export const getSupabaseUrl = () => supabaseUrl;

