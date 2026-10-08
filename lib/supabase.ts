import { createClient } from '@supabase/supabase-js';

// Polyfill WebSocket in Node.js environments if not present
if (typeof globalThis.WebSocket === 'undefined' && typeof window === 'undefined') {
  try {
    const ws = require('ws');
    (globalThis as any).WebSocket = ws;
  } catch (err) {
    // ws may not be installed in all contexts
  }
}

// Read the URL and public Anon key from environment variables with safe defaults
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://txihesowxqdgpakimieb.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4aWhlc293eHFkZ3Bha2ltaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODkzNjIsImV4cCI6MjEwNjk2NTM2Mn0.5HJIPCA3-zY7ZXl89F9kWgTF6ddud2qg2vgy6hgX96A';

// Initialize and export a single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

