import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { appointment_id, doctor_name, slot_time } = await req.json();

    if (!appointment_id) {
      return NextResponse.json({ error: 'Missing appointment_id' }, { status: 400 });
    }

    // 1. Delete or mark appointment cancelled
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment_id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 2. Free up the slot in slots table if doctor and time provided
    if (doctor_name && slot_time) {
      await supabase
        .from('slots')
        .update({ is_booked: false })
        .ilike('doctor_name', `%${doctor_name.trim()}%`)
        .ilike('slot_time', `%${slot_time.trim()}%`);
    }

    return NextResponse.json({ success: true, message: 'Appointment cancelled and slot restored to available' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
