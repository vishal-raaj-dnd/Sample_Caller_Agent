import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_RETELL_AGENT_ID;

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: 'Missing Retell API key or Agent ID in server environment' },
        { status: 500 }
      );
    }

    // Call Retell server to generate a secure in-browser WebRTC call session
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Retell create-web-call failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to create web call session with Retell' },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Returns access_token and call_id
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error creating web call:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
