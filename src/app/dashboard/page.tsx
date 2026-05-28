'use client'

import { useEffect, useState, useCallback } from 'react'
import { Pedido, EstadoPedido } from '@/types'

const ESTADOS_COLOR: Record<EstadoPedido, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmado: 'bg-blue-100 text-blue-800 border-blue-300',
  en_preparacion: 'bg-purple-100 text-purple-800 border-purple-300',
  listo: 'bg-green-100 text-green-800 border-green-300',
  entregado: 'bg-gray-100 text-gray-600 border-gray-300',
  cancelado: 'bg-red-100 text-red-800 border-red-300',
}

const ESTADOS_LABEL: Record<EstadoPedido, string> = {
  pendiente: '⏳ Pendiente',
  confirmado: '✅ Confirmado',
  en_preparacion: '👨‍🍳 Preparando',
  listo: '🛎️ Listo',
  entregado: '📦 Entregado',
  cancelado: '❌ Cancelado',
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarPedidos = useCallback(async () => {
    const res = await fetch('/api/pedidos?restaurante_id=00000000-0000-0000-0000-000000000001')
    const data = await res.json()
    setPedidos(data)
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarPedidos()
    // Recargar cada 20 segundos automáticamente
    const intervalo = setInterval(cargarPedidos, 20000)
    return () => clearInterval(intervalo)
  }, [cargarPedidos])

  const cambiarEstado = async (id: string, estado: EstadoPedido) => {
    await fetch('/api/pedidos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    cargarPedidos()
  }

  const pendientes = pedidos.filter(p => p.estado === 'pendiente')
  const activos = pedidos.filter(p => ['confirmado', 'en_preparacion', 'listo'].includes(p.estado))
  const total_dia = pedidos
    .filter(p => p.estado !== 'cancelado')
    .reduce((sum, p) => sum + (p.total_estimado ?? 0), 0)

  return (
    <main className="min-h-screen bg-orange-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-orange-600">🍽️ La Taquería del Norte</h1>
          <p className="text-sm text-gray-500">Panel de pedidos en tiempo real</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total del día</p>
          <p className="text-xl font-bold text-green-600">${total_dia.toFixed(2)}</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-yellow-100 rounded-xl p-3 text-center border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{pendientes.length}</p>
          <p className="text-xs text-yellow-600">Nuevos</p>
        </div>
        <div className="bg-purple-100 rounded-xl p-3 text-center border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{activos.length}</p>
          <p className="text-xs text-purple-600">En proceso</p>
        </div>
        <div className="bg-green-100 rounded-xl p-3 text-center border border-green-200">
          <p className="text-2xl font-bold text-green-700">{pedidos.filter(p => p.estado === 'entregado').length}</p>
          <p className="text-xs text-green-600">Entregados</p>
        </div>
      </div>

      {/* Lista de pedidos */}
      {cargando ? (
        <p className="text-center text-gray-400 mt-10">Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">Sin pedidos por ahora 🎉</p>
      ) : (
        <div className="space-y-3">
          {pedidos.map(pedido => (
            <div key={pedido.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800">
                    {pedido.tipo === 'delivery' ? '🛵 Delivery' : pedido.tipo === 'mesa' ? '🪑 Mesa' : '🛍️ Para llevar'}
                    {' · '}
                    <span className="text-gray-500 font-normal">{pedido.cliente_telefono}</span>
                  </p>
                  {pedido.cliente_nombre && (
                    <p className="text-sm text-gray-500">{pedido.cliente_nombre}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${ESTADOS_COLOR[pedido.estado]}`}>
                  {ESTADOS_LABEL[pedido.estado]}
                </span>
              </div>

              {/* Items */}
              <ul className="text-sm text-gray-700 mb-3 space-y-1">
                {pedido.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.cantidad}x {item.nombre} {item.notas && <span className="text-orange-500 text-xs">({item.notas})</span>}</span>
                    <span className="text-gray-400">${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {pedido.notas && (
                <p className="text-xs text-orange-600 bg-orange-50 rounded p-2 mb-3">📝 {pedido.notas}</p>
              )}

              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800">${pedido.total_estimado?.toFixed(2)}</p>
                <div className="flex gap-2">
                  {pedido.estado === 'pendiente' && (
                    <>
                      <button onClick={() => cambiarEstado(pedido.id, 'confirmado')}
                        className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                        ✅ Confirmar
                      </button>
                      <button onClick={() => cambiarEstado(pedido.id, 'cancelado')}
                        className="bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-lg font-medium">
                        ❌ Cancelar
                      </button>
                    </>
                  )}
                  {pedido.estado === 'confirmado' && (
                    <button onClick={() => cambiarEstado(pedido.id, 'en_preparacion')}
                      className="bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                      👨‍🍳 Preparando
                    </button>
                  )}
                  {pedido.estado === 'en_preparacion' && (
                    <button onClick={() => cambiarEstado(pedido.id, 'listo')}
                      className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                      🛎️ Listo
                    </button>
                  )}
                  {pedido.estado === 'listo' && (
                    <button onClick={() => cambiarEstado(pedido.id, 'entregado')}
                      className="bg-gray-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                      📦 Entregado
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-300 mt-2">
                {new Date(pedido.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
