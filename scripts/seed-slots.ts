import WebSocket from 'ws';
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txihesowxqdgpakimieb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4aWhlc293eHFkZ3Bha2ltaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODkzNjIsImV4cCI6MjEwNjk2NTM2Mn0.5HJIPCA3-zY7ZXl89F9kWgTF6ddud2qg2vgy6hgX96A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initialSlots = [
  { doctor_name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '10:00 AM', is_booked: false },
  { doctor_name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '02:30 PM', is_booked: false },
  { doctor_name: 'Dr. Michael Chen', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '11:00 AM', is_booked: false },
  { doctor_name: 'Dr. Michael Chen', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '03:00 PM', is_booked: false },
  { doctor_name: 'Dr. Priya Sharma', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '01:30 PM', is_booked: false },
  { doctor_name: 'Dr. Priya Sharma', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '04:00 PM', is_booked: false }
];

async function seed() {
  console.log('Inserting initial slots into Supabase...');
  const { data, error } = await supabase.from('slots').insert(initialSlots).select();
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Successfully seeded slots:', data.length);
    console.table(data);
  }
}

seed();
