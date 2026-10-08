import WebSocket from 'ws';
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txihesowxqdgpakimieb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4aWhlc293eHFkZ3Bha2ltaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODkzNjIsImV4cCI6MjEwNjk2NTM2Mn0.5HJIPCA3-zY7ZXl89F9kWgTF6ddud2qg2vgy6hgX96A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initialSlots = [
  // Cardiology
  { doctor_name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '10:00 AM', is_booked: true },
  { doctor_name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '02:30 PM', is_booked: false },
  { doctor_name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '04:15 PM', is_booked: false },
  { doctor_name: 'Dr. Rajesh Kothari', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '09:30 AM', is_booked: false },
  { doctor_name: 'Dr. Rajesh Kothari', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '11:45 AM', is_booked: false },
  { doctor_name: 'Dr. Rajesh Kothari', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '03:30 PM', is_booked: false },

  // General Practice
  { doctor_name: 'Dr. Michael Chen', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '11:00 AM', is_booked: false },
  { doctor_name: 'Dr. Michael Chen', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '03:00 PM', is_booked: false },
  { doctor_name: 'Dr. Ananya Iyer', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '09:00 AM', is_booked: false },
  { doctor_name: 'Dr. Ananya Iyer', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '01:00 PM', is_booked: false },
  { doctor_name: 'Dr. Ananya Iyer', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '04:30 PM', is_booked: false },

  // Dermatology
  { doctor_name: 'Dr. Priya Sharma', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '01:30 PM', is_booked: false },
  { doctor_name: 'Dr. Priya Sharma', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '04:00 PM', is_booked: false },
  { doctor_name: 'Dr. Marcus Vance', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '10:30 AM', is_booked: false },
  { doctor_name: 'Dr. Marcus Vance', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '02:00 PM', is_booked: false },

  // Pediatrics
  { doctor_name: 'Dr. Emily Watson', specialty: 'Pediatrics', slot_date: 'tomorrow', slot_time: '10:15 AM', is_booked: false },
  { doctor_name: 'Dr. Emily Watson', specialty: 'Pediatrics', slot_date: 'tomorrow', slot_time: '01:15 PM', is_booked: false },
  { doctor_name: 'Dr. Emily Watson', specialty: 'Pediatrics', slot_date: 'tomorrow', slot_time: '03:45 PM', is_booked: false },

  // Orthopedics
  { doctor_name: 'Dr. David Miller', specialty: 'Orthopedics', slot_date: 'tomorrow', slot_time: '09:00 AM', is_booked: false },
  { doctor_name: 'Dr. David Miller', specialty: 'Orthopedics', slot_date: 'tomorrow', slot_time: '11:30 AM', is_booked: false },
  { doctor_name: 'Dr. David Miller', specialty: 'Orthopedics', slot_date: 'tomorrow', slot_time: '02:45 PM', is_booked: false },

  // Neurology
  { doctor_name: 'Dr. Vikram Patel', specialty: 'Neurology', slot_date: 'tomorrow', slot_time: '11:15 AM', is_booked: false },
  { doctor_name: 'Dr. Vikram Patel', specialty: 'Neurology', slot_date: 'tomorrow', slot_time: '03:15 PM', is_booked: false },
];

const initialAppointments = [
  {
    doctor_name: 'Dr. Sarah Jenkins',
    slot_time: '10:00 AM',
    patient_name: 'Alex Johnson',
    patient_phone: '+1-555-0199',
    reason: 'Hypertension Follow-up',
    status: 'confirmed'
  }
];

async function seed() {
  console.log('Resetting and seeding rich clinical slots into Supabase...');
  
  // 1. Clear old data
  await supabase.from('appointments').delete().neq('id', 0);
  await supabase.from('slots').delete().neq('id', 0);

  // 2. Insert slots
  const { data: slotsData, error: slotsError } = await supabase.from('slots').insert(initialSlots).select();
  if (slotsError) {
    console.error('Insert slots error:', slotsError);
  } else {
    console.log(`Successfully seeded ${slotsData.length} doctor slots across 6 specialties!`);
  }

  // 3. Insert initial appointment
  const { data: apptData, error: apptError } = await supabase.from('appointments').insert(initialAppointments).select();
  if (apptError) {
    console.error('Insert appointment error:', apptError);
  } else {
    console.log(`Successfully seeded ${apptData.length} baseline confirmed appointment!`);
  }
}

seed();

