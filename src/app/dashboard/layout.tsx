import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Panel de Pedidos · La Taquería del Norte',
  description: 'Dashboard de pedidos en tiempo real',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-900">
      {children}
    </div>
  )
}
