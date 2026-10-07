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
      { doctor_name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '10:00 AM', is_booked: false },
      { doctor_name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', slot_date: 'tomorrow', slot_time: '02:30 PM', is_booked: false },
      { doctor_name: 'Dr. Michael Chen', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '11:00 AM', is_booked: false },
      { doctor_name: 'Dr. Michael Chen', specialty: 'General Practice', slot_date: 'tomorrow', slot_time: '03:00 PM', is_booked: false },
      { doctor_name: 'Dr. Priya Sharma', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '01:30 PM', is_booked: false },
      { doctor_name: 'Dr. Priya Sharma', specialty: 'Dermatology', slot_date: 'tomorrow', slot_time: '04:00 PM', is_booked: false }
    ];

    const { data, error } = await supabase.from('slots').insert(initialSlots).select();
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Schedule reset successfully', slots: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
