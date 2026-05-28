export type EstadoPedido = 'pendiente' | 'confirmado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado'
export type TipoPedido = 'pickup' | 'delivery' | 'mesa'

export const DEMO_RESTAURANTE_ID = '00000000-0000-0000-0000-000000000001'

export interface Pedido {
  id: string
  restaurante_id: string
  cliente_telefono: string
  cliente_nombre?: string
  items: ItemPedido[]
  total_estimado: number
  tipo: TipoPedido
  estado: EstadoPedido
  direccion_entrega?: string
  notas?: string
  transcripcion?: string
  duracion_llamada_segundos?: number
  creado_en: string
  actualizado_en: string
}

export interface ItemPedido {
  nombre: string
  cantidad: number
  precio_unitario: number
  notas?: string
}

export interface Restaurante {
  id: string
  nombre: string
  telefono: string
  telegram_chat_id?: string
  google_sheet_id?: string
  horario_apertura: string
  horario_cierre: string
  activo: boolean
  creado_en: string
}

export interface Cliente {
  id: string
  telefono: string
  nombre?: string
  restaurante_id: string
  total_pedidos: number
  ultimo_pedido?: string
  creado_en: string
}
