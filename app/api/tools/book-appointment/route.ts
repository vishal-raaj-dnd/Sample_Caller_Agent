import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const args = body.args || body;
    const { doctor_name, slot_time, patient_name, patient_phone, reason } = args;

    console.log('Received book_appointment request:', {
      doctor_name,
      slot_time,
      patient_name,
      patient_phone
    });

    if (!patient_name || !patient_phone) {
      return NextResponse.json({
        success: false,
        message: 'I still need your name and phone number to finalize the booking.'
      });
    }

    // 1. Find the target slot in the database
    let query = supabase.from('slots').select('*');
    if (doctor_name) {
      query = query.ilike('doctor_name', `%${doctor_name.trim()}%`);
    }
    if (slot_time) {
      query = query.ilike('slot_time', `%${slot_time.trim()}%`);
    }

    const { data: matchedSlots, error: searchError } = await query;

    if (searchError || !matchedSlots || matchedSlots.length === 0) {
      return NextResponse.json({
        success: false,
        message: `I could not locate an open slot for that doctor and time. Let me check the schedule again for you.`
      });
    }

    const targetSlot = matchedSlots[0];

    // 2. Concurrency / Double-booking check
    if (targetSlot.is_booked) {
      return NextResponse.json({
        success: false,
        message: `I apologize, but the ${targetSlot.slot_time} slot with ${targetSlot.doctor_name} was just booked. Would you like an alternative time?`
      });
    }

    // 3. Mark the slot as booked
    const { error: updateError } = await supabase
      .from('slots')
      .update({ is_booked: true })
      .eq('id', targetSlot.id);

    if (updateError) {
      console.error('Failed to update slot:', updateError);
      return NextResponse.json({
        success: false,
        message: 'A technical error occurred while reserving your slot. Please try again.'
      }, { status: 500 });
    }

    // 4. Insert the new confirmed appointment
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert([
        {
          doctor_name: targetSlot.doctor_name,
          slot_time: targetSlot.slot_time,
          patient_name: patient_name.trim(),
          patient_phone: patient_phone.trim(),
          reason: reason || 'General Consultation',
          status: 'confirmed'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create appointment row:', insertError);
      // Revert the slot reservation if appointment insertion failed
      await supabase.from('slots').update({ is_booked: false }).eq('id', targetSlot.id);
      return NextResponse.json({
        success: false,
        message: 'Could not record the appointment. Please try again.'
      }, { status: 500 });
    }

    // 5. Return confirmed response to Retell agent
    return NextResponse.json({
      success: true,
      appointment_id: newAppointment.id,
      doctor: targetSlot.doctor_name,
      time: targetSlot.slot_time,
      message: `Your appointment is confirmed with ${targetSlot.doctor_name} for tomorrow at ${targetSlot.slot_time}. We look forward to seeing you!`
    });
  } catch (err: any) {
    console.error('Error in book-appointment tool:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
