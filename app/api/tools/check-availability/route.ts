import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Retell sends arguments either under "args" or directly in the body
    const args = body.args || body;
    const { specialty } = args;

    console.log('Received check_availability request:', { specialty });

    // Build the query to find all unbooked slots
    let query = supabase
      .from('slots')
      .select('*')
      .eq('is_booked', false);

    // If caller specified a specialty (e.g. Cardiology), filter by it
    if (specialty) {
      query = query.ilike('specialty', `%${specialty}%`);
    }

    const { data: slots, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ 
        error: 'Failed to query database', 
        message: 'Could not fetch schedules. Please try again.' 
      }, { status: 500 });
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({
        available: false,
        message: 'Sorry, there are no open slots matching that request. Would you like to check another specialty or time?'
      });
    }

    // Format clean spoken summary for the voice agent
    const optionsText = slots
      .map(s => `${s.doctor_name} (${s.specialty}) at ${s.slot_time}`)
      .join(', ');

    return NextResponse.json({
      available: true,
      slots: slots,
      message: `We have the following openings: ${optionsText}. Which one would you prefer?`
    });
  } catch (err: any) {
    console.error('Error in check-availability tool:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
