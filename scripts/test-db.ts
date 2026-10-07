import WebSocket from 'ws';
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txihesowxqdgpakimieb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4aWhlc293eHFkZ3Bha2ltaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODkzNjIsImV4cCI6MjEwNjk2NTM2Mn0.5HJIPCA3-zY7ZXl89F9kWgTF6ddud2qg2vgy6hgX96A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Connecting to Supabase...');
  const { data, error } = await supabase.from('slots').select('*');
  if (error) {
    console.error('Error querying slots:', error);
  } else {
    console.log(`Success! Found ${data.length} slots in database:`);
    console.table(data);
  }
}

testConnection();
