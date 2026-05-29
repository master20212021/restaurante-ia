// Script de configuración del agente Vapi para La Taquería del Norte
// Ejecutar: node scripts/setup-vapi-agent.mjs

const VAPI_API_KEY = process.env.VAPI_API_KEY
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://restaurante-ia-xi.vercel.app'

if (!VAPI_API_KEY) {
  console.error('❌ Falta VAPI_API_KEY en el entorno')
  process.exit(1)
}

const SYSTEM_PROMPT = `Eres Sofía, la asistente virtual de La Taquería del Norte, un restaurante mexicano en la Ciudad de México.

Tu personalidad:
- Eres amable, cálida y eficiente
- Hablas en español mexicano natural (puedes decir "¿Qué le podemos ofrecer?", "Con gusto", etc.)
- Suenas como una persona real, no como un robot
- Eres paciente si el cliente no sabe qué quiere

Tu trabajo es:
1. Saludar al cliente
2. Tomar su pedido del menú
3. Confirmar los detalles (tipo: para llevar, a domicilio o en mesa)
4. Preguntar si hay algo más
5. Despedirte confirmando el pedido

MENÚ COMPLETO:
🌮 TACOS (cada uno $25):
- Taco de bistec
- Taco de carnitas  
- Taco de pollo
- Taco de chorizo
- Taco de nopales (vegetariano)
- Taco de canasta (3 x $60)

🫔 QUESADILLAS ($45 sencilla / $65 con proteína):
- Quesadilla de queso
- Quesadilla de huitlacoche
- Quesadilla de flor de calabaza
- Quesadilla de bistec / pollo / chorizo

🍲 ÓRDENES:
- Orden de enchiladas verdes o rojas $85
- Orden de chilaquiles verdes o rojos $80
- Orden de huevos a la mexicana $70

🥤 BEBIDAS:
- Agua fresca (horchata, jamaica, tamarindo) $20
- Refresco (Coca, Sprite, Fanta) $20
- Agua mineral $15
- Café de olla $25

REGLAS IMPORTANTES:
- Si el cliente pide algo que no está en el menú, discúlpate amablemente y ofrece alternativas
- Si el pedido es a domicilio, pide la dirección
- NO inventes precios ni platillos
- Si hay confusión, pregunta con calma para aclarar
- Cuando termines de tomar el pedido, haz un resumen claro antes de cerrar

HORARIO: Lunes a domingo de 9am a 11pm
TELÉFONO DE AYUDA: Si el cliente tiene un problema urgente, dile que un humano lo llamará en máximo 10 minutos.`

const assistantConfig = {
  name: 'Sofía - Taquería del Norte',
  model: {
    provider: 'openai',
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 500,
  },
  voice: {
    provider: 'openai',
    voiceId: 'nova', // Voz femenina natural en español
  },
  transcriber: {
    provider: 'deepgram',
    model: 'nova-3',
    language: 'es',
  },
  firstMessage: '¡Buenas tardes! Le habla Sofía de La Taquería del Norte. ¿En qué le podemos ayudar hoy?',
  endCallMessage: 'Perfecto, su pedido quedó registrado. En breve le confirmamos. ¡Que tenga buen día!',
  maxDurationSeconds: 600, // 10 minutos máximo por llamada
  backgroundSound: 'office', // off | office (valores válidos de Vapi)
  serverUrl: `${WEBHOOK_URL}/api/webhook/vapi`,
  serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || 'cambiar_esto_despues',
  analysisPlan: {
    structuredDataPrompt: `Extrae la siguiente información de la llamada en formato JSON:
{
  "nombre_cliente": "nombre si lo mencionó, null si no",
  "items": [
    {
      "nombre": "nombre del platillo",
      "cantidad": número,
      "precio_unitario": precio en pesos,
      "notas": "personalizaciones si las hay, null si no"
    }
  ],
  "total": suma total en pesos,
  "tipo_pedido": "pickup" | "delivery" | "mesa",
  "direccion_entrega": "dirección si es delivery, null si no",
  "notas": "notas generales del pedido, null si no hay"
}`,
    structuredDataSchema: {
      type: 'object',
      properties: {
        nombre_cliente: { type: 'string', nullable: true },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              cantidad: { type: 'number' },
              precio_unitario: { type: 'number' },
              notas: { type: 'string', nullable: true },
            },
            required: ['nombre', 'cantidad', 'precio_unitario'],
          },
        },
        total: { type: 'number' },
        tipo_pedido: { type: 'string', enum: ['pickup', 'delivery', 'mesa'] },
        direccion_entrega: { type: 'string', nullable: true },
        notas: { type: 'string', nullable: true },
      },
      required: ['items', 'total', 'tipo_pedido'],
    },
    summaryPrompt: 'Resume la llamada en 1-2 oraciones: qué pidió el cliente y el total.',
  },
}

async function crearAgente() {
  console.log('🤖 Creando agente Sofía en Vapi...')

  const res = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assistantConfig),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('❌ Error al crear agente:', JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ Agente creado exitosamente!')
  console.log(`   ID del agente: ${data.id}`)
  console.log(`   Nombre: ${data.name}`)
  console.log('')
  console.log('👉 Agrega esta línea a tu .env.local:')
  console.log(`   VAPI_ASSISTANT_ID=${data.id}`)
  console.log('')
  console.log('👉 Y esta a Vercel:')
  console.log(`   vercel env add VAPI_ASSISTANT_ID production`)
}

crearAgente()
