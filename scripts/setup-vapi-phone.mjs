// Script para configurar número de Twilio en Vapi
// Ejecutar DESPUÉS de setup-vapi-agent.mjs
// node scripts/setup-vapi-phone.mjs

const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error('❌ Faltan variables de entorno. Asegúrate de tener:')
  console.error('   VAPI_API_KEY, VAPI_ASSISTANT_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER')
  process.exit(1)
}

async function configurarTelefono() {
  console.log('📞 Importando número de Twilio en Vapi...')

  const res = await fetch('https://api.vapi.ai/phone-number', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'twilio',
      number: TWILIO_PHONE_NUMBER,
      twilioAccountSid: TWILIO_ACCOUNT_SID,
      twilioAuthToken: TWILIO_AUTH_TOKEN,
      assistantId: VAPI_ASSISTANT_ID, // Asignar el agente directamente al número
      name: 'Número Taquería del Norte',
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('❌ Error:', JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ Número configurado en Vapi!')
  console.log(`   ID del número: ${data.id}`)
  console.log(`   Número: ${data.number}`)
  console.log(`   Agente asignado: ${data.assistantId}`)
  console.log('')
  console.log('🎉 ¡Todo listo! Cuando alguien llame a ese número, Sofía responderá.')
}

configurarTelefono()
