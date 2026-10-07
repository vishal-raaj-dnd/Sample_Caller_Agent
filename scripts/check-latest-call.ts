export {};
const apiKey = process.env.RETELL_API_KEY || 'key_bf5f4462a92ef05ad098208a7c1d';

async function checkLatestCall() {
  const res = await fetch('https://api.retellai.com/v2/list-calls?limit=3', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!res.ok) {
    console.error('Failed to list calls:', await res.text());
    return;
  }

  const calls = await res.json();
  if (calls.length === 0) {
    console.log('No calls found.');
    return;
  }

  const latest = calls[0];
  console.log('Call ID:', latest.call_id);
  console.log('Call Status:', latest.call_status);
  console.log('Disconnection Reason:', latest.disconnection_reason);
  console.log('\n--- CALL TRANSCRIPT ---');
  console.log(latest.transcript || '(No transcript yet)');
  console.log('\n--- TOOL / FUNCTION CALLS ---');
  console.dir(latest.tool_calls || latest.metadata || latest.call_analysis, { depth: null });
}

checkLatestCall();
