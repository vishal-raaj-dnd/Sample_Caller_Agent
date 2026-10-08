import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/slots -> Returns real-time slots and appointments
export async function GET() {
  try {
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .order('id', { ascending: true });

    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (slotsError) throw slotsError;

    return NextResponse.json({
      slots: slots || [],
      appointments: appointments || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/slots -> Resets schedule for testing/interview demos
export async function POST() {
  try {
    // 1. Clear existing appointments
    await supabase.from('appointments').delete().neq('id', 0);

    // 2. Reset slots to available
    await supabase.from('slots').delete().neq('id', 0);

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

    const { data: slotsData, error } = await supabase.from('slots').insert(initialSlots).select();
    if (error) throw error;

    await supabase.from('appointments').insert([
      {
        doctor_name: 'Dr. Sarah Jenkins',
        slot_time: '10:00 AM',
        patient_name: 'Alex Johnson',
        patient_phone: '+1-555-0199',
        reason: 'Hypertension Follow-up',
        status: 'confirmed'
      }
    ]);

    return NextResponse.json({ success: true, message: 'Schedule reset successfully with 23 slots across 6 specialties', slots: slotsData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

