export {};
// Script to change the Retell Agent's voice alone

const apiKey = process.env.RETELL_API_KEY || 'key_bf5f4462a92ef05ad098208a7c1d';
const agentId = process.env.NEXT_PUBLIC_RETELL_AGENT_ID || 'agent_c098e841dc7e933a53d96b478c';

// Popular recommended production voices for Retell
const POPULAR_VOICES: { [key: string]: { provider: string; gender: string; description: string } } = {
  '11labs-Adrian': { provider: 'ElevenLabs', gender: 'Male', description: 'Deep, warm, trustworthy doctor tone' },
  '11labs-Emily': { provider: 'ElevenLabs', gender: 'Female', description: 'Friendly, empathetic, clear clinical tone' },
  '11labs-Sarah': { provider: 'ElevenLabs', gender: 'Female', description: 'Calm, soothing professional receptionist' },
  '11labs-Rachel': { provider: 'ElevenLabs', gender: 'Female', description: 'Upbeat, articulate concierge' },
  '11labs-Brian': { provider: 'ElevenLabs', gender: 'Male', description: 'Crisp British accent, refined' },
  'retell-Cimo': { provider: 'Retell Native', gender: 'Female', description: 'Current default: ultra low-latency' },
};

async function changeVoice(newVoiceId?: string) {
  if (!newVoiceId) {
    console.log('=== HOW TO CHANGE THE AGENT VOICE ===\n');
    console.log('Current Agent ID:', agentId);
    
    // Fetch current agent voice
    try {
      const res = await fetch(`https://api.retellai.com/get-agent/${agentId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (res.ok) {
        const agent = await res.json();
        console.log(`Current Voice ID: "${agent.voice_id}"`);
      }
    } catch (e) {}

    console.log('\nPopular Voice Options:');
    for (const [id, meta] of Object.entries(POPULAR_VOICES)) {
      console.log(`  • ${id.padEnd(16)} | ${meta.provider.padEnd(12)} | ${meta.gender.padEnd(7)} | ${meta.description}`);
    }

    console.log('\nUsage:');
    console.log('  npx tsx scripts/change-voice.ts <VOICE_ID>');
    console.log('Example:');
    console.log('  npx tsx scripts/change-voice.ts 11labs-Emily');
    console.log('  npx tsx scripts/change-voice.ts 11labs-Adrian\n');
    return;
  }

  console.log(`Updating voice for Agent ${agentId} to: "${newVoiceId}"...`);

  const res = await fetch(`https://api.retellai.com/update-agent/${agentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      voice_id: newVoiceId
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to change voice:', errorText);
  } else {
    const updated = await res.json();
    console.log('SUCCESS! Voice updated successfully to:', updated.voice_id);
    console.log('Agent Name:', updated.agent_name);
  }
}

const chosenVoice = process.argv[2];
changeVoice(chosenVoice);
