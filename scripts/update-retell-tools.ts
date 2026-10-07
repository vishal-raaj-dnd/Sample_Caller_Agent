export {};
// Helper script to automatically update the tool webhook endpoints in Retell AI
const apiKey = process.env.RETELL_API_KEY || 'key_bf5f4462a92ef05ad098208a7c1d';
const llmId = process.env.RETELL_LLM_ID || 'llm_1435a9bab34b31b77d0a0c22ecc1';

async function updateRetellTools(baseUrl: string) {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  console.log(`Updating Retell LLM (${llmId}) with base URL: ${cleanUrl}...`);

  const payload = {
    general_tools: [
      {
        type: 'custom',
        name: 'check_availability',
        description: 'Checks available doctor slots in the clinic database based on specialty and time of day.',
        url: `${cleanUrl}/api/tools/check-availability`,
        speak_during_execution: true,
        speak_after_execution: true,
        execution_message_description: 'Checking doctor schedules for you...',
        parameters: {
          type: 'object',
          properties: {
            specialty: {
              type: 'string',
              description: 'Cardiology, Dermatology, or General Practice'
            },
            time_of_day: {
              type: 'string',
              description: 'morning or afternoon'
            }
          },
          required: []
        }
      },
      {
        type: 'custom',
        name: 'book_appointment',
        description: 'Books an appointment slot for a patient with a doctor in the clinic database.',
        url: `${cleanUrl}/api/tools/book-appointment`,
        speak_during_execution: true,
        speak_after_execution: true,
        execution_message_description: 'Confirming your appointment right now...',
        parameters: {
          type: 'object',
          properties: {
            doctor_name: {
              type: 'string',
              description: 'Name of the doctor chosen'
            },
            slot_time: {
              type: 'string',
              description: 'Time of appointment, e.g. 10:00 AM'
            },
            patient_name: {
              type: 'string',
              description: 'Full name of the patient'
            },
            patient_phone: {
              type: 'string',
              description: 'Phone number of the patient'
            }
          },
          required: ['doctor_name', 'slot_time', 'patient_name', 'patient_phone']
        }
      }
    ]
  };

  const res = await fetch(`https://api.retellai.com/update-retell-llm/${llmId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to update Retell tools:', errorText);
  } else {
    const updated = await res.json();
    console.log('Successfully updated Retell LLM tools!');
    console.log('Registered tools:', updated.general_tools?.map((t: any) => `${t.name} -> ${t.url}`));
  }
}

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.log('Usage: npx tsx scripts/update-retell-tools.ts <PUBLIC_TUNNEL_URL>');
  console.log('Example: npx tsx scripts/update-retell-tools.ts https://your-tunnel.loca.lt');
} else {
  updateRetellTools(targetUrl);
}
