import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { EstadoPedido } from '@/types'

// GET /api/pedidos — listar pedidos del día
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const restaurante_id = searchParams.get('restaurante_id') ?? 'demo'
  const fecha = searchParams.get('fecha') ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .select('*')
    .eq('restaurante_id', restaurante_id)
    .gte('creado_en', `${fecha}T00:00:00`)
    .lte('creado_en', `${fecha}T23:59:59`)
    .order('creado_en', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/pedidos — actualizar estado de un pedido
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, estado }: { id: string; estado: EstadoPedido } = body

  if (!id || !estado) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
