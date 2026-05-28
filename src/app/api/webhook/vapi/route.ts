import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Pedido } from '@/types'

// Este endpoint recibe el pedido completo desde Vapi.ai al terminar la llamada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verificar que viene de Vapi con el secret correcto
    const secret = request.headers.get('x-vapi-secret')
    if (secret !== process.env.VAPI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { message } = body

    // Solo procesamos cuando termina la llamada con un pedido
    if (message?.type !== 'end-of-call-report') {
      return NextResponse.json({ ok: true })
    }

    const analisis = message?.analysis?.structuredData
    if (!analisis) {
      return NextResponse.json({ ok: true })
    }

    // Construir el pedido
    const nuevoPedido: Partial<Pedido> = {
      restaurante_id: message.call?.metadata?.restaurante_id ?? 'demo',
      cliente_telefono: message.call?.customer?.number ?? 'desconocido',
      cliente_nombre: analisis.nombre_cliente,
      items: analisis.items ?? [],
      total_estimado: analisis.total ?? 0,
      tipo: analisis.tipo_pedido ?? 'pickup',
      estado: 'pendiente',
      notas: analisis.notas,
      transcripcion: message.transcript,
      duracion_llamada_segundos: message.durationSeconds,
    }

    // Guardar en Supabase
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .insert(nuevoPedido)
      .select()
      .single()

    if (error) throw error

    // Disparar webhook de n8n (notifica Telegram + Google Sheets + impresora)
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido: data }),
      }).catch(console.error)
    }

    return NextResponse.json({ ok: true, pedido_id: data.id })
  } catch (err) {
    console.error('Error en webhook:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
