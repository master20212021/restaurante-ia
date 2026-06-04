import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Pedido } from '@/types'

// Este endpoint recibe el pedido completo desde Vapi.ai al terminar la llamada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log completo para debug
    const msgType = body?.message?.type ?? body?.type ?? 'unknown'
    const secret = request.headers.get('x-vapi-secret')
    console.log(`[vapi-webhook] tipo=${msgType} | secret=${secret ? 'presente' : 'ausente'} | keys=${Object.keys(body).join(',')}`)

    // Verificar que viene de Vapi con el secret correcto
    // Nota: llamadas desde número de teléfono no envían header → se permite
    // Si el header está presente pero incorrecto → se rechaza
    if (secret !== null && secret !== process.env.VAPI_WEBHOOK_SECRET) {
      console.warn('[vapi-webhook] Secret inválido:', secret)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Soportar payload con message wrapper (Vapi estándar) o al nivel raíz
    const message = body?.message ?? (body?.type ? body : null)

    // Solo procesamos cuando termina la llamada
    if (message?.type !== 'end-of-call-report') {
      console.log('[vapi-webhook] ignorado tipo:', msgType)
      return NextResponse.json({ ok: true, ignored: true })
    }

    console.log('[vapi-webhook] end-of-call-report recibido')
    console.log('[vapi-webhook] structuredData:', JSON.stringify(message?.analysis?.structuredData))
    console.log('[vapi-webhook] transcript length:', message?.transcript?.length ?? 0)

    const analisis = message?.analysis?.structuredData

    // Si no hay structuredData, guardamos igual con lo que tengamos del transcript
    const tipoRaw = analisis?.tipo_pedido ?? 'pickup'
    const tipoValido = (['pickup', 'delivery', 'mesa'] as const).includes(tipoRaw) ? tipoRaw : 'pickup'

    const nuevoPedido: Partial<Pedido> = {
      restaurante_id: message.call?.metadata?.restaurante_id ?? '00000000-0000-0000-0000-000000000001',
      cliente_telefono: message.call?.customer?.number ?? message.customer?.number ?? 'desconocido',
      cliente_nombre: analisis?.nombre_cliente ?? 'Cliente',
      items: analisis?.items ?? [],
      total_estimado: analisis?.total ?? 0,
      tipo: tipoValido,
      estado: 'pendiente',
      notas: analisis?.notas ?? (analisis ? undefined : '⚠️ Sin datos estructurados — ver transcripción'),
      transcripcion: message.transcript,
      duracion_llamada_segundos: message.durationSeconds ? Math.round(message.durationSeconds) : undefined,
    }

    // Guardar en Supabase
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .insert(nuevoPedido)
      .select()
      .single()

    if (error) {
      console.error('[vapi-webhook] Error Supabase:', error)
      throw error
    }

    console.log('[vapi-webhook] Pedido guardado id=', data.id)

    // Disparar webhook de n8n (notifica Telegram)
    if (process.env.N8N_WEBHOOK_URL) {
      const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido: data }),
      }).catch((e) => { console.error('[vapi-webhook] n8n fetch error:', e); return null })
      console.log('[vapi-webhook] n8n status:', n8nRes?.status ?? 'failed')
    }

    return NextResponse.json({ ok: true, pedido_id: data.id })
  } catch (err) {
    console.error('[vapi-webhook] Error interno:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
