'use client'

import { useEffect, useState, useCallback } from 'react'
import { Pedido, EstadoPedido } from '@/types'

const TIPO_CONFIG = {
  delivery: { icon: '🛵', label: 'Delivery', color: 'text-blue-400' },
  mesa:     { icon: '🪑', label: 'Mesa',     color: 'text-purple-400' },
  pickup:   { icon: '🛍️', label: 'Para llevar', color: 'text-amber-400' },
}

function RelojEnVivo() {
  const [hora, setHora] = useState('')
  useEffect(() => {
    const tick = () => setHora(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])
  return <span>{hora}</span>
}

function TiempoTranscurrido({ desde }: { desde: string }) {
  const [mins, setMins] = useState(0)
  useEffect(() => {
    const calc = () => setMins(Math.floor((Date.now() - new Date(desde).getTime()) / 60000))
    calc()
    const t = setInterval(calc, 30000)
    return () => clearInterval(t)
  }, [desde])
  const color = mins < 10 ? 'text-emerald-400' : mins < 20 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-mono text-xs font-bold ${color}`}>{mins}m</span>
}

function TarjetaPedido({ pedido, onCambiarEstado }: { pedido: Pedido; onCambiarEstado: (id: string, estado: EstadoPedido) => void }) {
  const tipo = TIPO_CONFIG[pedido.tipo] ?? TIPO_CONFIG.pickup
  const esPendiente = pedido.estado === 'pendiente'
  const esConfirmado = pedido.estado === 'confirmado'
  const esPreparando = pedido.estado === 'en_preparacion'
  const esListo = pedido.estado === 'listo'

  const borderColor = esPendiente
    ? 'border-l-amber-400'
    : esConfirmado
    ? 'border-l-blue-400'
    : esPreparando
    ? 'border-l-purple-400'
    : esListo
    ? 'border-l-emerald-400'
    : 'border-l-slate-600'

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 border-l-4 ${borderColor} p-4 flex flex-col gap-3`}>
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${tipo.color}`}>{tipo.icon} {tipo.label}</span>
            {pedido.cliente_nombre && (
              <span className="text-white font-bold text-sm truncate">{pedido.cliente_nombre}</span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-0.5 font-mono">{pedido.cliente_telefono}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <TiempoTranscurrido desde={pedido.creado_en} />
          <span className="text-slate-500 text-xs">
            {new Date(pedido.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-slate-700/50">
        {pedido.items.map((item, i) => (
          <li key={i} className="flex justify-between items-baseline py-1.5">
            <div>
              <span className="text-white font-medium text-sm">
                <span className="text-slate-400 font-mono mr-1">{item.cantidad}×</span>{item.nombre}
              </span>
              {item.notas && (
                <p className="text-amber-400 text-xs mt-0.5 italic">— {item.notas}</p>
              )}
            </div>
            <span className="text-slate-400 text-xs font-mono ml-3 shrink-0">
              ${(item.cantidad * item.precio_unitario).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      {/* Nota general */}
      {pedido.notas && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <p className="text-amber-300 text-xs">📝 {pedido.notas}</p>
        </div>
      )}

      {/* Footer: total + acción */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
        <span className="text-white font-bold text-base">${pedido.total_estimado?.toFixed(2)}</span>
        <div className="flex gap-2">
          {esPendiente && (
            <>
              <button
                onClick={() => onCambiarEstado(pedido.id, 'confirmado')}
                className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Confirmar
              </button>
              <button
                onClick={() => onCambiarEstado(pedido.id, 'cancelado')}
                className="bg-slate-700 hover:bg-red-900/60 active:scale-95 text-slate-300 text-sm px-3 py-2 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
            </>
          )}
          {esConfirmado && (
            <button
              onClick={() => onCambiarEstado(pedido.id, 'en_preparacion')}
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all"
            >
              En cocina
            </button>
          )}
          {esPreparando && (
            <button
              onClick={() => onCambiarEstado(pedido.id, 'listo')}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all"
            >
              Listo ✓
            </button>
          )}
          {esListo && (
            <button
              onClick={() => onCambiarEstado(pedido.id, 'entregado')}
              className="bg-slate-600 hover:bg-slate-500 active:scale-95 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all"
            >
              Entregado
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Columna({
  titulo,
  accent,
  pedidos,
  onCambiarEstado,
  vacia,
}: {
  titulo: string
  accent: string
  pedidos: Pedido[]
  onCambiarEstado: (id: string, estado: EstadoPedido) => void
  vacia: string
}) {
  return (
    <div className="flex flex-col min-h-0">
      <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${accent}`}>
        <h2 className="text-white font-bold text-base tracking-wide">{titulo}</h2>
        {pedidos.length > 0 && (
          <span className="bg-white/10 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pedidos.length}</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {pedidos.length === 0 ? (
          <p className="text-slate-600 text-sm text-center mt-8 select-none">{vacia}</p>
        ) : (
          pedidos.map(p => (
            <TarjetaPedido key={p.id} pedido={p} onCambiarEstado={onCambiarEstado} />
          ))
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [pulsando, setPulsando] = useState(false)

  const cargarPedidos = useCallback(async () => {
    try {
      const res = await fetch('/api/pedidos?restaurante_id=00000000-0000-0000-0000-000000000001')
      const data = await res.json()
      setPedidos(Array.isArray(data) ? data : [])
      setUltimaActualizacion(new Date())
    } catch {
      // mantener los datos anteriores si falla la red
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarPedidos()
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

  const refrescarManual = async () => {
    setPulsando(true)
    await cargarPedidos()
    setTimeout(() => setPulsando(false), 600)
  }

  const pendientes    = pedidos.filter(p => p.estado === 'pendiente')
  const confirmados   = pedidos.filter(p => p.estado === 'confirmado')
  const preparando    = pedidos.filter(p => p.estado === 'en_preparacion')
  const listos        = pedidos.filter(p => p.estado === 'listo')
  const historial     = pedidos.filter(p => ['entregado', 'cancelado'].includes(p.estado))
  const total_dia     = pedidos
    .filter(p => !['cancelado'].includes(p.estado))
    .reduce((s, p) => s + (p.total_estimado ?? 0), 0)

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden select-none">

      {/* ── HEADER ── */}
      <header className="shrink-0 bg-slate-800 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">�</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Pavéland NYC</h1>
            <p className="text-slate-400 text-xs">Panel de pedidos · erosdigitalteam.com/pavelan</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Totales rápidos */}
          <div className="hidden sm:flex items-center gap-4 text-center">
            <div>
              <p className="text-amber-400 font-black text-xl leading-none">{pendientes.length}</p>
              <p className="text-slate-500 text-xs">Nuevos</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-purple-400 font-black text-xl leading-none">{preparando.length}</p>
              <p className="text-slate-500 text-xs">Cocina</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-emerald-400 font-black text-xl leading-none">{listos.length}</p>
              <p className="text-slate-500 text-xs">Listos</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-white font-black text-xl leading-none">${total_dia.toFixed(0)}</p>
              <p className="text-slate-500 text-xs">Total día</p>
            </div>
          </div>

          {/* Reloj + botón refresco */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-mono text-lg font-semibold leading-none"><RelojEnVivo /></p>
              {ultimaActualizacion && (
                <p className="text-slate-500 text-xs">
                  act. {ultimaActualizacion.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
            </div>
            <button
              onClick={refrescarManual}
              className={`p-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all ${pulsando ? 'animate-spin' : ''}`}
              title="Refrescar ahora"
            >
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENIDO ── */}
      {cargando ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Cargando pedidos…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-slate-700/60">

          {/* Columna 1: Nuevos */}
          <div className="flex flex-col overflow-hidden p-4">
            <Columna
              titulo="🔔 Nuevos"
              accent="border-amber-400"
              pedidos={pendientes}
              onCambiarEstado={cambiarEstado}
              vacia="Sin pedidos nuevos"
            />
          </div>

          {/* Columna 2: Confirmados */}
          <div className="flex flex-col overflow-hidden p-4">
            <Columna
              titulo="✅ Confirmados"
              accent="border-blue-400"
              pedidos={confirmados}
              onCambiarEstado={cambiarEstado}
              vacia="Sin pedidos confirmados"
            />
          </div>

          {/* Columna 3: En cocina */}
          <div className="flex flex-col overflow-hidden p-4">
            <Columna
              titulo="👨‍🍳 En cocina"
              accent="border-purple-400"
              pedidos={preparando}
              onCambiarEstado={cambiarEstado}
              vacia="Cocina libre"
            />
          </div>

          {/* Columna 4: Listos + historial */}
          <div className="flex flex-col overflow-hidden p-4 gap-4">
            <Columna
              titulo="🛎️ Listos"
              accent="border-emerald-400"
              pedidos={listos}
              onCambiarEstado={cambiarEstado}
              vacia="Ninguno listo aún"
            />
            {historial.length > 0 && (
              <div className="shrink-0">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-700/50">
                  <h2 className="text-slate-500 font-semibold text-xs uppercase tracking-widest">Historial</h2>
                  <span className="text-slate-600 text-xs">{historial.length}</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {historial.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-800/50">
                      <span className="text-slate-500">{p.cliente_nombre || p.cliente_telefono}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">${p.total_estimado?.toFixed(2)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${p.estado === 'entregado' ? 'bg-slate-700 text-slate-400' : 'bg-red-900/40 text-red-400'}`}>
                          {p.estado === 'entregado' ? '✓' : '✕'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
