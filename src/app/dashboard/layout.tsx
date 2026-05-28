import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Panel de Pedidos',
  description: 'Dashboard del restaurante — pedidos en tiempo real',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#f97316',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
